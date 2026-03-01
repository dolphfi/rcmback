import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { PdfService } from '../utility/pdf/pdf.service';
import { SettingsService } from '../settings/settings.service';
import { SettingKey } from '../utility/common/enum/setting-keys.enum';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromAddress = 'Kolabopos <onboarding@resend.dev>';

  constructor(
    private readonly configService: ConfigService,
    private readonly pdfService: PdfService,
    private readonly settingsService: SettingsService,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.error(
        'RESEND_API_KEY is not defined in the environment variables. Email service will not work.',
      );
      throw new Error('RESEND_API_KEY is not configured.');
    }

    this.resend = new Resend(apiKey);
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers() {
    handlebars.registerHelper('formatDate', (date: Date | string) => {
      if (!date) return 'N/A';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Date invalide';
      return dateObj.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    handlebars.registerHelper('primaryColor', () => '#003366');
    handlebars.registerHelper('secondaryColor', () => '#f4f4f7');
    handlebars.registerHelper('successColor', () => '#28a745');
    handlebars.registerHelper('warningColor', () => '#ffc107');
    handlebars.registerHelper('dangerColor', () => '#dc3545');
    handlebars.registerHelper('lightColor', () => '#f8f9fa');

    handlebars.registerHelper('statusColor', (status: string) => {
      switch (status?.toLowerCase()) {
        case 'completed':
        case 'paid':
          return '#28a745';
        case 'pending':
        case 'unpaid':
          return '#dc3545';
        case 'in_progress':
          return '#ffc107';
        default:
          return '#6c757d';
      }
    });

    handlebars.registerHelper('statusBgColor', (status: string) => {
      switch (status?.toLowerCase()) {
        case 'completed':
        case 'paid':
          return '#d4edda';
        case 'pending':
        case 'unpaid':
          return '#f8d7da';
        case 'in_progress':
          return '#fff3cd';
        default:
          return '#e9ecef';
      }
    });

    handlebars.registerHelper('eq', (a: any, b: any) => a === b);
  }

  private async compileTemplate(
    fileName: string,
    context: any,
  ): Promise<string> {
    const filePath = path.join(
      process.cwd(),
      'src',
      'email',
      'templates',
      `${fileName}.hbs`,
    );
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const template = handlebars.compile(fileContent);
      return template(context);
    } catch (error) {
      this.logger.error(`Error compiling template ${fileName}`, error);
      throw new Error(`Could not compile email template: ${fileName}`);
    }
  }

  private async sendTransactionalEmail(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, any>,
    errorContext: string,
  ) {
    try {
      // Fetch business name from settings
      let companyName = 'KolaboPOS';
      try {
        const businessNameSetting = await this.settingsService.findOneByKey(
          SettingKey.BUSINESS_NAME,
        );
        if (businessNameSetting && businessNameSetting.value) {
          companyName = businessNameSetting.value;
        }
      } catch (e) {
        this.logger.warn(
          'Could not fetch BUSINESS_NAME setting, using default.',
        );
      }

      const template = await this.compileTemplate(templateName, {
        ...context,
        companyName,
      });
      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        html: template,
      });
      this.logger.log(`[${errorContext}] Email sent successfully to ${to}`);
      return result;
    } catch (error) {
      this.logger.error(
        `[${errorContext}] Failed to send email to ${to}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to send email: ${error.message}`,
      );
    }
  }

  async sendVerificationEmail(
    email: string,
    name: { firstName: string; lastName: string },
    token: string,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
    const currentYear = new Date().getFullYear();
    const fullName = `${name.firstName || ''} ${name.lastName || ''}`.trim();

    return this.sendTransactionalEmail(
      email,
      'Vérification de votre adresse email',
      'verification-email',
      {
        name: fullName,
        verificationLink,
        year: currentYear,
      },
      'VERIFICATION',
    );
  }

  async sendPasswordResetEmail(
    email: string,
    name: { firstName: string; lastName: string },
    token: string,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    const currentYear = new Date().getFullYear();
    const fullName = `${name.firstName || ''} ${name.lastName || ''}`.trim();

    return this.sendTransactionalEmail(
      email,
      'Réinitialisation de votre mot de passe',
      'reset-password-email',
      {
        name: fullName,
        resetLink,
        year: currentYear,
      },
      'PASSWORD_RESET',
    );
  }

  async sendWelcomeSetupEmail(
    email: string,
    name: { firstName: string; lastName: string },
    token: string,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const setupLink = `${frontendUrl}/reset-password?token=${token}`;
    const currentYear = new Date().getFullYear();
    const fullName = `${name.firstName || ''} ${name.lastName || ''}`.trim();

    return this.sendTransactionalEmail(
      email,
      'Bienvenue ! Configurez votre mot de passe',
      'welcome-setup',
      {
        name: fullName,
        setupLink,
        year: currentYear,
      },
      'WELCOME_SETUP',
    );
  }

  async sendWelcomeCredentialsEmail(
    email: string,
    name: { firstName: string; lastName: string },
    temporaryPassword: string,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const loginLink = `${frontendUrl}/login`;
    const currentYear = new Date().getFullYear();
    const fullName = `${name.firstName || ''} ${name.lastName || ''}`.trim();

    return this.sendTransactionalEmail(
      email,
      'Vos identifiants de connexion',
      'welcome-credentials',
      {
        name: fullName,
        email,
        temporaryPassword,
        loginLink,
        year: currentYear,
      },
      'WELCOME_CREDENTIALS',
    );
  }

  async sendEmailWithAttachment(
    to: string,
    subject: string,
    html: string,
    attachment: {
      filename: string;
      content: string;
    },
    errorContext: string,
  ) {
    try {
      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        html,
        attachments: [
          {
            filename: attachment.filename,
            content: attachment.content,
          },
        ],
      });
      this.logger.log(
        `[${errorContext}] Email with attachment sent successfully to ${to}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[${errorContext}] Failed to send email with attachment to ${to}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to send email with attachment: ${error.message}`,
      );
    }
  }
}
