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
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Province } from '../../provinces/entities/province.entity';
import { City } from '../../provinces/entities/city.entity';
import { Image } from '../../images/entities/image.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn({ name: 'product_id' })
  productId: number;

  @Column({ name: 'seller_id' })
  sellerId: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ length: 20, default: 'used' })
  condition: string;

  @Column({ name: 'province_id' })
  provinceId: number;

  @Column({ name: 'city_id' })
  cityId: number;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'is_negotiable', default: true })
  isNegotiable: boolean;

  @Column({ length: 20, default: 'available' })
  status: string;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;


  @Column({ default: false })
  isVip: boolean;

  @Column({ type: 'timestamp', nullable: true })
  vipExpiryDate: Date;

  @Column({name:'old_price',type:'decimal' , precision:10 , scale:0,nullable:true})
  oldPrice: number;
  @Column({ name:'offer_expires_at', type: 'timestamp', nullable: true })
  offerExpiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Province)
  @JoinColumn({ name: 'province_id' })
  province: Province;

  @ManyToOne(() => City)
  @JoinColumn({ name: 'city_id' })
  city: City;

  @OneToMany(() => Image, (image) => image.product)
  images: Image[];
}