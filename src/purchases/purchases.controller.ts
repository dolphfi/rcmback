import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel achat (Restockage)' })
  create(@Body() createPurchaseDto: CreatePurchaseDto, @Req() req: any) {
    return this.purchasesService.create(createPurchaseDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les achats' })
  findAll() {
    return this.purchasesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: "Voir les détails d'un achat" })
  findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }
}
