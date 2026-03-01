import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../../../audit-logs/audit-logs.service';
import { AuditAction } from '../../../audit-logs/entities/audit-log.entity';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly auditLogsService: AuditLogsService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, ip, headers } = request;
    const userAgent = headers['user-agent'];

    // We only want to log mutations (POST, PATCH, PUT, DELETE)
    // and avoid logging highly sensitive routes like login (handled separately)
    const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);
    const isSensitive =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh');

    if (!isMutation || isSensitive) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logAction(method, url, body, user, ip, userAgent, data);
        },
        error: (error) => {
          // Optional: Log failed attempts too if needed
        },
      }),
    );
  }

  private async logAction(
    method: string,
    url: string,
    body: any,
    user: any,
    ip: string,
    userAgent: string,
    responseData: any,
  ) {
    try {
      let action = AuditAction.UPDATE;
      if (method === 'POST') action = AuditAction.CREATE;
      if (method === 'DELETE') action = AuditAction.DELETE;

      // Extract entity name from URL (simple heuristic: /users/:id -> User)
      const urlParts = url.split('/').filter((p) => p && p !== 'api');
      const entityName =
        urlParts[0]?.charAt(0).toUpperCase() + urlParts[0]?.slice(1, -1); // users -> User

      await this.auditLogsService.log({
        action,
        entityName: entityName || 'System',
        entityId: responseData?.id || body?.id || urlParts[1],
        details: JSON.stringify({
          requestBody: this.sanitizeBody(body),
          // Optionally log responseData if it's not too large
        }),
        userId: user?.id,
        ipAddress: ip,
        userAgent,
      });
    } catch (error) {
      this.logger.error('Failed to save audit log', error.stack);
    }
  }

  private sanitizeBody(body: any) {
    if (!body) return null;
    const sanitized = { ...body };
    // Redact passwords and sensitive keys
    const sensitiveKeys = [
      'password',
      'confirmPassword',
      'oldPassword',
      'newPassword',
      'token',
    ];
    sensitiveKeys.forEach((key) => {
      if (sanitized[key]) sanitized[key] = '********';
    });
    return sanitized;
  }
}
