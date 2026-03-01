import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
  UNLOCK_ACCOUNT = 'UNLOCK_ACCOUNT',
  MAINTENANCE_TOGGLE = 'MAINTENANCE_TOGGLE',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string; // Using string to allow flexible action names beyond the enum if needed

  @Column({ nullable: true })
  entityName?: string; // e.g., 'Product', 'Sale', 'User'

  @Column({ nullable: true })
  entityId?: string; // ID of the affected resource

  @Column({ type: 'text', nullable: true })
  details?: string; // JSON string of the changes or payload

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;
}
