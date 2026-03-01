import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PricingStockDto } from './pricing-stock.dto';
import { ProductImageDto } from './product-image.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15', description: 'Le nom du produit' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '123456789',
    description: 'Code-barres',
    required: false,
  })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({
    example: 'Apple iPhone 15...',
    description: 'Description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'uuid-category',
    description: 'ID de la catégorie',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    example: 'iphone-15',
    description: 'Slug unique',
    required: false,
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    example: 'retail',
    description: 'Type de vente',
    required: false,
  })
  @IsString()
  @IsOptional()
  sellingType?: string;

  @ApiProperty({ example: 'pc', description: 'Unité', required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({
    example: 'ean13',
    description: 'Symbologie code-barres',
    required: false,
  })
  @IsString()
  @IsOptional()
  barcodeSymbology?: string;

  @ApiProperty({
    example: 'single',
    description: 'Type de produit',
    default: 'single',
  })
  @IsString()
  @IsOptional()
  productType?: string;

  @ApiProperty({ example: 'Apple', description: 'Fabricant', required: false })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiProperty({ description: 'Date de fabrication', required: false })
  @IsOptional()
  manufacturedDate?: Date;

  @ApiProperty({ description: "Date d'expiration", required: false })
  @IsOptional()
  expiryDate?: Date;

  @ApiProperty({
    example: 'uuid-sub-category',
    description: 'ID de la sous-catégorie',
    required: false,
  })
  @IsString()
  @IsOptional()
  subCategoryId?: string;

  @ApiProperty({ example: '1 year', description: 'Garanties', required: false })
  @IsString()
  @IsOptional()
  warranties?: string;

  @ApiProperty({
    example: 'uuid-warranty',
    description: 'ID de la garantie',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  warrantyId?: string;

  @ApiProperty({
    example: 'uuid-brand',
    description: 'ID de la marque',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiProperty({ example: true, description: 'Statut actif', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    type: [PricingStockDto],
    description: 'Détails de prix et stock (variants)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingStockDto)
  @IsOptional()
  pricingStocks?: PricingStockDto[];

  @ApiProperty({ type: [ProductImageDto], description: 'Images du produit' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @IsOptional()
  images?: ProductImageDto[];
}
