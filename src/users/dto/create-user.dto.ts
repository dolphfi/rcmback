import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'John', description: "Prénom de l'utilisateur" })
  @IsNotEmpty({ message: 'Le prénom est requis' })
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: "Nom de l'utilisateur" })
  @IsNotEmpty({ message: 'Le nom est requis' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: "Email de l'utilisateur",
  })
  @IsNotEmpty({ message: "L'email est requis" })
  @IsEmail({}, { message: "Format d'email invalide" })
  email: string;

  @ApiProperty({
    example: '+33612345678',
    description: 'Numéro de téléphone',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber(undefined, {
    message: 'Format de numéro de téléphone invalide',
  })
  phone?: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Mot de passe (min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial)',
  })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)',
    },
  )
  password: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Confirmation du mot de passe',
  })
  @IsNotEmpty({ message: 'La confirmation du mot de passe est requise' })
  @MinLength(8, {
    message:
      'La confirmation du mot de passe doit contenir au moins 8 caractères',
  })
  confirmPassword: string;

  @ApiProperty({
    description: "ID du rôle de l'utilisateur",
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiProperty({
    description: "ID du Point de Vente (POS) de l'utilisateur",
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  posId?: string;

  @ApiProperty({
    description: "URL de l'avatar de l'utilisateur",
    required: false,
    example: 'https://example.com/avatar.png',
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    description: 'Alias pour roleId',
    required: false,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsString()
  role?: string;
}
