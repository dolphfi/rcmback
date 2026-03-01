import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProductImageDto {
  @ApiProperty({
    example: 'https://res.cloudinary.com/...',
    description: "URL de l'image",
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    example: 'products/xyz123',
    description: 'Public ID Cloudinary',
  })
  @IsString()
  @IsNotEmpty()
  publicId: string;

  @ApiProperty({
    example: true,
    description: "S'il s'agit de l'image principale",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
