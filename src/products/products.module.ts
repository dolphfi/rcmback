import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { PricingStock } from './entities/pricing-stock.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductPosStock } from './entities/product-pos-stock.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Warranty } from './entities/warranty.entity';
import { WarrantiesService } from './warranties.service';
import { WarrantiesController } from './warranties.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            PricingStock,
            ProductImage,
            ProductPosStock,
            Warranty,
        ]),
        CloudinaryModule,
    ],
    controllers: [ProductsController, WarrantiesController],
    providers: [ProductsService, WarrantiesService],
    exports: [ProductsService, WarrantiesService],
})
export class ProductsModule { }
