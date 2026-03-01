import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BeforeInsert,
    BeforeUpdate,
} from 'typeorm';

export enum PromotionType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED = 'FIXED',
}

@Entity('promotions')
export class Promotion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    code: string;

    @Column({
        type: 'enum',
        enum: PromotionType,
        default: PromotionType.PERCENTAGE,
    })
    type: PromotionType;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    value: number;

    @Column({ type: 'timestamp' })
    startDate: Date;

    @Column({ type: 'timestamp' })
    endDate: Date;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @BeforeInsert()
    @BeforeUpdate()
    normalizeCode() {
        if (this.code) {
            this.code = this.code.toUpperCase().replace(/\s+/g, '');
        }
    }
}
