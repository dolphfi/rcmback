import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Customers')
@Controller('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CASHIER')
  @ApiOperation({ summary: 'Créer un nouveau client' })
  create(@Body() createDto: CreateCustomerDto) {
    return this.customersService.create(createDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CASHIER')
  @ApiOperation({ summary: 'Lister tous les clients' })
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CASHIER')
  @ApiOperation({ summary: 'Récupérer un client par son ID' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get('phone/:phone')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CASHIER')
  @ApiOperation({ summary: 'Rechercher un client par téléphone' })
  findByPhone(@Param('phone') phone: string) {
    return this.customersService.findByPhone(phone);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CASHIER')
  @ApiOperation({ summary: 'Modifier un client' })
  update(@Param('id') id: string, @Body() updateDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Supprimer un client' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
