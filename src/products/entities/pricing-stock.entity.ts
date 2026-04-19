import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductPosStock } from './product-pos-stock.entity';

@Entity('pricing_stocks')
export class PricingStock {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, nullable: true })
    sku: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    wholesalePrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    grandDealerPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    smallDealerPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    costPrice: number;

    @Column({ nullable: true })
    taxType: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    tax: number;

    @Column({ nullable: true })
    discountType: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discountValue: number;

    @Column({ type: 'int', default: 0 })
    quantityAlert: number;

    @Column({ nullable: true })
    variantName: string;

    @ManyToOne(() => Product, (product) => product.pricingStocks, {
        onDelete: 'CASCADE',
    })
    product: Product;

    @OneToMany(
        () => ProductPosStock,
        (posStock: ProductPosStock) => posStock.pricingStock,
        { cascade: true },
    )
    posStocks: ProductPosStock[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
