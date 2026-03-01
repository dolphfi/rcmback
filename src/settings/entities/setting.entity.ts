import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SettingKey } from '../../utility/common/enum/setting-keys.enum';

@Entity('settings')
export class Setting {
  @ApiProperty({
    description: 'ID unique du paramètre',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description:
      'Clé unique et non modifiable pour le paramètre (utilisée dans le code).',
    enum: SettingKey,
    example: SettingKey.MAINTENANCE_MODE,
  })
  @Column({ type: 'enum', enum: SettingKey, unique: true, nullable: false })
  key: SettingKey;

  @ApiProperty({
    example: '2024-2025',
    description:
      'Valeur du paramètre. Peut contenir du texte simple, un nombre, ou du JSON.',
  })
  @Column({ type: 'text', nullable: false })
  value: string;

  @ApiProperty({
    example: 'Année Scolaire Actuelle',
    description:
      "Nom lisible du paramètre, affiché dans les interfaces d'administration.",
  })
  @Column({ nullable: false })
  label: string;

  @ApiProperty({
    example:
      "Définit l'année scolaire en cours pour les inscriptions et les rapports.",
    description: 'Description détaillée du rôle du paramètre.',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
