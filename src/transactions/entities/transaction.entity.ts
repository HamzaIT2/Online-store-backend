import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Product } from '../../modules/products/entities/product.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column()
  buyerId: number;

  @Column()
  sellerId: number;

  @Column('decimal')
  amount: number;

  @Column({ default: 'completed' })
  status: string;

  @ManyToOne(() => User, user => user.purchases)
  buyer: User;

  @ManyToOne(() => User, user => user.sales)
  seller: User;

  @ManyToOne(() => Product, product => product.transaction)
  product: Product;

  @CreateDateColumn()
  createdAt: Date;
}
