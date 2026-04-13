import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { ProductPosStock } from '../products/entities/product-pos-stock.entity';
import { Product } from '../products/entities/product.entity';

import { Purchase } from '../purchases/entities/purchase.entity';
import { PurchaseItem } from '../purchases/entities/purchase-item.entity';
import { Customer } from '../customers/entities/customer.entity';

import { PricingStock } from '../products/entities/pricing-stock.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      SaleItem,
      ProductPosStock,
      Product,
      PricingStock,
      Purchase,
      PurchaseItem,
      Customer,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule { }
