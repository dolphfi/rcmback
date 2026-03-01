import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John', description: 'Prénom du client' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Nom du client' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email du client',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '50933334444',
    description: 'Numéro de téléphone',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Port-au-Prince, Haiti',
    description: 'Adresse',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 0, description: 'Points de fidélité', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  loyaltyPoints?: number;

  @ApiProperty({ example: true, description: 'Statut actif', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
