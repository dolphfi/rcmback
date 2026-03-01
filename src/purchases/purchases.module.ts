import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { Purchase } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { PricingStock } from '../products/entities/pricing-stock.entity';
import { ProductPosStock } from '../products/entities/product-pos-stock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, PurchaseItem, PricingStock, ProductPosStock])],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule { }
