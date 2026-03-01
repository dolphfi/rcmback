import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserByAdminDto {
    @ApiProperty({
        description: "Prénom de l'utilisateur",
        example: 'John',
    })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({
        description: "Nom de famille de l'utilisateur",
        example: 'Doe',
    })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({
        description: "Adresse email de l'utilisateur",
        example: 'john.doe@kolabo.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: "Numéro de téléphone (optionnel)",
        example: '+50930000000',
        required: false,
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({
        description: "ID du rôle ou nom du rôle",
        example: 'CASHIER',
    })
    @IsString()
    @IsNotEmpty()
    roleId: string;

    @ApiProperty({
        description: "ID du point de vente (Optionnel, null si global)",
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false
    })
    @IsOptional()
    @IsString()
    posId?: string;
}
