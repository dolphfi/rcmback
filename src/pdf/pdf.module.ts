import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { PointOfSale } from '../point-of-sale/entities/point-of-sale.entity';
import { Setting } from '../settings/entities/setting.entity';
import { Sale } from '../sales/entities/sale.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PointOfSale, Setting, Sale])],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule { }
