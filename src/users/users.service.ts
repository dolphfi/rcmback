import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { User } from './entities/user.entity';
import { Repository, MoreThan } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { PaginationQueryDto } from '../utility/common/dto/pagination-query.dto';
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../utility/common/constants/error-messages';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly emailService: EmailService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(
      `Attempting to create user with email: ${createUserDto.email}`,
    );

    if (createUserDto.password !== createUserDto.confirmPassword) {
      this.logger.warn(
        `User creation failed for email ${createUserDto.email}: Passwords do not match.`,
      );
      throw new BadRequestException(
        ERROR_MESSAGES.BUSINESS.PASSWORDS_DO_NOT_MATCH,
      );
    }

    // Exclude confirmPassword from the data to be saved
    const { confirmPassword, role, ...userData } = createUserDto;

    // Handle role alias for roleId
    if (role && !userData.roleId) {
      userData.roleId = role;
    }

    const user = this.userRepository.create(userData);

    try {
      const savedUser = await this.userRepository.save(user);
      this.logger.log(
        `User created successfully with ID: ${savedUser.id} and email: ${savedUser.email}`,
      );
      return savedUser;
    } catch (error) {
      // Handle potential errors, e.g., duplicate email (unique constraint violation)
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        // Specific error code for MySQL unique violation
        this.logger.error(
          `User creation failed: Email ${createUserDto.email} already exists.`,
          error.stack,
        );
        throw new BadRequestException(
          ERROR_MESSAGES.BUSINESS.EMAIL_ALREADY_EXISTS(createUserDto.email),
        );
      }
      this.logger.error(
        `User creation failed for email ${createUserDto.email}.`,
        error.stack,
      );
      throw new InternalServerErrorException(
        ERROR_MESSAGES.SYSTEM.USER_CREATION_ERROR,
      );
    }
  }

  async createByAdmin(createUserDto: CreateUserByAdminDto): Promise<User> {
    this.logger.log(`Admin attempting to create user with email: ${createUserDto.email}`);

    // Create a robust random password to satisfy database constraints initially
    const temporaryPassword = crypto.randomBytes(24).toString('hex');
    const { roleId, ...userData } = createUserDto;

    const user = this.userRepository.create({
      ...userData,
      password: temporaryPassword,
      roleId: roleId
    });

    try {
      // High-entropy random verification token for resetting the password
      const resetToken = crypto.randomBytes(32).toString('hex') + 'A1!';
      const resetPasswordExpires = new Date();
      resetPasswordExpires.setHours(resetPasswordExpires.getHours() + 24); // Valid for 24 hours

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetPasswordExpires;
      user.isVerified = true; // Mark as verified since it was created by admin

      const savedUser = await this.userRepository.save(user);
      this.logger.log(`User created successfully by admin. ID: ${savedUser.id}, Email: ${savedUser.email}`);

      try {
        await this.emailService.sendWelcomeSetupEmail(
          savedUser.email,
          { firstName: savedUser.firstName, lastName: savedUser.lastName },
          savedUser.resetPasswordToken as string
        );
        this.logger.log(`Onboarding email sent successfully to ${savedUser.email}`);
      } catch (emailError) {
        this.logger.error(`Failed to send onboarding email to ${savedUser.email}. Token generated.`, emailError.stack);
        // Do not fail the user creation if email fails
      }

      return savedUser;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        this.logger.error(`User creation failed: Email ${createUserDto.email} already exists.`, error.stack);
        throw new BadRequestException(ERROR_MESSAGES.BUSINESS.EMAIL_ALREADY_EXISTS(createUserDto.email));
      }
      this.logger.error(`User creation failed for email ${createUserDto.email}.`, error.stack);
      throw new InternalServerErrorException(ERROR_MESSAGES.SYSTEM.USER_CREATION_ERROR);
    }
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { limit = 10, page = 1 } = paginationQuery;
    const offset = (page - 1) * limit;

    const [data, total] = await this.userRepository.findAndCount({
      take: limit,
      skip: offset,
      order: {
        lastName: 'ASC',
        firstName: 'ASC',
      },
      // Note: We are not loading any relations here for performance.
      // Specific profile views should be used for detailed data.
    });

    const lastPage = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage,
      },
    };
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { verificationToken: token } });
  }

  async findByResetPasswordToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND.USER(id));
    }

    this.userRepository.merge(user, updateUserDto);
    await this.userRepository.save(user);
    return this.userRepository.findOne({ where: { id } }) as Promise<User>;
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND.USER(id));
    }
    await this.userRepository.remove(user);
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async unlockAccount(userId: string, adminId: string): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND.USER(userId));
    }

    // Réinitialiser le verrouillage en utilisant la méthode de l'entité.
    // Cette méthode est supposée mettre à jour user.loginAttempts à 0
    // et user.lockoutUntil à null, conformément à la logique de verrouillage du compte.
    user.resetLoginAttempts();

    // Sauvegarder l'utilisateur avec toutes les modifications en une seule fois.
    // La méthode save de TypeORM retourne l'entité sauvegardée.
    try {
      const savedUser = await this.userRepository.save(user);
      this.logger.log(
        `Compte utilisateur #${userId} déverrouillé avec succès par l'admin #${adminId}.`,
      );
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la sauvegarde de l'utilisateur #${userId} pendant le déverrouillage par l'admin #${adminId}.`,
        error.stack,
      );
      // Il est important de logger l'erreur et de lancer une exception appropriée.
      throw new InternalServerErrorException(
        ERROR_MESSAGES.SYSTEM.ACCOUNT_UNLOCK_ERROR,
      );
    }
  }

  async viewProfile(userId: string): Promise<any> {
    this.logger.log(`Attempting to view profile for user ID: ${userId}`);
    const user = await this.findOne(userId);
    if (!user) {
      this.logger.warn(`View profile failed: User #${userId} not found`);
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND.USER(userId));
    }

    this.logger.log(
      `Profile viewed successfully for user ID: ${userId} with role ${user.role}`,
    );
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
    ipAddress?: string,
    userAgent?: string,
    avatarFile?: Express.Multer.File,
  ): Promise<User> {
    this.logger.log(
      `Attempting to update profile for user ID: ${userId} with avatar file: ${avatarFile ? avatarFile.originalname : 'No'}`,
    );

    const user = await this.findOne(userId);
    if (!user) {
      this.logger.warn(`Update profile failed: User #${userId} not found`);
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND.USER(userId));
    }

    const oldAvatarPublicId: string | undefined = user.avatarPublicId;

    if (avatarFile) {
      try {
        this.logger.log(`Uploading avatar for user ${userId} to Cloudinary...`);
        if (oldAvatarPublicId) {
          this.logger.log(
            `Attempting to delete old avatar (public_id: ${oldAvatarPublicId}) for user ${userId} from Cloudinary...`,
          );
          try {
            await this.cloudinaryService.deleteImage(oldAvatarPublicId);
            this.logger.log(
              `Old avatar (public_id: ${oldAvatarPublicId}) deleted successfully for user ${userId}.`,
            );
          } catch (deleteError) {
            this.logger.error(
              `Failed to delete old avatar (public_id: ${oldAvatarPublicId}) for user ${userId}.`,
              deleteError.stack,
            );
            // Non-blocking error, log and continue
          }
        }
        this.logger.log(
          `Uploading new avatar for user ${userId} to Cloudinary...`,
        );
        const uploadResult = await this.cloudinaryService.uploadImage(
          avatarFile,
          'avatars',
        );
        // These will be applied to the user object directly later
        updateUserDto.avatarUrl = uploadResult.secure_url;
        // We need a way to pass public_id to be set on the user entity
        // For now, let's assume updateUserDto can temporarily hold it or we set it directly on 'user' object
        user.avatarPublicId = uploadResult.public_id;
        this.logger.log(
          `New avatar uploaded successfully for user ${userId}. URL: ${updateUserDto.avatarUrl}, Public ID: ${user.avatarPublicId}`,
        );
        this.logger.log(
          `Avatar uploaded successfully for user ${userId}. URL: ${updateUserDto.avatarUrl}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to upload avatar for user ${userId} to Cloudinary.`,
          error.stack,
        );
        // Decide on error handling: throw error or continue without avatar update
        // For now, we log and continue, the avatar field in DTO won't be set from upload
        // Consider throwing new InternalServerErrorException('Avatar upload failed.');
      }
    }

    // User is already fetched at the beginning of the method

    // Include avatarPublicId in fields to check for changes if it's managed via DTO,
    // but here we set it directly on the user entity. We still need to ensure 'avatarUrl' (URL) changes are logged.
    const updatedFields: Record<string, any> = {};

    // Handle DTO fields first
    const dtoKeys = Object.keys(updateUserDto) as Array<keyof UpdateUserDto>;
    dtoKeys.forEach((key) => {
      if (
        updateUserDto[key] !== undefined &&
        user[key] !== updateUserDto[key]
      ) {
        // Ensure the key is a valid assignable key to User entity
        if (key in user) {
          updatedFields[key] = updateUserDto[key];
          (user as any)[key] = updateUserDto[key]; // Apply update
        }
      }
    });

    // Handle avatarPublicId separately as it's not in UpdateUserDto
    // but set directly on the user object if a new avatar was uploaded.
    if (user.avatarPublicId !== oldAvatarPublicId) {
      updatedFields['avatarPublicId'] = user.avatarPublicId;
      // user.avatarPublicId is already updated on the user object if a new file was processed
    }
    // Ensure avatarUrl (from DTO, potentially set by file upload) is also applied if changed
    // This is covered by the loop above if avatarUrl is in updateUserDto and different

    try {
      await this.userRepository.save(user);
      this.logger.log(`Profile updated successfully for user ID: ${userId}`);
      // Exclude sensitive fields before returning, if not already handled by class-transformer in entity or controller
      const {
        password,
        verificationToken,
        resetPasswordToken,
        resetPasswordExpires,
        lockoutUntil,
        ...safeUser
      } = user;
      return safeUser as User; // Cast back to User, assuming safeUser has the core User fields
    } catch (error) {
      this.logger.error(
        `Failed to update profile for user ID: ${userId}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        ERROR_MESSAGES.SYSTEM.PROFILE_UPDATE_ERROR,
      );
    }
  }

  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Attempting to update password for user ID: ${userId}`);
    const user = await this.findOne(userId);
    if (!user) {
      this.logger.warn(`Update password failed: User #${userId} not found`);
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND.USER(userId));
    }

    const isPasswordValid = await user.validatePassword(
      updatePasswordDto.currentPassword,
    );
    if (!isPasswordValid) {
      this.logger.warn(
        `Update password failed for user ID: ${userId} - Invalid current password`,
      );
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_CURRENT_PASSWORD,
      );
    }

    if (
      updatePasswordDto.newPassword !== updatePasswordDto.confirmNewPassword
    ) {
      this.logger.warn(
        `Update password failed for user ID: ${userId} - New passwords do not match`,
      );
      throw new BadRequestException(
        ERROR_MESSAGES.BUSINESS.NEW_PASSWORDS_DO_NOT_MATCH,
      );
    }

    // Assuming the User entity handles hashing in a @BeforeUpdate hook or a setter
    user.password = updatePasswordDto.newPassword; // The @BeforeUpdate hook in User entity will hash it

    try {
      await this.userRepository.save(user);
      this.logger.log(`Password updated successfully for user ID: ${userId}`);
      return { message: SUCCESS_MESSAGES.PASSWORD_UPDATED };
    } catch (error) {
      this.logger.error(
        `Failed to update password for user ID: ${userId}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        ERROR_MESSAGES.SYSTEM.PASSWORD_UPDATE_ERROR,
      );
    }
  }

  async countActiveUsers(windowMinutes = 15): Promise<number> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    return this.userRepository.count({
      where: {
        isActive: true,
        lastLoginAt: MoreThan(since),
      },
    });
  }
}
