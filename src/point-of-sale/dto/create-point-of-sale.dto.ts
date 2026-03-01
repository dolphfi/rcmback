import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePointOfSaleDto {
  @ApiProperty({ example: 'Main POS', description: 'Le nom du point de vente' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '123 Main St',
    description: "L'adresse du point de vente",
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: '50933334444',
    description: 'Le numéro de téléphone',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'store',
    description: 'Le type de point de vente',
    enum: ['store', 'warehouse'],
    default: 'store',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    example: true,
    description: 'Si le point de vente est actif',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: 'standard',
    description: 'Le modèle de reçu (ex: standard, minimal)',
    default: 'standard',
  })
  @IsString()
  @IsOptional()
  receiptTemplate?: string;
}
