import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { PricingStock } from './pricing-stock.entity';
import { ProductImage } from './product-image.entity';
import { Warranty } from './warranty.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true })
  description: string;

  @Column({ unique: true, nullable: true })
  slug: string;

  @Column({ nullable: true })
  sellingType: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  barcodeSymbology: string;

  @Column({ default: 'single' })
  productType: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ type: 'timestamp', nullable: true })
  manufacturedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate: Date;

  @Column({ nullable: true })
  subCategoryId: string;

  @Column({ nullable: true })
  warranties: string;

  @ManyToOne(() => Warranty, (warranty) => warranty.products, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'warrantyId' })
  warranty: Warranty;

  @Column({ nullable: true })
  warrantyId: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => Brand, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column({ nullable: true })
  brandId: string;

  @OneToMany(() => PricingStock, (pricingStock) => pricingStock.product, {
    cascade: true,
  })
  pricingStocks: PricingStock[];

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
