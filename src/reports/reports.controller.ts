import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
  getSummary() {
    return this.reportsService.getStatsSummary();
  }

  @Get('sales-chart')
  @ApiOperation({ summary: 'Obtenir les ventes par jour pour les graphiques' })
  getSalesChart(@Query('days') days: number = 7) {
    return this.reportsService.getSalesOverTime(days);
  }
}
