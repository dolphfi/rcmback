import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      return false;
    }

    const hasRequiredRole = requiredRoles.some(
      (roleName) => user.role.name === roleName,
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Accès refusé. Cette action nécessite l'un des rôles suivants: ${requiredRoles.join(', ')}. Votre rôle actuel: ${user.role.label || user.role.name}.`,
      );
    }

    return true;
  }
}
