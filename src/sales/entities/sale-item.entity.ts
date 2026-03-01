import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sale } from './sale.entity';
import { Product } from '../../products/entities/product.entity';
import { Service } from '../../services/entities/service.entity';

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @Column()
  saleId: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column({ nullable: true })
  productId?: string;

  @ManyToOne(() => Service, { nullable: true })
  @JoinColumn({ name: 'serviceId' })
  service?: Service;

  @Column({ nullable: true })
  serviceId?: string;

  @Column()
  name: string; // Snapshotted name at time of sale

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number; // Snapshotted price at time of sale

  @Column({ type: 'int' })
  qty: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number; // price * qty
}
