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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WarrantiesService } from './warranties.service';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Warranties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warranties')
export class WarrantiesController {
    constructor(private readonly warrantiesService: WarrantiesService) { }

    @Post()
    @Roles('ADMIN', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Create a new warranty plan' })
    create(@Body() createWarrantyDto: CreateWarrantyDto) {
        return this.warrantiesService.create(createWarrantyDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all warranty plans' })
    findAll() {
        return this.warrantiesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific warranty plan' })
    findOne(@Param('id') id: string) {
        return this.warrantiesService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Update a warranty plan' })
    update(@Param('id') id: string, @Body() updateWarrantyDto: UpdateWarrantyDto) {
        return this.warrantiesService.update(id, updateWarrantyDto);
    }

    @Delete(':id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Delete a warranty plan' })
    remove(@Param('id') id: string) {
        return this.warrantiesService.remove(id);
    }
}
