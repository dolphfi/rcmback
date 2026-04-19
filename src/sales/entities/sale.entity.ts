import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { PointOfSale } from '../../point-of-sale/entities/point-of-sale.entity';
import { SaleItem } from './sale-item.entity';

export enum SellType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  SCAN = 'SCAN',
  SPLIT = 'SPLIT',
  CREDIT = 'CREDIT',
}

export enum SaleStatus {
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED',
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  receiptNumber: string;

  @ManyToOne(() => PointOfSale, (pos) => pos.sales)
  @JoinColumn({ name: 'posId' })
  pos: PointOfSale;

  @Column()
  posId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cashierId' })
  cashier: User;

  @Column()
  cashierId: string;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

  @Column({ nullable: true })
  customerId?: string;

  @Column({
    type: 'enum',
    enum: SellType,
    default: SellType.PRODUCT,
  })
  sellType: SellType;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ default: true })
  isPaid: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amountPaid: number;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.COMPLETED,
  })
  status: SaleStatus;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true })
  items: SaleItem[];

  @CreateDateColumn()
  createdAt: Date;
}
