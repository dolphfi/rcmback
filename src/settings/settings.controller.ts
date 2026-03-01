import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
  Request,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { Readable } from 'stream';
import { FastifyRequest } from 'fastify';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../roles/entities/role.entity';
import { SettingKey } from '../utility/common/enum/setting-keys.enum';
import { PaginationQueryDto } from '../utility/common/dto/pagination-query.dto';
import { ERROR_MESSAGES } from '../utility/common/constants/error-messages';
import { SkipMaintenance } from '../utility/decorators/skip-maintenance.decorator';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);
  constructor(private readonly settingsService: SettingsService) { }

  @Post('upload-business-logo')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: "Fichier image pour le logo de l'école.",
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: "Uploader le logo de l'école" })
  @ApiResponse({ status: 200, description: 'Logo mis à jour avec succès.' })
  async uploadBusinessLogo(@Request() req: FastifyRequest) {
    if (!(req as any).isMultipart()) {
      throw new BadRequestException(
        ERROR_MESSAGES.BUSINESS.INVALID_MULTIPART_REQUEST,
      );
    }

    let fileForService: Express.Multer.File | undefined;

    const parts = (req as any).parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        fileForService = {
          fieldname: part.fieldname,
          originalname: part.filename,
          encoding: part.encoding,
          mimetype: part.mimetype,
          size: buffer.length,
          buffer,
          stream: Readable.from(buffer), // Create a readable stream from the buffer
          destination: '',
          filename: '',
          path: '',
        };
      } else {
        // Ignore other fields for this endpoint
      }
    }

    if (!fileForService) {
      throw new BadRequestException(ERROR_MESSAGES.BUSINESS.NO_FILE_IN_REQUEST);
    }

    return this.settingsService.updateBusinessLogo(fileForService);
  }

  @Post('update-business-profile')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Mettre à jour le profil complet de l\'entreprise' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour avec succès.' })
  async updateBusinessProfile(@Request() req: FastifyRequest) {
    if (!(req as any).isMultipart()) {
      throw new BadRequestException(
        ERROR_MESSAGES.BUSINESS.INVALID_MULTIPART_REQUEST,
      );
    }

    let fileForService: Express.Multer.File | undefined;
    let businessData: UpdateBusinessProfileDto = {};

    const parts = (req as any).parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        fileForService = {
          fieldname: part.fieldname,
          originalname: part.filename,
          encoding: part.encoding,
          mimetype: part.mimetype,
          size: buffer.length,
          buffer,
          stream: Readable.from(buffer),
          destination: '',
          filename: '',
          path: '',
        };
      } else {
        if (part.fieldname === 'data') {
          try {
            businessData = JSON.parse(part.value);
          } catch (e) {
            throw new BadRequestException('Maloformed "data" field. Must be JSON.');
          }
        }
      }
    }

    return this.settingsService.updateBusinessProfile(businessData, fileForService);
  }

  @Post('add-setting')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Créer un nouveau paramètre' })
  @ApiResponse({
    status: 201,
    description: 'Le paramètre a été créé avec succès.',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @ApiResponse({ status: 409, description: 'La clé du paramètre existe déjà.' })
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.create(createSettingDto);
  }

  @Get('all-settings')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'CASHIER', 'MANAGER')
  @ApiOperation({ summary: 'Lister tous les paramètres (avec pagination)' })
  @ApiResponse({ status: 200, description: 'Liste paginée des paramètres.' })
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.settingsService.findAll(paginationQuery);
  }

  @Get('backups/history')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: "Obtenir l'historique des sauvegardes" })
  async getBackupHistory() {
    return this.settingsService.getBackupHistory();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'DIRECTOR')
  @ApiOperation({ summary: 'Trouver un paramètre par son ID' })
  @ApiResponse({ status: 200, description: 'Détails du paramètre.' })
  @ApiResponse({ status: 404, description: 'Paramètre non trouvé.' })
  findOneById(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.findOne(id);
  }

  @Get('key/:key')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'DIRECTOR')
  @ApiOperation({ summary: 'Trouver un paramètre par sa clé' })
  @ApiResponse({ status: 200, description: 'Le paramètre a été trouvé.' })
  @ApiResponse({ status: 404, description: 'Paramètre non trouvé.' })
  findOneByKey(@Param('key') key: SettingKey) {
    return this.settingsService.findOneByKey(key);
  }

  @Patch('key/:key')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Mettre à jour un paramètre par sa clé' })
  @ApiResponse({ status: 200, description: 'Le paramètre a été mis à jour.' })
  @ApiResponse({ status: 404, description: 'Paramètre non trouvé.' })
  updateByKey(
    @Param('key') key: SettingKey,
    @Body() updateData: UpdateSettingDto,
  ) {
    return this.settingsService.updateByKey(key, updateData);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Mettre à jour un paramètre' })
  @ApiResponse({ status: 200, description: 'Le paramètre a été mis à jour.' })
  @ApiResponse({ status: 404, description: 'Paramètre non trouvé.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    return this.settingsService.update(id, updateSettingDto);
  }

  @Delete('id/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Supprimer un paramètre' })
  @ApiResponse({
    status: 200,
    description: 'Le paramètre a été supprimé avec succès.',
  })
  @ApiResponse({ status: 404, description: 'Paramètre non trouvé.' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.settingsService.remove(id);
    return { message: 'Le paramètre a été supprimé avec succès.' };
  }

  // MAINTENANCE MODE
  @Post('maintenance/enable')
  @SkipMaintenance()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Activer le mode maintenance',
    description:
      'Active le mode maintenance. Seuls les SUPER_ADMIN et ADMIN pourront se connecter.',
  })
  @ApiResponse({
    status: 200,
    description: 'Mode maintenance activé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Mode maintenance activé avec succès.',
        },
        maintenanceMode: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Rôle SUPER_ADMIN requis',
  })
  async enableMaintenanceMode() {
    await this.settingsService.updateByKey(SettingKey.MAINTENANCE_MODE, {
      value: 'true',
      label: 'Mode maintenance',
      description: 'Mode maintenance activé',
    });

    return {
      success: true,
      message: 'Mode maintenance activé avec succès.',
      maintenanceMode: true,
    };
  }

  @Post('maintenance/disable')
  @SkipMaintenance()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Désactiver le mode maintenance',
    description:
      "Désactive le mode maintenance et restaure l'accès normal pour tous les utilisateurs.",
  })
  @ApiResponse({
    status: 200,
    description: 'Mode maintenance désactivé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Mode maintenance désactivé avec succès.',
        },
        maintenanceMode: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Rôle SUPER_ADMIN requis',
  })
  async disableMaintenanceMode() {
    await this.settingsService.updateByKey(SettingKey.MAINTENANCE_MODE, {
      value: 'false',
      label: 'Mode maintenance',
      description: 'Mode maintenance désactivé',
    });

    return {
      success: true,
      message: 'Mode maintenance désactivé avec succès.',
      maintenanceMode: false,
    };
  }

  @Get('maintenance/status')
  @SkipMaintenance()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({
    summary: 'Vérifier le statut du mode maintenance',
    description: "Retourne l'état actuel du mode maintenance.",
  })
  @ApiResponse({
    status: 200,
    description: 'Statut du mode maintenance',
    schema: {
      type: 'object',
      properties: {
        maintenanceMode: { type: 'boolean', example: false },
        lastUpdated: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-10T14:30:00Z',
        },
        message: {
          type: 'string',
          example: 'Le système fonctionne normalement.',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Rôles SUPER_ADMIN ou ADMIN requis',
  })
  async getMaintenanceStatus() {
    try {
      const maintenanceSetting = await this.settingsService.findOneByKey(
        SettingKey.MAINTENANCE_MODE,
      );
      const isMaintenanceMode = maintenanceSetting?.value === 'true';

      return {
        maintenanceMode: isMaintenanceMode,
        lastUpdated: maintenanceSetting?.updatedAt || null,
        message: isMaintenanceMode
          ? 'Le système est en mode maintenance.'
          : 'Le système fonctionne normalement.',
      };
    } catch (error) {
      return {
        maintenanceMode: false,
        lastUpdated: null,
        message: 'Le système fonctionne normalement.',
      };
    }
  }

  @Public()
  @SkipMaintenance()
  @Get('maintenance/public-status')
  @ApiOperation({
    summary: 'Vérifier le statut public du mode maintenance',
    description:
      'Endpoint public pour vérifier si le système est en mode maintenance. Accessible sans authentification.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statut public du mode maintenance',
    schema: {
      type: 'object',
      properties: {
        maintenanceMode: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Le système fonctionne normalement.',
        },
        allowedRoles: {
          type: 'array',
          items: { type: 'string' },
          example: ['SUPER_ADMIN', 'ADMIN'],
          description: 'Rôles autorisés en mode maintenance',
        },
      },
    },
  })
  async getPublicMaintenanceStatus() {
    try {
      const maintenanceSetting = await this.settingsService.findOneByKey(
        SettingKey.MAINTENANCE_MODE,
      );
      const isMaintenanceMode = maintenanceSetting?.value === 'true';

      return {
        maintenanceMode: isMaintenanceMode,
        message: isMaintenanceMode
          ? 'Le système est actuellement en maintenance. Seuls les administrateurs peuvent se connecter.'
          : 'Le système fonctionne normalement.',
        allowedRoles: isMaintenanceMode ? ['SUPER_ADMIN', 'ADMIN'] : null,
      };
    } catch (error) {
      return {
        maintenanceMode: false,
        message: 'Le système fonctionne normalement.',
        allowedRoles: null,
      };
    }
  }

  @Post('backup')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Déclencher une sauvegarde manuelle' })
  async backup() {
    return this.settingsService.backupData();
  }

  @Post('optimize')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Optimiser le système' })
  async optimize() {
    return this.settingsService.optimizeSystem();
  }
}
