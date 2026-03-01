import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SettingsService } from '../../../settings/settings.service';
import { SettingKey } from '../enum/setting-keys.enum';
import { SKIP_MAINTENANCE_KEY } from '../../decorators/skip-maintenance.decorator';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private settingsService: SettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipMaintenance = this.reflector.getAllAndOverride<boolean>(
      SKIP_MAINTENANCE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipMaintenance) {
      return true;
    }

    try {
      const maintenanceSetting = await this.settingsService.findOneByKey(
        SettingKey.MAINTENANCE_MODE,
      );

      if (!maintenanceSetting || maintenanceSetting.value !== 'true') {
        return true;
      }

      const request = context.switchToHttp().getRequest();
      const user = request.user;

      // Si l'utilisateur est un admin ou super admin, il peut accéder au système même en maintenance
      if (
        user &&
        user.role &&
        (user.role.name === 'SUPER_ADMIN' || user.role.name === 'ADMIN')
      ) {
        return true;
      }

      throw new UnauthorizedException({
        statusCode: 401,
        message:
          'Le système est actuellement en maintenance. Veuillez réessayer plus tard.',
        error: 'Unauthorized',
        maintenanceMode: true,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // En cas d'erreur de lecture des settings (ex: table pas encore créée), on laisse passer
      return true;
    }
  }
}
