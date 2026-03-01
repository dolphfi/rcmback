import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

// Current Module Items
import { SettingsService } from './settings.service';
import { BackupService } from './backup.service';
import { SettingsController } from './settings.controller';
import { Setting } from './entities/setting.entity';
import { BackupHistory } from './entities/backup-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting, BackupHistory]), CloudinaryModule],
  controllers: [SettingsController],
  providers: [SettingsService, BackupService],
  exports: [SettingsService],
})
export class SettingsModule { }
