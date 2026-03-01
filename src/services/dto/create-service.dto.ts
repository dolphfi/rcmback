import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Haircut', description: 'Le nom du service' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Professional haircut...',
    description: 'Description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 25.0, description: 'Prix du service' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 'uuid-category',
    description: 'ID de la catégorie',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: true, description: 'Statut actif', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: ['uuid-pos1', 'uuid-pos2'],
    description: 'IDs des points de vente où le service est disponible',
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  posIds?: string[];
}
