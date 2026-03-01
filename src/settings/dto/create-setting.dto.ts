import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { SettingKey } from '../../utility/common/enum/setting-keys.enum';

export class CreateSettingDto {
  @ApiProperty({
    description: 'Clé unique pour le paramètre.',
    enum: SettingKey,
    example: SettingKey.MAINTENANCE_MODE,
  })
  @IsEnum(SettingKey)
  @IsNotEmpty()
  key: SettingKey;

  @ApiProperty({ example: '5000', description: 'Valeur du paramètre.' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({
    example: "Frais de l'institution",
    description: 'Nom lisible du paramètre.',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
    example: "Définit le frais de l'institution.",
    description: 'Description détaillée du rôle du paramètre.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
