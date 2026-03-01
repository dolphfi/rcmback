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
  Request,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FastifyRequest } from 'fastify';
import { plainToInstance } from 'class-transformer';
import { validateOrReject, ValidationError } from 'class-validator';

@ApiTags('Products')
@Controller('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Créer un nouveau produit' })
  async create(@Request() req: FastifyRequest) {
    if (!(req as any).isMultipart()) {
      const body = req.body as CreateProductDto;
      const createDto = plainToInstance(CreateProductDto, body);
      try {
        await validateOrReject(createDto);
      } catch (errors) {
        const firstError = (errors as ValidationError[])[0];
        const message = Object.values(firstError.constraints || {})[0] || 'Validation failed';
        throw new BadRequestException(message);
      }
      return this.productsService.create(createDto, []);
    }

    let dataField: string | undefined = undefined;
    const files: Express.Multer.File[] = [];

    try {
      const parts = (req as any).parts();
      for await (const part of parts) {
        if (part.type === 'file') {
          if (part.fieldname === 'images') {
            if (!part.filename) continue;
            const buffer = await part.toBuffer();
            files.push({
              fieldname: part.fieldname,
              originalname: part.filename,
              encoding: part.encoding,
              mimetype: part.mimetype,
              buffer: buffer,
              size: buffer.length,
            } as Express.Multer.File);
          }
        } else if (part.type === 'field') {
          if (part.fieldname === 'data') {
            dataField = part.value as string;
          }
        }
      }
    } catch (error) {
      console.error('Multipart processing error:', error);
      throw new InternalServerErrorException(`Error processing multipart form: ${error.message || error}`);
    }

    if (!dataField) {
      throw new BadRequestException('Missing data field in multipart request');
    }

    const createDto = plainToInstance(CreateProductDto, JSON.parse(dataField));
    try {
      await validateOrReject(createDto);
    } catch (errors) {
      const firstError = (errors as ValidationError[])[0];
      const message = Object.values(firstError.constraints || {})[0] || 'Validation failed';
      throw new BadRequestException(message);
    }

    return this.productsService.create(createDto, files);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les produits' })
  findAll(@Query('posId') posId?: string) {
    return this.productsService.findAll(posId);
  }

  @Get('expired')
  @ApiOperation({ summary: 'Lister les produits expirés' })
  findExpired() {
    return this.productsService.findExpired();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un produit par son ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Modifier un produit' })
  update(@Param('id') id: string, @Body() updateDto: UpdateProductDto) {
    return this.productsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Supprimer un produit' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post('stock/refill')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Recharger le stock d\'un produit (variant)' })
  refillStock(@Body() updateStockDto: UpdateStockDto) {
    return this.productsService.refillStock(updateStockDto);
  }
}
