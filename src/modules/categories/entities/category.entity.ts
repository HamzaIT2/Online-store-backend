import { Product } from '../../products/entities/product.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn({ name: 'category_id' })
  categoryId: number;

  @Column({ name: 'parent_id', nullable: true })
  parentId: number;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'name_ar', length: 100 })
  nameAr: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  icon: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Category, (category) => category.subCategories, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parentCategory: Category;

  @OneToMany(() => Category, (category) => category.parentCategory)
  subCategories: Category[];

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}