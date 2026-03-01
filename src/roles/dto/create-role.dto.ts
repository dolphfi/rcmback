import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'ADMIN', description: 'Nom unique du rôle' })
  @IsNotEmpty({ message: 'Le nom du rôle est requis' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  name: string;

  @ApiProperty({
    example: 'Administrateur',
    description: 'Label lisible du rôle',
  })
  @IsNotEmpty({ message: 'Le label est requis' })
  @IsString()
  label: string;

  @ApiProperty({
    example: 'Accès complet au système',
    description: 'Description du rôle',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: "['manage_users', 'view_reports']",
    description: 'Liste des permissions',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
