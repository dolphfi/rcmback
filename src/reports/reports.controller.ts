import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Obtenir un résumé des statistiques' })
  getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getStatsSummary(startDate, endDate);
  }

  @Get('sales-chart')
  @ApiOperation({ summary: 'Obtenir les ventes pour les graphiques selon la période' })
  getSalesChart(
    @Query('period') period: string = '1W',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSalesOverTime(period, startDate, endDate);
  }

  @Get('customer-overview')
  @ApiOperation({ summary: 'Obtenir les statistiques de rétention client (Nouveaux vs Fidèles)' })
  getCustomerOverview(@Query('period') period: string = 'today') {
    return this.reportsService.getCustomerOverview(period);
  }

  @Get('top-selling-products')
  @ApiOperation({ summary: 'Obtenir les produits les plus vendus selon la période' })
  getTopSellingProducts(@Query('period') period: string = 'today') {
    return this.reportsService.getTopSellingProducts(period);
  }

  @Get('monthly-stats')
  @ApiOperation({ summary: 'Obtenir les statistiques mensuelles pour une année donnée' })
  getMonthlyStats(@Query('year', ParseIntPipe) year: number) {
    return this.reportsService.getMonthlyStats(year);
  }

  @Get('top-customers')
  @ApiOperation({ summary: 'Obtenir les meilleurs clients selon la période' })
  getTopCustomers(@Query('period') period: string = 'today') {
    return this.reportsService.getTopCustomers(period);
  }

  @Get('top-categories')
  @ApiOperation({ summary: 'Obtenir les meilleures catégories selon la période' })
  getTopCategories(@Query('period') period: string = 'today') {
    return this.reportsService.getTopCategories(period);
  }

  @Get('order-stats')
  @ApiOperation({ summary: 'Obtenir les statistiques des commandes par heure et jour' })
  getOrderStats(@Query('period') period: string = '1M') {
    return this.reportsService.getHourlyOrderStats(period);
  }

  @Get('pos-summary')
  @ApiOperation({ summary: 'Obtenir le résumé des statistiques par point de vente' })
  getPosSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getPosSummary(startDate, endDate);
  }

  @Get('sales-dates')
  @ApiOperation({ summary: 'Obtenir la liste des dates ayant des ventes' })
  getSalesDates() {
    return this.reportsService.getSalesDates();
  }

  @Get('sales-by-product-pos')
  @ApiOperation({ summary: 'Obtenir les ventes par produit et par point de vente' })
  getSalesByProductPos(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSalesByProductAndPos(startDate, endDate);
  }
}
