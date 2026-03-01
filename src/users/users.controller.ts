import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
  Logger,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { plainToInstance } from 'class-transformer';
import { FastifyRequest } from 'fastify';
import { PaginationQueryDto } from '../utility/common/dto/pagination-query.dto';
import { ERROR_MESSAGES } from '../utility/common/constants/error-messages';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly userService: UsersService) { }

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel utilisateur (Admin seulement)' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès.' })
  @ApiResponse({
    status: 400,
    description: 'Mauvaise requête (ex: données manquantes, format invalide).',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé.' })
  @ApiResponse({ status: 403, description: 'Accès refusé (rôle insuffisant).' })
  @Roles('SUPER_ADMIN')
  create(@Body() createUserDto: CreateUserByAdminDto) {
    return this.userService.createByAdmin(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtenir la liste de tous les utilisateurs (Admin seulement)',
  })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs.' })
  @ApiResponse({ status: 401, description: 'Non autorisé.' })
  @ApiResponse({ status: 403, description: 'Accès refusé (rôle insuffisant).' })
  @Roles('SUPER_ADMIN')
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.userService.findAll(paginationQuery);
  }

  @Get('me')
  @ApiOperation({
    summary: "Obtenir les informations du profil de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Profil utilisateur récupéré avec succès.',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé.' })
  @ApiBearerAuth()
  async viewMyProfile(@Request() req: any) {
    return this.userService.viewProfile(req.user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: "Mettre à jour le profil de l'utilisateur connecté",
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Données du profil utilisateur. Inclure les champs du DTO et optionnellement un fichier `avatar`.',
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        avatar: {
          type: 'string',
          format: 'binary',
          description:
            "Fichier image pour l'avatar de l'utilisateur (optionnel).",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Profil mis à jour avec succès.' })
  @ApiResponse({
    status: 400,
    description: 'Mauvaise requête ou erreur de traitement du formulaire.',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé.' })
  @ApiBearerAuth()
  async updateMyProfile(
    @Request() req: FastifyRequest, // Typed as FastifyRequest
  ) {
    const userId = (req as any).user?.id;
    if (!userId) {
      this.logger.error(
        '[updateMyProfile] User ID not found in request after JWT Auth.',
      );
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.UNAUTHENTICATED);
    }

    this.logger.log(`[updateMyProfile] Called for user: ${userId}`);
    this.logger.debug(
      `[updateMyProfile] Request Content-Type header: ${req.headers['content-type']}`,
    );

    if (!(req as any).isMultipart()) {
      this.logger.warn('[updateMyProfile] Request is not multipart');
      throw new BadRequestException(
        ERROR_MESSAGES.BUSINESS.MULTIPART_FORM_REQUIRED,
      );
    }

    const updateUserDtoData: Record<string, any> = {};
    let avatarFileForService: Express.Multer.File | undefined = undefined;

    try {
      const parts = (req as any).parts();
      for await (const part of parts) {
        if (part.type === 'file') {
          if (part.fieldname === 'avatar') {
            if (!part.filename) {
              this.logger.debug(
                '[updateMyProfile] Champ avatar présent mais aucun fichier téléversé.',
              );
              continue;
            }
            const buffer = await part.toBuffer();
            avatarFileForService = {
              fieldname: part.fieldname,
              originalname: part.filename,
              encoding: part.encoding,
              mimetype: part.mimetype,
              buffer: buffer,
              size: buffer.length,
            } as Express.Multer.File; // Construction d'un objet compatible
            this.logger.debug(
              `[updateMyProfile] Fichier avatar traité: ${part.filename}, taille: ${buffer.length} octets`,
            );
          } else {
            this.logger.warn(
              `[updateMyProfile] Champ fichier inattendu reçu: ${part.fieldname}. Ignoré.`,
            );
            if (part.file) {
              for await (const chunk of part.file) {
                /* Consommer le stream */
              }
            }
          }
        } else if (part.type === 'field') {
          updateUserDtoData[part.fieldname] = part.value;
          this.logger.debug(
            `[updateMyProfile] Champ traité: ${part.fieldname} = ${part.value}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        '[updateMyProfile] Erreur lors du traitement des parties du formulaire multipart.',
        error,
      );
      throw new InternalServerErrorException(
        ERROR_MESSAGES.SYSTEM.FORM_PROCESSING_ERROR,
      );
    }

    const updateUserDto = plainToInstance(UpdateUserDto, updateUserDtoData);

    this.logger.debug(
      `[updateMyProfile] updateUserDto construit: ${JSON.stringify(updateUserDto)}`,
    );
    if (avatarFileForService) {
      this.logger.debug(
        `[updateMyProfile] Fichier avatar à envoyer au service: ${avatarFileForService.originalname}`,
      );
    } else {
      this.logger.debug(
        '[updateMyProfile] Aucun fichier avatar à envoyer au service.',
      );
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.userService.updateProfile(
      userId,
      updateUserDto,
      ipAddress,
      userAgent,
      avatarFileForService,
    );
  }

  @Patch('me/password')
  @ApiOperation({
    summary: "Mettre à jour le mot de passe de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe mis à jour avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Mauvaise requête (ex: mots de passe ne correspondent pas).',
  })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé (ex: ancien mot de passe incorrect).',
  })
  @ApiBearerAuth()
  async updateMyPassword(
    @Request() req: any,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const ipAddress =
      req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.userService.updatePassword(
      req.user.id,
      updatePasswordDto,
      ipAddress,
      userAgent,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir un utilisateur par son ID (Admin seulement)',
  })
  @ApiParam({
    name: 'id',
    description: "ID de l'utilisateur (UUID)",
    type: 'string',
  })
  @ApiResponse({ status: 200, description: "Détails de l'utilisateur." })
  @ApiResponse({ status: 401, description: 'Non autorisé.' })
  @ApiResponse({ status: 403, description: 'Accès refusé (rôle insuffisant).' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé.' })
  @Roles('SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: "Modifier les informations d'un utilisateur (Admin seulement)",
  })
  @ApiParam({
    name: 'id',
    description: "ID de l'utilisateur (UUID)",
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur mis à jour avec succès.',
  })
  @ApiResponse({ status: 400, description: 'Mauvaise requête.' })
  @ApiResponse({ status: 401, description: 'Non autorisé.' })
  @ApiResponse({ status: 403, description: 'Accès refusé (rôle insuffisant).' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé.' })
  @Roles('SUPER_ADMIN')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur (Admin seulement)' })
  @ApiParam({
    name: 'id',
    description: "ID de l'utilisateur (UUID)",
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur supprimé avec succès.',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé.' })
  @ApiResponse({ status: 403, description: 'Accès refusé (rôle insuffisant).' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé.' })
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Post(':id/unlock')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Débloquer un compte utilisateur (Admin seulement)',
  })
  @ApiParam({
    name: 'id',
    description: "ID de l'utilisateur (UUID)",
    type: 'string',
  })
  @ApiResponse({ status: 200, description: 'Compte débloqué avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé.' })
  @ApiResponse({ status: 403, description: 'Accès refusé (rôle insuffisant).' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiBearerAuth()
  async unlockAccount(@Param('id') userId: string, @Request() req: any) {
    return this.userService.unlockAccount(userId, req.user.id);
  }
}
