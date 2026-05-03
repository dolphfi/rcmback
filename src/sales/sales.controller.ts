import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { SkipMaintenance } from '../utility/decorators/skip-maintenance.decorator';

@ApiTags('Sales')
@Controller('sales')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Enregistrer une nouvelle vente' })
  create(@Body() createSaleDto: CreateSaleDto, @Req() req: any) {
    // req.user.id vient du JwtAuthGuard
    return this.salesService.create(createSaleDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les ventes' })
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'une vente" })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Public()
  @SkipMaintenance()
  @Get('public/:receiptNo')
  @ApiOperation({ summary: "Détails d'une vente par numéro de reçu (Public)" })
  findByReceiptNo(@Param('receiptNo') receiptNo: string) {
    return this.salesService.findByReceiptNo(receiptNo);
  }

  @Get('credits/all')
  @ApiOperation({ summary: 'Lister les ventes à crédit non payées' })
  findCredits() {
    return this.salesService.findCredits();
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Enregistrer un paiement pour une vente à crédit' })
  markAsPaid(
    @Param('id') id: string,
    @Body('amount') amount?: number,
  ) {
    return this.salesService.markAsPaid(id, amount);
  }
}
