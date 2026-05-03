import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { ProductPosStock } from '../products/entities/product-pos-stock.entity';
import { PointOfSale } from '../point-of-sale/entities/point-of-sale.entity';

import { Purchase, PurchaseStatus } from '../purchases/entities/purchase.entity';
import { PurchaseItem } from '../purchases/entities/purchase-item.entity';
import { Customer } from '../customers/entities/customer.entity';
import { SaleStatus } from '../sales/entities/sale.entity';

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
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    private purchaseItemRepository: Repository<PurchaseItem>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) { }

  async getStatsSummary(startDate?: string, endDate?: string) {
    const applyDateFilter = (qb: any, alias: string = 'sale') => {
      if (startDate && endDate) {
        // Use DATE() for more robust comparison especially for single days
        if (startDate === endDate || (startDate.includes(' ') && startDate.split(' ')[0] === endDate.split(' ')[0])) {
           qb.andWhere(`DATE(${alias}.createdAt) = DATE(:startDate)`, { startDate });
        } else {
           qb.andWhere(`${alias}.createdAt >= :startDate`, { startDate });
           qb.andWhere(`${alias}.createdAt <= :endDate`, { endDate });
        }
      } else if (startDate) {
        qb.andWhere(`${alias}.createdAt >= :startDate`, { startDate });
      } else if (endDate) {
        qb.andWhere(`${alias}.createdAt <= :endDate`, { endDate });
      }
      return qb;
    };

    // Sales stats
    const totalSalesQB = this.saleRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.total)', 'total')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED });
    applyDateFilter(totalSalesQB, 'sale');
    const totalSalesResult = await totalSalesQB.getRawOne();

    const totalSalesReturnQB = this.saleRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.total)', 'total')
      .where('sale.status = :status', { status: SaleStatus.CANCELLED });
    applyDateFilter(totalSalesReturnQB, 'sale');
    const totalSalesReturnResult = await totalSalesReturnQB.getRawOne();

    // Purchase stats
    const totalPurchaseQB = this.purchaseRepository
      .createQueryBuilder('purchase')
      .select('SUM(purchase.total)', 'total')
      .where('purchase.status = :status', { status: PurchaseStatus.RECEIVED });
    applyDateFilter(totalPurchaseQB, 'purchase');
    const totalPurchaseResult = await totalPurchaseQB.getRawOne();

    const totalPurchaseReturnQB = this.purchaseRepository
      .createQueryBuilder('purchase')
      .select('SUM(purchase.total)', 'total')
      .where('purchase.status = :status', { status: PurchaseStatus.CANCELLED });
    applyDateFilter(totalPurchaseReturnQB, 'purchase');
    const totalPurchaseReturnResult = await totalPurchaseReturnQB.getRawOne();

    const totalOrdersQB = this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED });
    applyDateFilter(totalOrdersQB, 'sale');
    const totalOrders = await totalOrdersQB.getCount();

    const ordersToday = await this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('DATE(sale.createdAt) = CURDATE()')
      .getCount();

    const salesTodayResult = await this.saleRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.total)', 'total')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('DATE(sale.createdAt) = CURDATE()')
      .getRawOne();

    const salesReturnsTodayResult = await this.saleRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.total)', 'total')
      .where('sale.status = :status', { status: SaleStatus.CANCELLED })
      .andWhere('DATE(sale.createdAt) = CURDATE()')
      .getRawOne();

    const purchasesTodayResult = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .select('SUM(purchase.total)', 'total')
      .where('purchase.status = :status', { status: PurchaseStatus.RECEIVED })
      .andWhere('DATE(purchase.createdAt) = CURDATE()')
      .getRawOne();

    const purchaseReturnsTodayResult = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .select('SUM(purchase.total)', 'total')
      .where('purchase.status = :status', { status: PurchaseStatus.CANCELLED })
      .andWhere('DATE(purchase.createdAt) = CURDATE()')
      .getRawOne();

    const lowStockCount = await this.productPosStockRepository
      .createQueryBuilder('pp')
      .innerJoin('pp.pricingStock', 'ps')
      .where('pp.stock <= ps.quantityAlert')
      .getCount();

    const profitQB = this.saleItemRepository
      .createQueryBuilder('si')
      .select('SUM((si.price - COALESCE(ps.costPrice, 0)) * si.qty)', 'profit')
      .leftJoin('si.product', 'p')
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('productId', 'productId')
            .addSelect('MIN(costPrice)', 'costPrice')
            .from('pricing_stocks', 'ps')
            .groupBy('productId'),
        'ps',
        'ps.productId = p.id',
      )
      .leftJoin('si.sale', 's')
      .where('s.status = :status', { status: SaleStatus.COMPLETED });
    applyDateFilter(profitQB, 's');
    const profitResult = await profitQB.getRawOne();

    // Top Selling Products
    const topSellingProductsQB = this.saleItemRepository
      .createQueryBuilder('si')
      .select('p.name', 'productName')
      .addSelect('SUM(si.qty)', 'soldQty')
      .addSelect('SUM(si.total)', 'totalAmount')
      .leftJoin('si.product', 'p')
      .leftJoin('si.sale', 's')
      .where('s.status = :status', { status: SaleStatus.COMPLETED })
      .groupBy('p.id, p.name')
      .orderBy('soldQty', 'DESC')
      .limit(5);
    applyDateFilter(topSellingProductsQB, 's');
    const topSellingProducts = await topSellingProductsQB.getRawMany();

    // Recent Sales
    const recentSalesQB = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .orderBy('sale.createdAt', 'DESC')
      .take(5);
    applyDateFilter(recentSalesQB, 'sale');
    const recentSales = await recentSalesQB.getMany();

    // Top Customers
    const topCustomers = await this.getTopCustomers('today');

    // Stats for Overall Info Card
    const totalCustomers = await this.customerRepository.count();
    const totalSuppliers = await this.purchaseRepository
      .createQueryBuilder('p')
      .select('COUNT(DISTINCT p.supplierName)', 'count')
      .getRawOne();

    // Low Stock Products
    const lowStockProducts = await this.productPosStockRepository
      .createQueryBuilder('pp')
      .select('p.name', 'productName')
      .addSelect('pp.stock', 'currentStock')
      .addSelect('img.url', 'imageUrl')
      .leftJoin('pp.pricingStock', 'ps')
      .leftJoin('ps.product', 'p')
      .leftJoin('p.images', 'img')
      .where('pp.stock <= :threshold', { threshold: 10 })
      .limit(5)
      .getRawMany();

    // Top Categories
    const topCategories = await this.getTopCategories('today');

    const monthlySalesResult = await this.saleRepository
      .createQueryBuilder('sale')
      .select("SUM(CASE WHEN MONTH(sale.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(sale.createdAt) = YEAR(CURRENT_DATE()) THEN sale.total ELSE 0 END)", 'thisMonth')
      .addSelect("SUM(CASE WHEN MONTH(sale.createdAt) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(sale.createdAt) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) THEN sale.total ELSE 0 END)", 'lastMonth')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .getRawOne();

    const monthlyOrdersResult = await this.saleRepository
      .createQueryBuilder('sale')
      .select("COUNT(CASE WHEN MONTH(sale.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(sale.createdAt) = YEAR(CURRENT_DATE()) THEN 1 END)", 'thisMonth')
      .addSelect("COUNT(CASE WHEN MONTH(sale.createdAt) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(sale.createdAt) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) THEN 1 END)", 'lastMonth')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .getRawOne();

    const monthlyPurchasesResult = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .select("SUM(CASE WHEN MONTH(purchase.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(purchase.createdAt) = YEAR(CURRENT_DATE()) THEN purchase.total ELSE 0 END)", 'thisMonth')
      .addSelect("SUM(CASE WHEN MONTH(purchase.createdAt) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(purchase.createdAt) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) THEN purchase.total ELSE 0 END)", 'lastMonth')
      .where('purchase.status = :status', { status: PurchaseStatus.RECEIVED })
      .getRawOne();

    const monthlyReturnsResult = await this.saleRepository
      .createQueryBuilder('sale')
      .select("SUM(CASE WHEN MONTH(sale.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(sale.createdAt) = YEAR(CURRENT_DATE()) THEN sale.total ELSE 0 END)", 'thisMonth')
      .addSelect("SUM(CASE WHEN MONTH(sale.createdAt) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(sale.createdAt) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) THEN sale.total ELSE 0 END)", 'lastMonth')
      .where('sale.status = :status', { status: SaleStatus.CANCELLED })
      .getRawOne();

    const monthlyPurchaseReturnsResult = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .select("SUM(CASE WHEN MONTH(purchase.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(purchase.createdAt) = YEAR(CURRENT_DATE()) THEN purchase.total ELSE 0 END)", 'thisMonth')
      .addSelect("SUM(CASE WHEN MONTH(purchase.createdAt) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(purchase.createdAt) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) THEN purchase.total ELSE 0 END)", 'lastMonth')
      .where('purchase.status = :status', { status: PurchaseStatus.CANCELLED })
      .getRawOne();

    const monthlyProfitResult = await this.saleItemRepository
      .createQueryBuilder('si')
      .select("SUM(CASE WHEN MONTH(s.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(s.createdAt) = YEAR(CURRENT_DATE()) THEN (si.price - COALESCE(ps.costPrice, 0)) * si.qty ELSE 0 END)", 'thisMonth')
      .addSelect("SUM(CASE WHEN MONTH(s.createdAt) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(s.createdAt) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) THEN (si.price - COALESCE(ps.costPrice, 0)) * si.qty ELSE 0 END)", 'lastMonth')
      .leftJoin('si.product', 'p')
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('productId', 'productId')
            .addSelect('MIN(costPrice)', 'costPrice')
            .from('pricing_stocks', 'ps')
            .groupBy('productId'),
        'ps',
        'ps.productId = p.id',
      )
      .leftJoin('si.sale', 's')
      .where('s.status = :status', { status: SaleStatus.COMPLETED })
      .getRawOne();

    const calculateGrowth = (current: number, previous: number) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const salesPercentage = calculateGrowth(Number(monthlySalesResult.thisMonth), Number(monthlySalesResult.lastMonth));
    const ordersPercentage = calculateGrowth(Number(monthlyOrdersResult.thisMonth), Number(monthlyOrdersResult.lastMonth));
    const purchasesPercentage = calculateGrowth(Number(monthlyPurchasesResult.thisMonth), Number(monthlyPurchasesResult.lastMonth));
    const returnsPercentage = calculateGrowth(Number(monthlyReturnsResult.thisMonth), Number(monthlyReturnsResult.lastMonth));
    const purchaseReturnsPercentage = calculateGrowth(Number(monthlyPurchaseReturnsResult.thisMonth), Number(monthlyPurchaseReturnsResult.lastMonth));
    const profitPercentage = calculateGrowth(Number(monthlyProfitResult.thisMonth), Number(monthlyProfitResult.lastMonth));

    // monthlyStats: Sales (Revenue) and Purchases (Expense) per month for the current year
    const monthlyStats = await this.getMonthlyStats(new Date().getFullYear());

    // hourlyStats: Order counts per hour for today
    const hourlyStatsRaw = await this.saleRepository
      .createQueryBuilder('sale')
      .select('HOUR(sale.createdAt)', 'hour')
      .addSelect('COUNT(sale.id)', 'count')
      .where('DATE(sale.createdAt) = CURRENT_DATE()')
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .groupBy('hour')
      .getRawMany();

    const hourlyStats = Array.from({ length: 24 }, (_, i) => {
      const hourData = hourlyStatsRaw.find((h) => parseInt(h.hour) === i);
      return parseInt(hourData?.count || 0);
    });

    return {
      totalSales: parseFloat(totalSalesResult?.total || 0),
      totalSalesReturn: parseFloat(totalSalesReturnResult?.total || 0),
      totalPurchase: parseFloat(totalPurchaseResult?.total || 0),
      totalPurchaseReturn: parseFloat(totalPurchaseReturnResult?.total || 0),
      totalOrders,
      ordersToday,
      salesToday: parseFloat(salesTodayResult?.total || 0),
      salesReturnsToday: parseFloat(salesReturnsTodayResult?.total || 0),
      purchasesToday: parseFloat(purchasesTodayResult?.total || 0),
      purchaseReturnsToday: parseFloat(purchaseReturnsTodayResult?.total || 0),
      lowStockCount,
      totalProfit: parseFloat(profitResult?.profit || 0),
      salesPercentage,
      ordersPercentage,
      purchasesPercentage,
      returnsPercentage,
      purchaseReturnsPercentage,
      profitPercentage,
      topSellingProducts,
      recentSales,
      topCustomers,
      lowStockProducts,
      topCategories,
      monthlyStats,
      hourlyStats,
      overallInfo: {
        totalSuppliers: parseInt(totalSuppliers?.count || 0),
        totalCustomers,
        totalOrders,
      },
    };
  }

  async getHourlyOrderStats(period: string = '1M') {
    let interval = '30 DAY';
    switch (period) {
      case '1W': interval = '7 DAY'; break;
      case '1M': interval = '30 DAY'; break;
      case '1Y': interval = '365 DAY'; break;
    }

    // Heatmap: Day of Week (1-7) and Hour (0-23)
    const stats = await this.saleRepository
      .createQueryBuilder('sale')
      .select('DAYOFWEEK(sale.createdAt)', 'day')
      .addSelect('HOUR(sale.createdAt)', 'hour')
      .addSelect('COUNT(sale.id)', 'count')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere(`sale.createdAt >= DATE_SUB(NOW(), INTERVAL ${interval})`)
      .groupBy('day, hour')
      .getRawMany();

    // Map to a grid [hour][day] or similar
    // We'll return the raw grouped data and let the frontend format it if needed, 
    // or return a structured grid.
    return stats.map(s => ({
      day: parseInt(s.day), // 1=Sun, 2=Mon...
      hour: parseInt(s.hour),
      count: parseInt(s.count)
    }));
  }

  async getSalesOverTime(period: string = '1W', startDate?: string, endDate?: string) {
    let interval = '7 DAY';
    let groupFormat = '%Y-%m-%d';
    let selectFormat = 'DATE(sale.createdAt)';

    if (startDate && endDate) {
      // For custom range, we'll use daily grouping by default
      groupFormat = '%Y-%m-%d';
      selectFormat = "DATE_FORMAT(sale.createdAt, '%Y-%m-%d')";
    } else {
      switch (period) {
        case '1D':
          interval = '1 DAY';
          groupFormat = '%Y-%m-%d %H:00:00';
          selectFormat = "DATE_FORMAT(sale.createdAt, '%Y-%m-%d %H:00:00')";
          break;
        case '1W':
          interval = '7 DAY';
          groupFormat = '%Y-%m-%d';
          selectFormat = "DATE_FORMAT(sale.createdAt, '%Y-%m-%d')";
          break;
        case '1M':
          interval = '30 DAY';
          groupFormat = '%Y-%m-%d';
          selectFormat = "DATE_FORMAT(sale.createdAt, '%Y-%m-%d')";
          break;
        case '3M':
          interval = '90 DAY';
          groupFormat = '%Y-%m-%d';
          selectFormat = "DATE_FORMAT(sale.createdAt, '%Y-%m-%d')";
          break;
        case '6M':
          interval = '180 DAY';
          groupFormat = '%Y-%m';
          selectFormat = "DATE_FORMAT(sale.createdAt, '%Y-%m-01')";
          break;
        case '1Y':
          interval = '365 DAY';
          groupFormat = '%Y-%m';
          selectFormat = "DATE_FORMAT(sale.createdAt, '%Y-%m-01')";
          break;
      }
    }

    const salesQB = this.saleRepository
      .createQueryBuilder('sale')
      .select(selectFormat, 'date')
      .addSelect('SUM(sale.total)', 'total')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED });

    if (startDate && endDate) {
      if (startDate === endDate || (startDate.includes(' ') && startDate.split(' ')[0] === endDate.split(' ')[0])) {
        salesQB.andWhere('DATE(sale.createdAt) = DATE(:startDate)', { startDate });
      } else {
        salesQB.andWhere('sale.createdAt >= :startDate AND sale.createdAt <= :endDate', { startDate, endDate });
      }
    } else {
      salesQB.andWhere(`sale.createdAt >= DATE_SUB(NOW(), INTERVAL ${interval})`);
    }

    const sales = await salesQB
      .groupBy("date")
      .orderBy('date', 'ASC')
      .getRawMany();

    // Purchases mirror Sales logic
    let purchaseSelectFormat = selectFormat.replace(/sale/g, 'purchase');
    const purchasesQB = this.purchaseRepository
      .createQueryBuilder('purchase')
      .select(purchaseSelectFormat, 'date')
      .addSelect('SUM(purchase.total)', 'total')
      .where('purchase.status = :status', { status: PurchaseStatus.RECEIVED });

    if (startDate && endDate) {
      if (startDate === endDate || (startDate.includes(' ') && startDate.split(' ')[0] === endDate.split(' ')[0])) {
        purchasesQB.andWhere('DATE(purchase.createdAt) = DATE(:startDate)', { startDate });
      } else {
        purchasesQB.andWhere('purchase.createdAt >= :startDate AND purchase.createdAt <= :endDate', { startDate, endDate });
      }
    } else {
      purchasesQB.andWhere(`purchase.createdAt >= DATE_SUB(NOW(), INTERVAL ${interval})`);
    }

    const purchases = await purchasesQB
      .groupBy("date")
      .orderBy('date', 'ASC')
      .getRawMany();

    const mergedData = {};
    
    sales.forEach(s => {
      const d = s.date;
      mergedData[d] = { date: d, sales: parseFloat(s.total) || 0, purchase: 0 };
    });

    purchases.forEach(p => {
      const d = p.date;
      if (!mergedData[d]) {
        mergedData[d] = { date: d, sales: 0, purchase: parseFloat(p.total) || 0 };
      } else {
        mergedData[d].purchase = parseFloat(p.total) || 0;
      }
    });

    return Object.values(mergedData).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }

  async getCustomerOverview(period: string = 'today') {
    let currentInterval = '1 DAY';
    let previousInterval = '2 DAY';
    let label = 'Today';

    switch (period) {
      case 'today':
        currentInterval = '1 DAY';
        previousInterval = '2 DAY';
        label = 'Today';
        break;
      case '1W':
        currentInterval = '7 DAY';
        previousInterval = '14 DAY';
        label = 'This Week';
        break;
      case '1M':
        currentInterval = '30 DAY';
        previousInterval = '60 DAY';
        label = 'This Month';
        break;
      case '1Y':
        currentInterval = '365 DAY';
        previousInterval = '730 DAY';
        label = 'This Year';
        break;
    }

    const getStats = async (daysBack: number, totalDays: number) => {
      // Find all sales in the window
      const salesInWindow = await this.saleRepository
        .createQueryBuilder('sale')
        .select('DISTINCT sale.customerId', 'customerId')
        .where('sale.status = :status', { status: SaleStatus.COMPLETED })
        .andWhere('sale.customerId IS NOT NULL')
        .andWhere(`sale.createdAt >= DATE_SUB(NOW(), INTERVAL ${totalDays} DAY)`)
        .andWhere(`sale.createdAt < DATE_SUB(NOW(), INTERVAL ${daysBack} DAY)`)
        .getRawMany();

      const customerIds = salesInWindow.map(s => s.customerId);
      if (customerIds.length === 0) return { firstTime: 0, returning: 0 };

      // For these customers, check if they had a sale BEFORE the window
      const windowStart = `DATE_SUB(NOW(), INTERVAL ${totalDays} DAY)`;
      const hasPriorSale = await this.saleRepository
        .createQueryBuilder('sale')
        .select('DISTINCT sale.customerId', 'customerId')
        .where('sale.customerId IN (:...customerIds)', { customerIds })
        .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
        .andWhere(`sale.createdAt < ${windowStart}`)
        .getRawMany();

      const returningCustomerIds = new Set(hasPriorSale.map(s => s.customerId));
      const returning = returningCustomerIds.size;
      const firstTime = customerIds.length - returning;

      return { firstTime, returning };
    };

    // Calculate current period days
    const days = parseInt(currentInterval);
    const current = await getStats(0, days);
    
    // Calculate previous period stats for growth
    const previous = await getStats(days, days * 2);

    const calculateGrowth = (curr: number, prev: number) => {
      if (!prev || prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      firstTime: current.firstTime,
      returning: current.returning,
      firstTimeGrowth: calculateGrowth(current.firstTime, previous.firstTime),
      returningGrowth: calculateGrowth(current.returning, previous.returning),
      label
    };
  }

  async getTopSellingProducts(period: string = 'today') {
    let currentInterval = '1 DAY';
    let previousInterval = '2 DAY';

    switch (period) {
      case 'today':
        currentInterval = '1 DAY';
        previousInterval = '2 DAY';
        break;
      case '1W':
        currentInterval = '7 DAY';
        previousInterval = '14 DAY';
        break;
      case '1M':
        currentInterval = '30 DAY';
        previousInterval = '60 DAY';
        break;
      case '1Y':
        currentInterval = '365 DAY';
        previousInterval = '730 DAY';
        break;
    }

    const getProductsForRange = async (daysBack: number, totalDays: number) => {
      return this.saleItemRepository
        .createQueryBuilder('si')
        .select('p.id', 'id')
        .addSelect('p.name', 'productName')
        .addSelect('SUM(si.qty)', 'soldQty')
        .addSelect('SUM(si.total)', 'totalAmount')
        .addSelect('img.url', 'imageUrl') // Join with ProductImage
        .leftJoin('si.product', 'p')
        .leftJoin('p.images', 'img') // Join product images
        .leftJoin('si.sale', 's')
        .where('s.status = :status', { status: SaleStatus.COMPLETED })
        .andWhere(`s.createdAt >= DATE_SUB(NOW(), INTERVAL ${totalDays} DAY)`)
        .andWhere(`s.createdAt < DATE_SUB(NOW(), INTERVAL ${daysBack} DAY)`)
        .groupBy('p.id, p.name, img.url')
        .orderBy('soldQty', 'DESC')
        .limit(5)
        .getRawMany();
    };

    const days = parseInt(currentInterval);
    const currentProducts = await getProductsForRange(0, days);
    const previousProducts = await getProductsForRange(days, days * 2);

    const productsWithGrowth = currentProducts.map(current => {
      const previous = previousProducts.find(p => p.id === current.id);
      const prevQty = previous ? parseFloat(previous.soldQty) : 0;
      const currQty = parseFloat(current.soldQty);
      
      let growth = 0;
      if (prevQty > 0) {
        growth = Math.round(((currQty - prevQty) / prevQty) * 100);
      } else if (currQty > 0) {
        growth = 100;
      }

      return {
        ...current,
        growth
      };
    });

    return productsWithGrowth;
  }

  async getMonthlyStats(year: number) {
    console.log(`[ReportsService] Fetching monthly stats for year: ${year}`);
    const [monthlyRevenueRaw, monthlyExpenseRaw] = await Promise.all([
      this.saleRepository
        .createQueryBuilder('sale')
        .select('MONTH(sale.createdAt)', 'month')
        .addSelect('SUM(sale.total)', 'total')
        .where('YEAR(sale.createdAt) = :year', { year })
        .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
        .groupBy('month')
        .getRawMany(),
      this.purchaseRepository
        .createQueryBuilder('purchase')
        .select('MONTH(purchase.createdAt)', 'month')
        .addSelect('SUM(purchase.total)', 'total')
        .where('YEAR(purchase.createdAt) = :year', { year })
        .andWhere('purchase.status = :status', { status: PurchaseStatus.RECEIVED })
        .groupBy('month')
        .getRawMany(),
    ]);

    return Array.from({ length: 12 }, (_, i) => {
      const revData = monthlyRevenueRaw.find((m) => parseInt(m.month) === i + 1);
      const expData = monthlyExpenseRaw.find((m) => parseInt(m.month) === i + 1);
      return {
        month: i + 1,
        revenue: parseFloat(revData?.total || 0),
        expense: parseFloat(expData?.total || 0),
      };
    });
  }

  async getTopCustomers(period: string = 'today') {
    let currentIntervalDays = 1;
    switch (period) {
      case 'today': currentIntervalDays = 1; break;
      case '1W': currentIntervalDays = 7; break;
      case '1M': currentIntervalDays = 30; break;
      case '1Y': currentIntervalDays = 365; break;
    }

    const getStats = async (daysBack: number, totalDays: number) => {
      return this.saleRepository.createQueryBuilder('sale')
        .innerJoin('sale.customer', 'customer')
        .select([
          'customer.id as id',
          'customer.firstName as firstName',
          'customer.lastName as lastName',
          'SUM(sale.total) as totalSpent',
          'COUNT(sale.id) as orderCount'
        ])
        .where('sale.status = :status', { status: SaleStatus.COMPLETED })
        .andWhere(`sale.createdAt >= DATE_SUB(NOW(), INTERVAL ${totalDays} DAY)`)
        .andWhere(`sale.createdAt < DATE_SUB(NOW(), INTERVAL ${daysBack} DAY)`)
        .groupBy('customer.id')
        .orderBy('SUM(sale.total)', 'DESC')
        .limit(5)
        .getRawMany();
    };

    const currentData = await getStats(0, currentIntervalDays);
    const previousData = await getStats(currentIntervalDays, currentIntervalDays * 2);

    const productsWithGrowth = currentData.map(current => {
      const previous = previousData.find(p => p.id === current.id);
      const prevSpent = previous ? parseFloat(previous.totalSpent) : 0;
      const currSpent = parseFloat(current.totalSpent);
      
      let growth = 0;
      if (prevSpent > 0) {
        growth = Math.round(((currSpent - prevSpent) / prevSpent) * 100);
      } else if (currSpent > 0) {
        growth = 100;
      }

      return {
        ...current,
        totalSpent: parseFloat(current.totalSpent),
        orderCount: parseInt(current.orderCount),
        growth
      };
    });

    return productsWithGrowth;
  }

  async getTopCategories(period: string = 'today') {
    let currentIntervalDays = 1;
    switch (period) {
      case 'today': currentIntervalDays = 1; break;
      case '1W': currentIntervalDays = 7; break;
      case '1M': currentIntervalDays = 30; break;
      case '1Y': currentIntervalDays = 365; break;
    }

    const getStats = async (daysBack: number, totalDays: number) => {
      return this.saleItemRepository.createQueryBuilder('si')
        .innerJoin('si.product', 'p')
        .innerJoin('p.category', 'c')
        .innerJoin('si.sale', 's')
        .select([
          'c.id as id',
          'c.name as categoryName',
          'SUM(si.total) as totalSales'
        ])
        .where('s.status = :status', { status: SaleStatus.COMPLETED })
        .andWhere(`s.createdAt >= DATE_SUB(NOW(), INTERVAL ${totalDays} DAY)`)
        .andWhere(`s.createdAt < DATE_SUB(NOW(), INTERVAL ${daysBack} DAY)`)
        .groupBy('c.id, c.name')
        .orderBy('SUM(si.total)', 'DESC')
        .limit(5)
        .getRawMany();
    };

    const currentData = await getStats(0, currentIntervalDays);
    const previousData = await getStats(currentIntervalDays, currentIntervalDays * 2);

    const categoriesWithGrowth = currentData.map(current => {
      const previous = previousData.find(p => p.id === current.id);
      const prevSales = previous ? parseFloat(previous.totalSales) : 0;
      const currSales = parseFloat(current.totalSales);
      
      let growth = 0;
      if (prevSales > 0) {
        growth = Math.round(((currSales - prevSales) / prevSales) * 100);
      } else if (currSales > 0) {
        growth = 100;
      }

      return {
        ...current,
        totalSales: parseFloat(current.totalSales),
        growth
      };
    });

    return categoriesWithGrowth;
  }

  async getPosSummary(startDate?: string, endDate?: string) {
    const applyDateFilter = (qb: any, alias: string = 'sale') => {
      if (startDate && endDate) {
        if (startDate === endDate || (startDate.includes(' ') && startDate.split(' ')[0] === endDate.split(' ')[0])) {
           qb.andWhere(`DATE(${alias}.createdAt) = DATE(:startDate)`, { startDate });
        } else {
           qb.andWhere(`${alias}.createdAt >= :startDate`, { startDate });
           qb.andWhere(`${alias}.createdAt <= :endDate`, { endDate });
        }
      } else if (startDate) {
        qb.andWhere(`${alias}.createdAt >= :startDate`, { startDate });
      } else if (endDate) {
        qb.andWhere(`${alias}.createdAt <= :endDate`, { endDate });
      }
      return qb;
    };

    // Use a subquery or separate queries to get all POS even with 0 sales
    const allPos = await this.saleRepository.manager.getRepository(PointOfSale).find({
      where: { isActive: true },
      select: ['id', 'name']
    });

    const posStatsQB = this.saleRepository.createQueryBuilder('sale')
      .select([
        'sale.posId as id',
        'COUNT(sale.id) as totalOrders',
        'SUM(sale.total) as totalSales'
      ])
      .where('sale.status = :status', { status: SaleStatus.COMPLETED });

    applyDateFilter(posStatsQB, 'sale');

    const basicStats = await posStatsQB
      .groupBy('sale.posId')
      .getRawMany();

    const profitStatsQB = this.saleItemRepository.createQueryBuilder('si')
      .innerJoin('si.sale', 's')
      .select([
        's.posId as id',
        'SUM((si.price - COALESCE(ps.costPrice, 0)) * si.qty) as totalProfit'
      ])
      .leftJoin('si.product', 'p')
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('productId', 'productId')
            .addSelect('MIN(costPrice)', 'costPrice')
            .from('pricing_stocks', 'ps')
            .groupBy('productId'),
        'ps',
        'ps.productId = p.id',
      )
      .where('s.status = :status', { status: SaleStatus.COMPLETED });

    applyDateFilter(profitStatsQB, 's');

    const profitStats = await profitStatsQB
      .groupBy('s.posId')
      .getRawMany();

    // Map all POS and merge stats
    return allPos.map(pos => {
      const stats = basicStats.find(s => s.id === pos.id);
      const profit = profitStats.find(ps => ps.id === pos.id);
      
      return {
        id: pos.id,
        name: pos.name,
        totalSales: parseFloat(stats?.totalSales || 0),
        totalOrders: parseInt(stats?.totalOrders || 0),
        totalProfit: parseFloat(profit?.totalProfit || 0)
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }

  async getSalesByProductAndPos(startDate?: string, endDate?: string) {
    const qb = this.saleItemRepository.createQueryBuilder('si')
      .innerJoin('si.product', 'p')
      .innerJoin('si.sale', 's')
      .innerJoin('s.pos', 'pos')
      .select([
        'p.id as productId',
        'p.name as productName',
        'pos.id as posId',
        'pos.name as posName',
        'SUM(si.qty) as totalQty',
        'SUM(si.total) as totalAmount'
      ])
      .where('s.status = :status', { status: SaleStatus.COMPLETED });

    if (startDate && endDate) {
      if (startDate === endDate || (startDate.includes(' ') && startDate.split(' ')[0] === endDate.split(' ')[0])) {
        qb.andWhere('DATE(s.createdAt) = DATE(:startDate)', { startDate });
      } else {
        qb.andWhere('s.createdAt >= :startDate AND s.createdAt <= :endDate', { startDate, endDate });
      }
    }

    return await qb.groupBy('p.id, pos.id').orderBy('p.name', 'ASC').getRawMany();
  }

  async getSalesDates() {
    const dates = await this.saleRepository
      .createQueryBuilder('sale')
      .select('DISTINCT DATE(sale.createdAt)', 'date')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .orderBy('date', 'DESC')
      .getRawMany();

    return dates.map(d => d.date);
  }
}
