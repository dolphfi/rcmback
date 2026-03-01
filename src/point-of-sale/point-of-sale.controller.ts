import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PointOfSaleService } from './point-of-sale.service';
import { CreatePointOfSaleDto } from './dto/create-point-of-sale.dto';
import { UpdatePointOfSaleDto } from './dto/update-point-of-sale.dto';
import { PaginationQueryDto } from '../utility/common/dto/pagination-query.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Point of Sale')
@Controller('point-of-sale')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PointOfSaleController {
  constructor(private readonly posService: PointOfSaleService) { }

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Créer un nouveau point de vente' })
  create(@Body() createDto: CreatePointOfSaleDto) {
    return this.posService.create(createDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Lister tous les points de vente avec pagination' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.posService.findAll(query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CASHIER')
  @ApiOperation({ summary: 'Récupérer un point de vente par son ID' })
  findOne(@Param('id') id: string) {
    return this.posService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Modifier un point de vente' })
  update(@Param('id') id: string, @Body() updateDto: UpdatePointOfSaleDto) {
    return this.posService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Supprimer un point de vente' })
  remove(@Param('id') id: string) {
    return this.posService.remove(id);
  }
}
