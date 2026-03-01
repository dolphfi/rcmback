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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Services')
@Controller('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Créer un nouveau service' })
  create(@Body() createDto: CreateServiceDto) {
    return this.servicesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les services' })
  findAll(@Query('posId') posId?: string) {
    return this.servicesService.findAll(posId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un service par son ID' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Modifier un service' })
  update(@Param('id') id: string, @Body() updateDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Supprimer un service' })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
