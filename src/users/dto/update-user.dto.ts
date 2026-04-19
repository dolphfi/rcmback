import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'John',
    description: "Prénom de l'utilisateur",
  })
  @IsOptional()
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le prénom ne doit pas dépasser 50 caractères' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: "Nom de l'utilisateur" })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le nom ne doit pas dépasser 50 caractères' })
  lastName?: string;

  @ApiPropertyOptional({
    example: '+33612345678',
    description: 'Nouveau numéro de téléphone',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, {
    message: 'Format de numéro de téléphone invalide',
  })
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: "Nouvelle URL de l'avatar",
  })
  @IsOptional()
  @IsUrl({}, { message: "Format d'URL d'avatar invalide" })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'uuid-role', description: 'Nouveau rôle' })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({
    example: 'uuid-pos',
    description: 'Point de vente assigné',
  })
  @IsOptional()
  @IsString()
  posId?: string;

  @ApiPropertyOptional({ example: false, description: "Statut actif de l'utilisateur" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
