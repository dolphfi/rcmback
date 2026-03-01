import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PricingStock } from './pricing-stock.entity';
import { PointOfSale } from '../../point-of-sale/entities/point-of-sale.entity';

@Entity('product_pos_stocks')
export class ProductPosStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PricingStock, (pricingStock) => pricingStock.posStocks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pricingStockId' })
  pricingStock: PricingStock;

  @Column()
  pricingStockId: string;

  @ManyToOne(() => PointOfSale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'posId' })
  pointOfSale: PointOfSale;

  @Column()
  posId: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
