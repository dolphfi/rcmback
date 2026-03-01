import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { PointOfSale } from '../../point-of-sale/entities/point-of-sale.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { ProformaItem } from './proforma-item.entity';
import { SellType } from '../../sales/entities/sale.entity';

export enum ProformaStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Entity('proformas')
export class Proforma {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  proformaNumber: string;

  @ManyToOne(() => PointOfSale)
  @JoinColumn({ name: 'posId' })
  pos: PointOfSale;

  @Column()
  posId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

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

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({
    type: 'enum',
    enum: ProformaStatus,
    default: ProformaStatus.PENDING,
  })
  status: ProformaStatus;

  @Column({ type: 'date' })
  expiresAt: Date;

  @ManyToOne(() => Sale, { nullable: true })
  @JoinColumn({ name: 'convertedSaleId' })
  convertedSale?: Sale;

  @Column({ nullable: true })
  convertedSaleId?: string;

  @OneToMany(() => ProformaItem, (item) => item.proforma, { cascade: true })
  items: ProformaItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
