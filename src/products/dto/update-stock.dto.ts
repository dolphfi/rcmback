import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStockDto {
    @ApiProperty({ description: 'ID of the PricingStock (variant)' })
    @IsString()
    @IsNotEmpty()
    pricingStockId: string;

    @ApiProperty({ description: 'ID of the Point of Sale' })
    @IsString()
    @IsNotEmpty()
    posId: string;

    @ApiProperty({ description: 'Quantity to add to current stock', example: 10 })
    @IsNumber()
    @Min(1)
    quantity: number;
}
