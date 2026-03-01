import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { PromotionType } from '../entities/promotion.entity';

export class CreatePromotionDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsEnum(PromotionType)
    type: PromotionType;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    value: number;

    @IsNotEmpty()
    @IsDateString()
    startDate: string;

    @IsNotEmpty()
    @IsDateString()
    endDate: string;

    @IsOptional()
    isActive?: boolean;
}

export class UpdatePromotionDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsEnum(PromotionType)
    type?: PromotionType;

    @IsOptional()
    @IsNumber()
    @Min(0)
    value?: number;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    isActive?: boolean;
}
