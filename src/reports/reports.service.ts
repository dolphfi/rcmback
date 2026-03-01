import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { ProductPosStock } from '../products/entities/product-pos-stock.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
    @InjectRepository(ProductPosStock)
    private productPosStockRepository: Repository<ProductPosStock>,
  ) { }

  async getStatsSummary() {
    const totalSalesResult = await this.saleRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.total)', 'total')
      .getRawOne();

    const totalOrders = await this.saleRepository.count();

    const lowStockCount = await this.productPosStockRepository
      .createQueryBuilder('pp')
      .where('pp.stock <= :threshold', { threshold: 10 })
      .getCount();

    const profitResult = await this.saleItemRepository
      .createQueryBuilder('si')
      .select('SUM((si.price - COALESCE(p.costPrice, 0)) * si.qty)', 'profit')
      .leftJoin('si.product', 'p')
      .getRawOne();

    return {
      totalSales: parseFloat(totalSalesResult?.total || 0),
      totalOrders,
      lowStockCount,
      totalProfit: parseFloat(profitResult?.profit || 0),
    };
  }

  async getSalesOverTime(days: number = 7) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const sales = await this.saleRepository
      .createQueryBuilder('sale')
      .select('DATE(sale.createdAt)', 'date')
      .addSelect('SUM(sale.total)', 'total')
      .where('sale.createdAt >= :date', { date })
      .groupBy('DATE(sale.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return sales.map((s) => ({
      date: s.date,
      total: parseFloat(s.total),
    }));
  }
}
