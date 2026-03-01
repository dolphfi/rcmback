import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Le numéro de la page à retourner.',
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Le nombre d'éléments à retourner par page.",
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // Pour éviter les abus de l'API
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Terme de recherche pour filtrer les résultats.',
  })
  @IsOptional()
  search?: string;
}
