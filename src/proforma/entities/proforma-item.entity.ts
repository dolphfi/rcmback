import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Proforma } from './proforma.entity';
import { Product } from '../../products/entities/product.entity';
import { Service } from '../../services/entities/service.entity';

@Entity('proforma_items')
export class ProformaItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Proforma, (proforma) => proforma.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'proformaId' })
  proforma: Proforma;

  @Column()
  proformaId: string;

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
  name: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  qty: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;
}
