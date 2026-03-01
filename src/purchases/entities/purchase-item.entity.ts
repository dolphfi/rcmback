import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Purchase } from './purchase.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('purchase_items')
export class PurchaseItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Purchase, (purchase) => purchase.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'purchaseId' })
  purchase: Purchase;

  @Column()
  purchaseId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  costPrice: number;

  @Column({ type: 'int' })
  qty: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;
}
