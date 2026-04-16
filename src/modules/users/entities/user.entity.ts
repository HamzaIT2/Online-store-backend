import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Province } from '../../provinces/entities/province.entity';
import { City } from '../../provinces/entities/city.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('users')
export class User {
  [x: string]: any;
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  @Exclude() // Exclude from response
  passwordHash: string;

  @Column({ name: 'full_name', length: 100 })
  fullName: string;

  @Column({ name: 'full_name_ar', length: 100, nullable: true })
  fullNameAr: string;

  @Column({ name: 'phone_number', unique: true, length: 20 })
  phoneNumber: string;

  @Column({ name: 'province_id', nullable: true })
  provinceId: number;

  @Column({ name: 'city_id', nullable: true })
  cityId: number;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'profile_image', length: 255, nullable: true })
  profileImage: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    name: 'rating_average',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0.0,
  })
  ratingAverage: number;

  @Column({ name: 'total_sales', default: 0 })
  totalSales: number;

  /// new column for role 
  @Column({
    type: 'enum',
    enum: ['user', 'admin'],
    default: 'user'
  })
  role: 'user' | 'admin';

  @Column({
    type: 'enum',
    enum: ['buyer', 'seller', 'both'],
    default: 'both',
    nullable: true
  })
  userType: 'buyer' | 'seller' | 'both';

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpiry: Date;

  @Column({ nullable: true })
  verificationCode: string;

  @Column({ type: 'timestamp', nullable: true })
  verificationCodeExpiry: Date;


  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Province, { nullable: true })
  @JoinColumn({ name: 'province_id' })
  province: Province;

  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: City;

  @OneToMany(() => Transaction, transaction => transaction.buyer)
  purchases: Transaction[];

  @OneToMany(() => Transaction, transaction => transaction.seller)
  sales: Transaction[];
}