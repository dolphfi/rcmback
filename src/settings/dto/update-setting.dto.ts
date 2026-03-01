import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Note: On ne permet pas de modifier la 'key' car elle est utilisée comme identifiant dans le code.
// Seuls la valeur et les champs descriptifs peuvent être mis à jour.

export class UpdateSettingDto {
  @ApiProperty({
    example: '2025-2026',
    description: 'Nouvelle valeur du paramètre.',
    required: false,
  })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiProperty({
    example: 'Année Scolaire Courante',
    description: 'Nouveau nom lisible du paramètre.',
    required: false,
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({
    example: "Définit l'année scolaire active pour toute l'application.",
    description: 'Nouvelle description.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
