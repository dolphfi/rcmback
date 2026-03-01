import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProformaService } from './proforma.service';
import { ProformaController } from './proforma.controller';
import { Proforma } from './entities/proforma.entity';
import { ProformaItem } from './entities/proforma-item.entity';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [TypeOrmModule.forFeature([Proforma, ProformaItem]), SalesModule],
  controllers: [ProformaController],
  providers: [ProformaService],
  exports: [ProformaService],
})
export class ProformaModule {}
