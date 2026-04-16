import { Injectable, UnauthorizedException, ConflictException, BadRequestException, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../../email/email.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) { }

  // ----------------------------------------------------------------
  // 1. Validate User
  // ----------------------------------------------------------------
  async validateUserByPassword(email: string, pass: string): Promise<any> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) return null;

    const storedHash = user.passwordHash;
    if (!storedHash) return null;

    const isMatch = await bcrypt.compare(pass, storedHash);

    if (isMatch) {
      const { passwordHash, ...result } = user;
      return result;
    }

    return null;
  }

  // ----------------------------------------------------------------
  // 2. Login
  // ----------------------------------------------------------------
  async login(loginDto: LoginDto) {
    try {
      const user = await this.validateUserByPassword(loginDto.email, loginDto.password);

      if (!user) {
        throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }

      // التحقق من التفعيل
      if (!user.isVerified) {
        throw new UnauthorizedException('PENDING_VERIFICATION'); // فرونت اند يجب أن يعالج هذا الخطأ
      }

      const payload = { sub: user.userId, email: user.email, role: user.role };
      const token = this.jwtService.sign(payload);

      return {
        user: user,
        token: token,
      };

    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('حدث خطأ غير متوقع أثناء تسجيل الدخول');
    }
  }

  // ----------------------------------------------------------------
  // 3. Register
  // ----------------------------------------------------------------
  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: registerDto.email },
        { phoneNumber: registerDto.phone },
      ],
    });

    if (existingUser) {
      throw new ConflictException('البريد الإلكتروني أو الهاتف مستخدم بالفعل');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      fullName: registerDto.fullName,
      phoneNumber: registerDto.phone,
      passwordHash: hashedPassword,
      role: 'user',
      verificationCode: verificationCode,
      verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 دقيقة
      isVerified: false, // ✅ ضبط صريح للقيمة
      userType: registerDto.userType || 'both',
      provinceId: registerDto.province_id,
      cityId: registerDto.city_id,
    });

    const savedUser = await this.userRepository.save(newUser);

    // إرسال الإيميل
    try {
      await this.emailService.sendVerificationEmail(savedUser.email, verificationCode);
    } catch (e) {
      this.logger.error('Email sending failed:', e);
    }

    const { passwordHash, ...result } = savedUser;

    return {
      user: result,
      message: 'Registration successful. Please check your email for OTP.'
    };
  }

  // ----------------------------------------------------------------
  // 4. Verify Email
  // ----------------------------------------------------------------
  async verifyEmail(email: string, code: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) throw new BadRequestException('المستخدم غير موجود');

    if (user.isVerified) {
      // يمكننا إرجاع رسالة نجاح عادية بدلاً من خطأ إذا كان المستخدم يحاول تفعيل حساب مفعل أصلاً
      return { message: 'الحساب مفعل بالفعل، يمكنك تسجيل الدخول الآن.' };
    }

    // التحقق من الوقت
    if (user.verificationCodeExpiry && new Date() > new Date(user.verificationCodeExpiry)) {
      throw new BadRequestException('الرمز منتهي الصلاحية');
    }

    // التحقق من تطابق الكود (كنص)
    if (String(user.verificationCode).trim() !== String(code).trim()) {
      throw new BadRequestException('الرمز غير صحيح');
    }

    // تفعيل الحساب
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiry = null;

    await this.userRepository.save(user);

    const payload = { sub: user.userId, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Email verified successfully',
      token: token,
      user: {
        id: user.userId,
        email: user.email,
        role: user.role
      }
    };
  }

  // ----------------------------------------------------------------
  // 5. Resend Verification Code
  // ----------------------------------------------------------------
  async resendVerificationCode(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified) throw new BadRequestException('Account is already verified');

    // توليد كود وتاريخ جديد
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 15);

    // تحديث البيانات
    user.verificationCode = verificationCode;
    user.verificationCodeExpiry = expiryDate; // ✅ تم استخدام نفس الاسم الموحد

    await this.userRepository.save(user);

    try {
      await this.emailService.resendVerificationEmail(user.email, verificationCode);
    } catch (e) {
      this.logger.error('Failed to resend verification email:', e);
    }

    return {
      message: 'Verification code resent successfully',
    };
  }

  // ----------------------------------------------------------------
  // 6. Forgot & Reset Password
  // ----------------------------------------------------------------
  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('البريد الإلكتروني غير مسجل');

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = new Date(Date.now() + 3600 * 1000);
    await this.userRepository.save(user);

    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'Password reset email sent successfully' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: MoreThan(new Date()),
      },
    });

    if (!user) throw new UnauthorizedException('الرابط غير صالح أو انتهت صلاحيته');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;

    await this.userRepository.save(user);
    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }
}