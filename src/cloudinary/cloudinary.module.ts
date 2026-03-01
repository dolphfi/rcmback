import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryService } from './cloudinary.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [ConfigModule], // Import ConfigModule to use ConfigService in the provider
  controllers: [UploadController],
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryService], // Export CloudinaryService to be used in other modules
})
export class CloudinaryModule {}
