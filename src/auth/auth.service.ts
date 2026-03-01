import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { jwtConstants } from './constants';
import { EmailService } from '../email/email.service';
import { Request } from 'express';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as crypto from 'crypto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AUTH_MESSAGES } from '../utility/common/constants/error-messages';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly httpService: HttpService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try {
      this.logger.log(
        `Tentative d'inscription pour l'email: ${createUserDto.email}`,
      );

      // Vérifier si l'email existe
      const existingEmail = await this.userService.findByEmail(
        createUserDto.email,
      );
      if (existingEmail) {
        this.logger.warn(
          `Tentative d'inscription avec un email existant: ${createUserDto.email}`,
        );
        throw new ConflictException(
          AUTH_MESSAGES.BUSINESS.EMAIL_ALREADY_EXISTS,
        );
      }

      // Vérifier si le téléphone existe (seulement si fourni)
      if (createUserDto.phone) {
        const existingPhone = await this.userService.findByPhone(
          createUserDto.phone,
        );
        if (existingPhone) {
          this.logger.warn(
            `Tentative d'inscription avec un numéro existant: ${createUserDto.phone}`,
          );
          throw new ConflictException(
            AUTH_MESSAGES.BUSINESS.PHONE_ALREADY_EXISTS,
          );
        }
      }

      const user = await this.userService.create(createUserDto);

      // Auto-verify users on registration as requested
      user.isVerified = true;
      user.verificationToken = undefined;

      await this.userService.save(user);

      const { password, verificationToken, ...result } = user;
      this.logger.log(
        `Inscription réussie (Auto-vérifiée) pour l'utilisateur: ${user.id}`,
      );
      return result;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Erreur inattendue lors de l'inscription: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        AUTH_MESSAGES.SYSTEM.REGISTRATION_ERROR,
      );
    }
  }

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async validateUser(
    email: string,
    password: string,
    request?: Request,
  ): Promise<any> {
    try {
      this.logger.log(`Validation de l'utilisateur: ${email}`);
      const user = await this.userService.findByEmail(email);
      if (!user) {
        this.logger.warn(`Utilisateur introuvable: ${email}`);
        throw new UnauthorizedException(
          AUTH_MESSAGES.BUSINESS.INVALID_CREDENTIALS,
        );
      }
      this.logger.log(
        `Utilisateur trouvé: ${user.id}, Tentatives: ${user.loginAttempts}, Verrouillé jusqu'à: ${user.lockoutUntil}, Vérifié: ${user.isVerified}`,
      );

      if (!user.isActive) {
        this.logger.warn(`Compte inactif: ${user.id}`);
        throw new UnauthorizedException(
          AUTH_MESSAGES.BUSINESS.ACCOUNT_INACTIVE,
        );
      }

      const lockStatus = user.isLockedOut();
      this.logger.log(
        `Statut de verrouillage pour ${user.id}: ${JSON.stringify(lockStatus)}`,
      );
      if (lockStatus.isLocked) {
        throw new UnauthorizedException(AUTH_MESSAGES.BUSINESS.ACCOUNT_LOCKED);
      }

      const isPasswordValid = await user.validatePassword(password);
      this.logger.log(
        `Résultat de validation du mot de passe pour ${user.id}: ${isPasswordValid}`,
      );

      if (!isPasswordValid) {
        this.logger.warn(
          `Mot de passe invalide pour ${user.id}. Tentatives actuelles: ${user.loginAttempts}`,
        );
        await this.handleFailedLogin(user);
        this.logger.warn(
          `Après échec de connexion pour ${user.id}. Nouvelles tentatives: ${user.loginAttempts}`,
        );
        await this.userService.save(user);
        throw new UnauthorizedException(
          AUTH_MESSAGES.BUSINESS.INVALID_CREDENTIALS,
        );
      }

      // Mot de passe correct, réinitialiser les tentatives
      user.resetLoginAttempts();
      let userWasModified = true; // Pour suivre si on doit sauvegarder à nouveau

      // --- DÉBUT DE LA LOGIQUE DE VÉRIFICATION D'EMAIL (En cas de besoin si isVerified est false pour une raison x) ---
      let emailVerificationRequired = false;
      if (!user.isVerified) {
        user.verificationToken = this.generateVerificationToken();
        try {
          await this.emailService.sendVerificationEmail(
            user.email,
            { firstName: user.firstName, lastName: user.lastName },
            user.verificationToken,
          );
          this.logger.log(
            `[VALIDATE_USER] Email de vérification (à la demande) envoyé à ${user.email}`,
          );
        } catch (error) {
          this.logger.error(
            `[VALIDATE_USER] Échec de l'envoi de l'email de vérification (à la demande) à ${user.email}`,
            error,
          );
        }
        emailVerificationRequired = true;
        userWasModified = true;
      }
      // --- FIN DE LA LOGIQUE DE VÉRIFICATION D'EMAIL ---

      if (userWasModified) {
        await this.userService.save(user);
      }

      const userPayload: any = {
        id: user.id,
        email: user.email,
        role: user.role?.name,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
      };

      if (emailVerificationRequired) {
        userPayload.emailVerificationPending = true;
      }

      // Procéder à la connexion normale.
      await this.handleSuccessfulLogin(user);
      return userPayload; // Renvoyer notre payload enrichi
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la validation de l'utilisateur ${email}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(AUTH_MESSAGES.SYSTEM.LOGIN_ERROR);
    }
  }

  private async handleFailedLogin(user: User) {
    this.logger.log(
      `[AuthService/handleFailedLogin] START - UserID: ${user.id}, Current attempts: ${user.loginAttempts}, LockoutUntil: ${user.lockoutUntil}`,
    );
    await user.incrementLoginAttempts(); // incrementLoginAttempts va logger
    this.logger.log(
      `[AuthService/handleFailedLogin] After incrementLoginAttempts - UserID: ${user.id}, New attempts: ${user.loginAttempts}, New LockoutUntil: ${user.lockoutUntil}`,
    );
    try {
      await this.userService.save(user);
      this.logger.log(
        `[AuthService/handleFailedLogin] User ${user.id} saved successfully after failed login.`,
      );
    } catch (error) {
      this.logger.error(
        `[AuthService/handleFailedLogin] FAILED to save user ${user.id} after failed login. Error: ${error.message}`,
        error.stack,
      );
    }
  }

  private async handleSuccessfulLogin(user: User, request?: Request) {
    user.resetLoginAttempts();
    user.lastLoginAt = new Date();
    await this.userService.save(user);
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name || '',
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        expiresIn: jwtConstants.refreshExpiresIn as any,
      }),
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      this.logger.log(
        `Demande de réinitialisation de mot de passe pour: ${email}`,
      );
      const user = await this.userService.findByEmail(email);

      if (!user) {
        this.logger.warn(
          `Tentative de réinitialisation pour un email non trouvé: ${email}`,
        );
        return { message: AUTH_MESSAGES.SUCCESS.PASSWORD_RESET_SENT };
      }

      if (!user.isActive) {
        this.logger.warn(
          `Tentative de réinitialisation pour un compte inactif: ${email}`,
        );
        return { message: AUTH_MESSAGES.BUSINESS.ACCOUNT_INACTIVE };
      }
      if (!user.isVerified) {
        this.logger.warn(
          `Tentative de réinitialisation pour un email non vérifié: ${email}`,
        );
        return { message: AUTH_MESSAGES.BUSINESS.ACCOUNT_NOT_VERIFIED };
      }

      user.resetPasswordToken = this.generateVerificationToken();
      const now = new Date();
      user.resetPasswordExpires = new Date(now.getTime() + 60 * 60 * 1000); // Expire dans 1 heure

      await this.userService.save(user);

      // Envoyer l'email de réinitialisation
      try {
        await this.emailService.sendPasswordResetEmail(
          user.email,
          { firstName: user.firstName, lastName: user.lastName },
          user.resetPasswordToken,
        );
        this.logger.log(`Email de réinitialisation envoyé à ${user.email}`);
      } catch (error) {
        this.logger.error(
          `Échec de l'envoi de l'email de réinitialisation à ${user.email}: ${error.message}`,
          error.stack,
        );
      }

      return { message: AUTH_MESSAGES.SUCCESS.PASSWORD_RESET_SENT };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la demande de réinitialisation de mot de passe pour ${email}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        AUTH_MESSAGES.SYSTEM.EMAIL_SEND_ERROR,
      );
    }
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      this.logger.log(
        `Tentative de réinitialisation de mot de passe avec le token: ${token.substring(0, 10)}...`,
      );
      const user = await this.userService.findByResetPasswordToken(token);

      if (!user) {
        this.logger.warn(
          `Token de réinitialisation invalide: ${token.substring(0, 10)}...`,
        );
        throw new BadRequestException(
          AUTH_MESSAGES.NOT_FOUND.USER_BY_RESET_TOKEN,
        );
      }

      const now = new Date();
      if (
        !user.resetPasswordExpires ||
        now > new Date(user.resetPasswordExpires)
      ) {
        this.logger.warn(
          `Token de réinitialisation expiré pour l'utilisateur: ${user.id}`,
        );
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await this.userService.save(user);
        throw new BadRequestException(
          AUTH_MESSAGES.BUSINESS.RESET_TOKEN_EXPIRED,
        );
      }

      user.password = newPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      user.loginAttempts = 0;
      user.lockoutUntil = null;

      await this.userService.save(user);
      this.logger.log(
        `Mot de passe réinitialisé avec succès pour l'utilisateur: ${user.id}`,
      );
      return { message: AUTH_MESSAGES.SUCCESS.PASSWORD_RESET_SUCCESS };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la réinitialisation du mot de passe: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        AUTH_MESSAGES.SYSTEM.PASSWORD_RESET_ERROR,
      );
    }
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      this.logger.log(
        `Tentative de vérification d'email avec le token: ${token.substring(0, 10)}...`,
      );
      const user = await this.userService.findByVerificationToken(token);

      if (!user) {
        this.logger.warn(
          `Token de vérification invalide ou expiré: ${token.substring(0, 10)}...`,
        );
        throw new BadRequestException(
          AUTH_MESSAGES.NOT_FOUND.USER_BY_VERIFICATION_TOKEN,
        );
      }

      if (user.isVerified) {
        this.logger.log(`Email déjà vérifié pour l'utilisateur: ${user.id}`);
        return { message: AUTH_MESSAGES.BUSINESS.EMAIL_ALREADY_VERIFIED };
      }

      user.isVerified = true;
      user.verificationToken = undefined;

      await this.userService.save(user);
      this.logger.log(
        `Email vérifié avec succès pour l'utilisateur: ${user.id}`,
      );
      return { message: AUTH_MESSAGES.SUCCESS.EMAIL_VERIFIED };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la vérification d'email: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        AUTH_MESSAGES.SYSTEM.EMAIL_VERIFICATION_ERROR,
      );
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      this.logger.log('Tentative de rafraîchissement de token');
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findOne(payload.sub);

      if (!user) {
        this.logger.warn(
          `Utilisateur introuvable lors du rafraîchissement: ${payload.sub}`,
        );
        throw new UnauthorizedException(AUTH_MESSAGES.NOT_FOUND.USER);
      }

      if (!user.isActive) {
        this.logger.warn(`Compte inactif lors du rafraîchissement: ${user.id}`);
        throw new UnauthorizedException(
          AUTH_MESSAGES.BUSINESS.ACCOUNT_INACTIVE,
        );
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role?.name || '',
      };

      this.logger.log(
        `Token rafraîchi avec succès pour l'utilisateur: ${user.id}`,
      );
      return {
        access_token: this.jwtService.sign(newPayload),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors du rafraîchissement du token: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException(
        AUTH_MESSAGES.BUSINESS.INVALID_REFRESH_TOKEN,
      );
    }
  }
}
