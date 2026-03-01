import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  IsArray,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SellType } from '../../sales/entities/sale.entity';
import { ProformaStatus } from '../entities/proforma.entity';

export class CreateProformaItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  qty: number;
}

export class CreateProformaDto {
  @IsNotEmpty()
  @IsUUID()
  posId: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsNotEmpty()
  @IsEnum(SellType)
  sellType: SellType;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProformaItemDto)
  items: CreateProformaItemDto[];

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
