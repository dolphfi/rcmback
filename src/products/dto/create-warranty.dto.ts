import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWarrantyDto {
    @ApiProperty({ example: '1 Year Service Warranty' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 12, required: false })
    @IsNumber()
    @IsOptional()
    duration?: number;

    @ApiProperty({ example: 'months', enum: ['days', 'months', 'years'], required: false })
    @IsString()
    @IsOptional()
    @IsIn(['days', 'months', 'years'])
    durationUnit?: string;

    @ApiProperty({ example: 'Standard service warranty for electronic items', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 'service', enum: ['service', 'replacement', 'limited'], required: false })
    @IsString()
    @IsOptional()
    @IsIn(['service', 'replacement', 'limited'])
    type?: string;
}
