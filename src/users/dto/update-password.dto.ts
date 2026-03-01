import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({
    example: 'OldPassword123!',
    description: "Ancien mot de passe de l'utilisateur",
  })
  @IsNotEmpty({ message: "L'ancien mot de passe est requis" })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description:
      'Nouveau mot de passe (min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial)',
  })
  @IsNotEmpty({ message: 'Le nouveau mot de passe est requis' })
  @MinLength(8, {
    message: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)',
    },
  )
  newPassword: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'Confirmation du nouveau mot de passe',
  })
  @IsNotEmpty({
    message: 'La confirmation du nouveau mot de passe est requise',
  })
  @MinLength(8, {
    message:
      'La confirmation du nouveau mot de passe doit contenir au moins 8 caractères',
  })
  confirmNewPassword: string;
}
