import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

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
}
