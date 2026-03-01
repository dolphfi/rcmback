import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Role } from '../../roles/entities/role.entity';
import { PointOfSale } from '../../point-of-sale/entities/point-of-sale.entity';

@Entity()
export class User {
  private readonly TEMP_LOCK_AFTER_ATTEMPTS = 3; // Verrouillage temporaire après 3 tentatives
  private readonly MAX_LOGIN_ATTEMPTS = 5; // Verrouillage définitif après 5 tentatives
  private readonly LOCK_TIME_MINUTES = 5; // Durée du verrouillage temporaire
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @Column({ unique: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Exclude() // Ne jamais renvoyer le mot de passe dans les réponses
  password: string;

  @Column({ unique: true, nullable: true })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ name: 'roleId' })
  roleId: string;

  @ManyToOne(() => PointOfSale, (pos) => pos.users, { nullable: true })
  @JoinColumn({ name: 'posId' })
  pointOfSale?: PointOfSale;

  @Column({ name: 'posId', nullable: true })
  posId?: string;

  @Column({ nullable: true })
  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/v12345/sample.jpg',
    description: "URL de l'avatar de l'utilisateur",
    required: false,
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  @Exclude() // Generally not needed in API responses
  avatarPublicId?: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ default: 0 })
  loginAttempts: number;

  @Column({ type: 'datetime', nullable: true })
  @Exclude()
  lockoutUntil?: Date | null;

  // Réinitialisation du mot de passe
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  resetPasswordToken?: string | null;

  @Column({ type: 'datetime', nullable: true })
  @Exclude()
  resetPasswordExpires?: Date | null;

  @Column({ nullable: true })
  @Exclude()
  verificationToken?: string;

  // Méthodes
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Hacher le mot de passe uniquement s'il a été modifié et n'est pas déjà un hash bcrypt
    // Les hashs Bcrypt commencent typiquement par $2a$, $2b$, ou $2y$, suivi du coût, puis $
    if (this.password && !/^\$2[aby]\$\d{2}\$/.test(this.password)) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  isLockedOut(): {
    isLocked: boolean;
    remainingTime?: number;
    isPermanent?: boolean;
    message: string;
  } {
    console.log(
      `[UserEntity/isLockedOut] CHECK - UserID: ${this.id}, Attempts: ${this.loginAttempts}, LockoutUntil: ${this.lockoutUntil}`,
    );
    if (!this.lockoutUntil) {
      console.log(
        `[UserEntity/isLockedOut] RESULT - UserID: ${this.id} - Not locked (no lockoutUntil)`,
      );
      return {
        isLocked: false,
        message: 'Compte actif',
      };
    }

    const now = new Date();
    const lockoutUntilDate = new Date(this.lockoutUntil);

    // Vérifier si le compte est verrouillé définitivement (5 tentatives)
    if (this.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      console.log(
        `[UserEntity/isLockedOut] RESULT - UserID: ${this.id} - Permanent lock`,
      );
      return {
        isLocked: true,
        isPermanent: true,
        message:
          'Votre compte est verrouillé définitivement suite à trop de tentatives de connexion. Veuillez contacter le service client au 0123456789.',
      };
    }

    // Vérifier si le compte est encore verrouillé temporairement (après 3 tentatives)
    if (
      this.loginAttempts >= this.TEMP_LOCK_AFTER_ATTEMPTS &&
      now < lockoutUntilDate
    ) {
      console.log(
        `[UserEntity/isLockedOut] RESULT - UserID: ${this.id} - Temporary lock`,
      );
      const remainingTime = Math.ceil(
        (lockoutUntilDate.getTime() - now.getTime()) / (1000 * 60),
      ); // en minutes
      const remainingAttempts = this.MAX_LOGIN_ATTEMPTS - this.loginAttempts;
      return {
        isLocked: true,
        remainingTime,
        message: `Votre compte est temporairement verrouillé. Veuillez réessayer dans ${remainingTime} minute${remainingTime > 1 ? 's' : ''}. Il vous reste ${remainingAttempts} tentative${remainingAttempts > 1 ? 's' : ''} avant le verrouillage définitif.`,
      };
    }

    console.log(
      `[UserEntity/isLockedOut] RESULT - UserID: ${this.id} - Not locked (conditions not met or expired)`,
    );
    return {
      isLocked: false,
      message: 'Compte actif',
    };
  }

  async incrementLoginAttempts(): Promise<void> {
    console.log(
      `[UserEntity/incrementLoginAttempts] START - UserID: ${this.id}, Current attempts: ${this.loginAttempts}, LockoutUntil: ${this.lockoutUntil}`,
    );
    this.loginAttempts += 1;

    // Verrouillage temporaire après 3 tentatives
    if (this.loginAttempts === this.TEMP_LOCK_AFTER_ATTEMPTS) {
      const lockoutUntil = new Date();
      lockoutUntil.setMinutes(
        lockoutUntil.getMinutes() + this.LOCK_TIME_MINUTES,
      );
      this.lockoutUntil = lockoutUntil;
      console.log(
        `[UserEntity/incrementLoginAttempts] TEMP LOCK APPLIED - UserID: ${this.id}, New LockoutUntil: ${this.lockoutUntil}`,
      );
    }

    // Verrouillage définitif après 5 tentatives
    if (this.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      this.lockoutUntil = new Date('2100-01-01'); // Date très future pour le verrouillage définitif
      console.log(
        `[UserEntity/incrementLoginAttempts] PERM LOCK APPLIED - UserID: ${this.id}, New LockoutUntil: ${this.lockoutUntil}`,
      );
    }
    console.log(
      `[UserEntity/incrementLoginAttempts] END - UserID: ${this.id}, New attempts: ${this.loginAttempts}, New LockoutUntil: ${this.lockoutUntil}`,
    );
  }

  resetLoginAttempts(): void {
    console.log(
      `[UserEntity/resetLoginAttempts] START - UserID: ${this.id}, Current attempts: ${this.loginAttempts}, LockoutUntil: ${this.lockoutUntil}`,
    );
    this.loginAttempts = 0;
    this.lockoutUntil = undefined;
    console.log(
      `[UserEntity/resetLoginAttempts] END - UserID: ${this.id}, New attempts: ${this.loginAttempts}, New LockoutUntil: ${this.lockoutUntil}`,
    );
  }

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
