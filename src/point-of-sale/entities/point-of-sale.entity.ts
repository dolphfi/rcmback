import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Sale } from '../../sales/entities/sale.entity';

@Entity('point_of_sales')
export class PointOfSale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: ['store', 'warehouse'],
    default: 'store',
  })
  type: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 'standard' })
  receiptTemplate: string;

  @OneToMany(() => User, (user) => user.pointOfSale)
  users: User[];

  @OneToMany(() => Sale, (sale) => sale.pos)
  sales: Sale[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
