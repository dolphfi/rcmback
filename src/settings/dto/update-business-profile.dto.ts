import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBusinessProfileDto {
    @ApiProperty({ example: 'Kolabo POS', required: false })
    @IsOptional()
    @IsString()
    BUSINESS_NAME?: string;

    @ApiProperty({ example: 'Inovasyon nan sèvis ou', required: false })
    @IsOptional()
    @IsString()
    BUSINESS_SLOGAN?: string;

    @ApiProperty({ example: '123 Rue de la Paix, Port-au-Prince', required: false })
    @IsOptional()
    @IsString()
    BUSINESS_ADDRESS?: string;

    @ApiProperty({ example: '+509 1234 5678', required: false })
    @IsOptional()
    @IsString()
    BUSINESS_PHONE?: string;

    @ApiProperty({ example: 'contact@kolabo.com', required: false })
    @IsOptional()
    @IsEmail()
    BUSINESS_EMAIL?: string;

    @ApiProperty({ example: 'HTG', required: false })
    @IsOptional()
    @IsString()
    CURRENCY_CODE?: string;

    @ApiProperty({ example: '15', required: false })
    @IsOptional()
    @IsString()
    TAX_PERCENTAGE?: string;

    @ApiProperty({ example: 'Mèsi pou vizit ou!', required: false })
    @IsOptional()
    @IsString()
    RECEIPT_FOOTER_MESSAGE?: string;
}
