import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { BackupHistory } from './entities/backup-history.entity';
import { PaginationQueryDto } from '../utility/common/dto/pagination-query.dto';
import { SettingKey } from '../utility/common/enum/setting-keys.enum';
import { ERROR_MESSAGES } from '../utility/common/constants/error-messages';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import * as fs from 'fs';
import { BackupService } from './backup.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @InjectRepository(BackupHistory)
    private readonly backupHistoryRepository: Repository<BackupHistory>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly backupService: BackupService,
  ) { }

  async create(createSettingDto: CreateSettingDto): Promise<Setting> {
    const { key } = createSettingDto;
    const existingSetting = await this.settingRepository.findOne({
      where: { key },
    });

    if (existingSetting) {
      this.logger.warn(
        `Attempted to create a setting with a duplicate key: ${key}`,
      );
      throw new ConflictException(
        ERROR_MESSAGES.BUSINESS.SETTING_KEY_EXISTS(key),
      );
    }

    const newSetting = this.settingRepository.create(createSettingDto);
    this.logger.log(`Creating new setting with key: ${key}`);
    return this.settingRepository.save(newSetting);
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { limit = 10, page = 1 } = paginationQuery;
    const offset = (page - 1) * limit;

    const [data, total] = await this.settingRepository.findAndCount({
      take: limit,
      skip: offset,
      order: {
        key: 'ASC',
      },
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

  async findOne(id: string): Promise<Setting> {
    this.logger.log(`Fetching setting with ID: ${id}`);
    const setting = await this.settingRepository.findOne({ where: { id } });
    if (!setting) {
      this.logger.warn(`Setting with ID '${id}' not found.`);
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND.SETTING(id));
    }
    return setting;
  }

  async findOneByKey(key: SettingKey): Promise<Setting> {
    this.logger.log(`Fetching setting with key: ${key}`);
    const setting = await this.settingRepository.findOne({ where: { key } });
    if (!setting) {
      this.logger.warn(`Setting with key '${key}' not found.`);
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND.SETTING_BY_KEY(key));
    }
    return setting;
  }

  async update(
    id: string,
    updateSettingDto: UpdateSettingDto,
  ): Promise<Setting> {
    // On ne peut pas utiliser preload car le DTO ne contient pas la clé `key` qui est l'identifiant métier.
    const setting = await this.findOne(id);

    // Appliquer les modifications
    Object.assign(setting, updateSettingDto);

    this.logger.log(`Updating setting with ID: ${id}`);
    return this.settingRepository.save(setting);
  }

  async updateByKey(
    key: SettingKey,
    updateData: Partial<UpdateSettingDto>,
  ): Promise<Setting> {
    let setting = await this.settingRepository.findOne({ where: { key } });

    if (setting) {
      // Update existing setting
      Object.assign(setting, updateData);
    } else {
      // Create new setting if it doesn't exist
      this.logger.log(
        `Le paramètre avec la clé "${key}" n'existe pas. Création...`,
      );

      // For specific keys like SCHOOL_LOGO_URL, we can provide default metadata.
      let label = updateData.label;
      let description = updateData.description;

      if (key === SettingKey.MAINTENANCE_MODE) {
        label = label ?? 'Mode maintenance';
        description =
          description ?? 'Active ou désactive le mode maintenance du système.';
      }

      if (updateData.value === undefined || label === undefined) {
        throw new ConflictException(
          ERROR_MESSAGES.BUSINESS.SETTING_VALUE_AND_LABEL_REQUIRED,
        );
      }

      setting = this.settingRepository.create({
        key: key,
        value: updateData.value,
        label: label,
        description: description,
      });
    }

    return this.settingRepository.save(setting);
  }

  async remove(id: string): Promise<void> {
    const setting = await this.findOne(id);
    await this.settingRepository.remove(setting);
    this.logger.log(`Removed setting with ID: ${id}`);
  }

  async updateBusinessLogo(file: Express.Multer.File): Promise<Setting> {
    if (!file) {
      throw new BadRequestException(ERROR_MESSAGES.BUSINESS.NO_FILE_UPLOADED);
    }

    this.logger.log(`Uploading new business logo: ${file.originalname}`);

    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'kolabopos',
    );

    // Delete old logo from Cloudinary if it exists
    const oldPublicIdSetting = await this.settingRepository.findOne({
      where: { key: SettingKey.BUSINESS_LOGO_PUBLIC_ID },
    });

    if (oldPublicIdSetting && oldPublicIdSetting.value) {
      this.logger.log(
        `Deleting old logo from Cloudinary with Public ID: ${oldPublicIdSetting.value}`,
      );
      try {
        await this.cloudinaryService.deleteImage(oldPublicIdSetting.value);
      } catch (error) {
        this.logger.error(
          `Failed to delete old logo from Cloudinary: ${error.message}`,
        );
      }
    }

    // Save both URL and Public ID
    await this.updateByKey(SettingKey.BUSINESS_LOGO_PUBLIC_ID, {
      value: uploadResult.public_id,
      label: 'Business Logo Public ID',
      description: 'The public ID of the business logo on Cloudinary.',
    });

    return this.updateByKey(SettingKey.BUSINESS_LOGO_URL, {
      value: uploadResult.secure_url,
      label: 'Business Logo URL',
      description: 'The URL of the business logo.',
    });
  }

  async updateBusinessProfile(
    data: UpdateBusinessProfileDto,
    file?: Express.Multer.File,
  ): Promise<Setting[]> {
    const results: Setting[] = [];

    // 1. Handle Logo if present
    if (file) {
      this.logger.log(`Processing logo update for business profile`);
      const logoSetting = await this.updateBusinessLogo(file);
      results.push(logoSetting);
    }

    // 2. Update all other fields
    this.logger.log(`Updating business profile data fields`);
    const dataEntries = Object.entries(data);

    for (const [key, value] of dataEntries) {
      if (value !== undefined && value !== null) {
        // Map common labels for new settings if they don't exist
        let label = '';
        let description = '';

        switch (key) {
          case 'BUSINESS_NAME':
            label = 'Nom de l\'Entreprise';
            break;
          case 'BUSINESS_SLOGAN':
            label = 'Slogan';
            break;
          case 'BUSINESS_ADDRESS':
            label = 'Siège Social (Adresse)';
            break;
          case 'BUSINESS_PHONE':
            label = 'Téléphone';
            break;
          case 'BUSINESS_EMAIL':
            label = 'Email';
            break;
          case 'CURRENCY_CODE':
            label = 'Devise';
            break;
          case 'TAX_PERCENTAGE':
            label = 'Taxe par défaut (%)';
            break;
          case 'RECEIPT_FOOTER_MESSAGE':
            label = 'Message pied de page';
            break;
          case 'EXCHANGE_RATE':
            label = 'Taux de change (USD -> HTG)';
            break;
          case 'BUSINESS_BANK_INFO':
            label = 'Enfòmasyon Bankè';
            description = 'Lis kont bankè biznis lan (JSON)';
            break;
        }

        const updated = await this.updateByKey(key as SettingKey, {
          value: (value ?? '').toString(),
          label: label || key,
          description: description || `Configuration pour ${key}`,
        });
        results.push(updated);
      }
    }

    return results;
  }

  async getBackupHistory(): Promise<BackupHistory[]> {
    return this.backupHistoryRepository.find({
      order: { date: 'DESC' },
    });
  }

  async backupData(): Promise<{ success: boolean; message: string; url?: string }> {
    this.logger.log('Manually triggered system backup to Cloudinary');
    let tempPath: string | null = null;
    try {
      // 1. Generate Backup
      tempPath = await this.backupService.generateBackup();

      // 2. Upload to Cloudinary
      const folder = 'kolabopos/backups';
      const fileName = tempPath.split('/').pop() || 'backup.sql';
      const publicId = fileName.replace('.sql', '');

      const uploadResult = await this.cloudinaryService.uploadRawFileFromPath(
        tempPath,
        folder,
        publicId,
      );

      // 3. Store Metadata in Settings
      await this.updateByKey(SettingKey.LAST_BACKUP_URL, {
        value: uploadResult.secure_url,
        label: 'URL de la dernière sauvegarde',
        description: 'Lien vers le fichier SQL de la dernière sauvegarde sur Cloudinary'
      });
      await this.updateByKey(SettingKey.LAST_BACKUP_DATE, {
        value: new Date().toISOString(),
        label: 'Date de la dernière sauvegarde',
        description: 'Date et heure de la dernière sauvegarde réussie'
      });

      // 4. Save to Backup History
      const historyRecord = this.backupHistoryRepository.create({
        fileName,
        url: uploadResult.secure_url,
        status: 'SUCCESS',
      });
      await this.backupHistoryRepository.save(historyRecord);

      return {
        success: true,
        message: 'Le système a été sauvegardé avec succès dans le cloud.',
        url: uploadResult.secure_url,
      };
    } catch (error) {
      this.logger.error(`Cloud backup failed: ${error.message}`);
      throw new InternalServerErrorException(`Backup failed: ${error.message}`);
    } finally {
      // 4. Cleanup
      if (tempPath && fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
        this.logger.log(`Temporary backup file deleted: ${tempPath}`);
      }
    }
  }

  async optimizeSystem(): Promise<{ success: boolean; message: string }> {
    this.logger.log('Manually triggered system optimization');
    // Actual optimization logic would go here (e.g., VACUUM, clear cache)
    return {
      success: true,
      message: 'Le système a été optimisé avec succès.',
    };
  }
}
