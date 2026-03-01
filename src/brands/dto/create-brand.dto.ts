import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateBrandDto {
  @ApiProperty({ example: 'Apple', description: 'Le nom de la marque' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Premium electronics',
    description: 'Description de la marque',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'https://example.com/logo.png',
    description: 'URL du logo de la marque',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({
    example: 'brands/apple_logo',
    description: 'Public ID Cloudinary du logo',
    required: false,
  })
  @IsString()
  @IsOptional()
  logoPublicId?: string;

  @ApiProperty({
    example: true,
    description: 'Si la marque est active',
    default: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
