import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // e.g., 'ADMIN', 'CASHIER'

  @Column()
  label: string; // e.g., 'Administrateur', 'Caissier'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json' })
  permissions: string[]; // e.g., ['manage_users', 'view_reports']

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
