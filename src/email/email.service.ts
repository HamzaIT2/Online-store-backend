import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(email: string, verificationCode: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Account',
        html: `
          <h3>Welcome to Iraq Marketplace!</h3>
          <p>Your verification code is: <b style="font-size: 20px; color: #007bff;">${verificationCode}</b></p>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Your Password',
        html: `
          <h3>Password Reset Request</h3>
          <p>You requested to reset your password. Click the link below to proceed:</p>
          <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  async resendVerificationEmail(email: string, verificationCode: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'New Verification Code',
        html: `
          <h3>New Verification Code</h3>
          <p>Your new verification code is: <b style="font-size: 20px; color: #007bff;">${verificationCode}</b></p>
          <p>This code will expire in 15 minutes.</p>
        `,
      });
      this.logger.log(`Resent verification code to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to resend verification email to ${email}:`, error);
      throw error;
    }
  }
}
