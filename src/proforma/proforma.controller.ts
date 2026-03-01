import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { ProformaService } from './proforma.service';
import { CreateProformaDto } from './dto/create-proforma.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Proforma')
@Controller('proforma')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProformaController {
  constructor(private readonly proformaService: ProformaService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau devis (Proforma)' })
  create(@Body() createProformaDto: CreateProformaDto, @Req() req: any) {
    return this.proformaService.create(createProformaDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les devis' })
  findAll() {
    return this.proformaService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'un devis" })
  findOne(@Param('id') id: string) {
    return this.proformaService.findOne(id);
  }

  // TODO: Implement Convert to Sale endpoint
}
