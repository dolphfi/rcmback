import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Req,
  UseGuards,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SkipMaintenance } from '../utility/decorators/skip-maintenance.decorator';
import { User } from '../users/entities/user.entity';
import { SettingKey } from '../utility/common/enum/setting-keys.enum';
import { Role } from '../roles/entities/role.entity';
import { UsersService } from '../users/users.service';
import { SettingsService } from '../settings/settings.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private settingsService: SettingsService,
  ) { }

  /**
   * Vérifie si l'utilisateur peut se connecter en mode maintenance
   */
  private async checkMaintenanceAccess(user: User): Promise<void> {
    try {
      const maintenanceSetting = await this.settingsService.findOneByKey(
        SettingKey.MAINTENANCE_MODE,
      );

      // Si le mode maintenance n'est pas activé, autoriser l'accès
      if (!maintenanceSetting || maintenanceSetting.value !== 'true') {
        return;
      }

      // Si le mode maintenance est activé, vérifier le rôle
      const allowedRoles = ['SUPER_ADMIN'];
      const userRoleName = user.role?.name;

      if (!userRoleName || !allowedRoles.includes(userRoleName)) {
        throw new UnauthorizedException({
          statusCode: 401,
          message:
            'Le système est actuellement en maintenance. Seuls les administrateurs peuvent se connecter.',
          error: 'Unauthorized',
          maintenanceMode: true,
          userRole: userRoleName,
        });
      }
    } catch (error) {
      // Si c'est déjà une UnauthorizedException, la relancer
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Sinon, continuer normalement (erreur de récupération du paramètre)
    }
  }

  @Public()
  @SkipMaintenance()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({
    summary: 'Inscrire un nouvel utilisateur',
    description:
      "Créer un nouveau compte utilisateur. Un email de vérification sera envoyé à l'adresse fournie.",
  })
  @ApiBody({
    type: CreateUserDto,
    description: "Données d'inscription de l'utilisateur",
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé. Un email de vérification a été envoyé.',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou mot de passe trop faible.',
  })
  @ApiResponse({ status: 409, description: 'Cet email est déjà utilisé.' })
  @ApiResponse({
    status: 429,
    description: 'Trop de tentatives. Veuillez réessayer plus tard.',
  })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Public()
  @SkipMaintenance()
  @Get('verify-email')
  @ApiOperation({ summary: "Vérifier l'adresse email d'un utilisateur" })
  @ApiResponse({ status: 200, description: 'Email vérifié avec succès.' })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré.' })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query() verifyEmailDto: VerifyEmailDto) {
    // Le token est extrait par le DTO grâce à class-validator/class-transformer
    // et la validation des query params par NestJS.
    // Si le token n'est pas fourni ou n'est pas une chaîne, une erreur BadRequestException
    // sera automatiquement levée par le ValidationPipe global (si configuré).
    return this.authService.verifyEmail(verifyEmailDto.token);
  }

  @Public()
  @SkipMaintenance()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Demander une réinitialisation de mot de passe',
    description:
      "Envoyer un email de réinitialisation de mot de passe. Retourne toujours 200 pour éviter l'énumération d'utilisateurs.",
  })
  @ApiBody({ type: ForgotPasswordDto, description: "Email de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Si l'email existe, un lien de réinitialisation a été envoyé.",
  })
  @ApiResponse({
    status: 429,
    description: 'Trop de tentatives. Veuillez réessayer plus tard.',
  })
  @HttpCode(HttpStatus.OK) // Renvoyer 200 même si l'email n'existe pas pour éviter l'énumération d'utilisateurs
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @SkipMaintenance()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @ApiOperation({
    summary: 'Réinitialiser le mot de passe avec un token',
    description:
      'Définir un nouveau mot de passe en utilisant le token reçu par email. Le mot de passe doit respecter les critères de sécurité.',
  })
  @ApiBody({
    type: ResetPasswordDto,
    description: 'Token et nouveau mot de passe',
  })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe réinitialisé avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Token invalide/expiré ou mot de passe trop faible.',
  })
  @ApiResponse({
    status: 429,
    description: 'Trop de tentatives. Veuillez réessayer plus tard.',
  })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Public()
  @SkipMaintenance()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({
    summary: 'Connecter un utilisateur',
    description:
      'Authentifier un utilisateur avec email/mot de passe. Si la 2FA est activée, retourne un userId pour la seconde étape.',
  })
  @ApiBody({
    type: LoginDto,
    description:
      'Identifiants de connexion (email, mot de passe, code 2FA optionnel)',
  })
  @ApiResponse({
    status: 201,
    description: 'Connexion réussie, tokens retournés.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentification à deux facteurs requise.',
  })
  @ApiResponse({
    status: 401,
    description:
      'Identifiants invalides, compte verrouillé ou accès refusé en mode maintenance.',
  })
  @ApiResponse({
    status: 429,
    description: 'Trop de tentatives. Veuillez réessayer plus tard.',
  })
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    // Étape 1: Valider l'email et le mot de passe
    const validationResult = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
      request, // Passer l'objet request
    );

    // Vérifier le mode maintenance avant de générer les tokens
    await this.checkMaintenanceAccess(validationResult);

    // procéder à la génération des tokens.
    // validationResult est l'objet User dans ce cas.
    const tokens = await this.authService.login(validationResult);
    return tokens;
  }

  @Public()
  @SkipMaintenance()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('refresh')
  @ApiOperation({
    summary: "Rafraîchir les tokens d'authentification",
    description:
      "Obtenir de nouveaux tokens d'accès en utilisant un token de rafraîchissement valide.",
  })
  @ApiBody({ type: RefreshTokenDto, description: 'Token de rafraîchissement' })
  @ApiResponse({ status: 201, description: 'Tokens rafraîchis avec succès.' })
  @ApiResponse({
    status: 401,
    description: 'Token de rafraîchissement invalide ou expiré.',
  })
  @ApiResponse({
    status: 429,
    description: 'Trop de tentatives. Veuillez réessayer plus tard.',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }
}
