import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Electronics',
    description: 'Le nom de la catégorie',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Devices and gadgets',
    description: 'Description de la catégorie',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Si la catégorie est active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: 'product',
    description: 'Le type de catégorie (product ou service)',
    enum: ['product', 'service'],
    default: 'product',
  })
  @IsString()
  @IsOptional()
  type?: 'product' | 'service';

  @ApiProperty({
    example: 'uuid-parent',
    description: 'ID de la catégorie parente',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
