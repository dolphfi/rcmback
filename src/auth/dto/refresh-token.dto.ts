import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      "Token de rafraîchissement pour obtenir un nouveau token d'accès",
  })
  @IsString({ message: 'Le refresh token doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le refresh token est requis' })
  refresh_token: string;
}
