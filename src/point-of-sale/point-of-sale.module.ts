import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointOfSale } from './entities/point-of-sale.entity';
import { PointOfSaleService } from './point-of-sale.service';
import { PointOfSaleController } from './point-of-sale.controller';
import { ScannerGateway } from './scanner.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([PointOfSale])],
  controllers: [PointOfSaleController],
  providers: [PointOfSaleService, ScannerGateway],
  exports: [PointOfSaleService],
})
export class PointOfSaleModule {}
