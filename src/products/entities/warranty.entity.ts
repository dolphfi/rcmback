import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('warranties')
export class Warranty {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    duration: number; // e.g., 6, 12, 24

    @Column({ default: 'months' })
    durationUnit: string; // months, years, days

    @Column({ nullable: true, type: 'text' })
    description: string;

    @Column({ default: 'service' })
    type: string; // service, replacement, limited

    @OneToMany(() => Product, (product) => product.warranty)
    products: Product[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
