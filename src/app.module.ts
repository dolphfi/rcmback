import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { RolesModule } from './roles/roles.module';
import { EmailModule } from './email/email.module';
import { PointOfSaleModule } from './point-of-sale/point-of-sale.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import * as Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';
import { ProductsModule } from './products/products.module';
import { ServicesModule } from './services/services.module';
import { CustomersModule } from './customers/customers.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MaintenanceGuard } from './utility/common/guards/maintenance.guard';
import { SalesModule } from './sales/sales.module';
import { PdfModule } from './pdf/pdf.module';
import { ProformaModule } from './proforma/proforma.module';
import { PurchasesModule } from './purchases/purchases.module';
import { ReportsModule } from './reports/reports.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuditLogInterceptor } from './utility/common/interceptors/audit-log.interceptor';
import { PromotionsModule } from './promotions/promotions.module';
import { ExpensesModule } from './expenses/expenses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HOST_NAME: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),
        DB_TYPE: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        CLOUDINARY_CLOUD_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),
        RESEND_API_KEY: Joi.string().required(),
        ANTI_PASSBACK_SECONDS: Joi.number().optional().default(60),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE') as any,
        host: configService.get<string>('HOST_NAME'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),//entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    SettingsModule,
    RolesModule,
    PointOfSaleModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    ServicesModule,
    CustomersModule,
    CloudinaryModule,
    EmailModule,
    SalesModule,
    PdfModule,
    ProformaModule,
    PurchasesModule,
    ReportsModule,
    AuditLogsModule,
    PromotionsModule,
    ExpensesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: MaintenanceGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule { }
