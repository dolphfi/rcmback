import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ProductPosStockDto {
  @IsUUID()
  @IsNotEmpty()
  posId: string;

  @IsNumber()
  @Min(0)
  stock: number;
}

export class PricingStockDto {
  @ApiProperty({ example: 'SKU-001', required: false })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 85.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  wholesalePrice?: number;

  @ApiProperty({ example: 75.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  grandDealerPrice?: number;

  @ApiProperty({ example: 80.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiProperty({ example: 'inclusive', required: false })
  @IsString()
  @IsOptional()
  taxType?: string;

  @ApiProperty({ example: 15, required: false })
  @IsNumber()
  @IsOptional()
  tax?: number;

  @ApiProperty({ example: 'percentage', required: false })
  @IsString()
  @IsOptional()
  discountType?: string;

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @IsOptional()
  discountValue?: number;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @IsOptional()
  quantityAlert?: number;

  @ApiProperty({ example: 'Small', required: false })
  @IsString()
  @IsOptional()
  variantName?: string;

  @ApiProperty({
    type: [ProductPosStockDto],
    description: 'Stock par point de vente',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPosStockDto)
  @IsOptional()
  posStocks?: ProductPosStockDto[];
}
