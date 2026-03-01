import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigModule } from '@nestjs/config';
import { PdfService } from '../utility/pdf/pdf.service';
import { SettingsModule } from '../settings/settings.module';

@Global()
@Module({
  imports: [ConfigModule, SettingsModule],
  controllers: [],
  providers: [EmailService, PdfService],
  exports: [EmailService],
})
export class EmailModule {}
