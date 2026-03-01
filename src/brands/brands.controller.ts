import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FastifyRequest } from 'fastify';
import { plainToInstance } from 'class-transformer';
import { validateOrReject, ValidationError } from 'class-validator';
import { ERROR_MESSAGES } from '../utility/common/constants/error-messages';

@ApiTags('Brands')
@Controller('brands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrandsController {
  private readonly logger = new Logger(BrandsController.name);

  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    description: 'Brand data with optional logo file or JSON object',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Apple' },
            description: { type: 'string', example: 'Premium electronics' },
            isActive: { type: 'boolean', example: true },
            logo: {
              type: 'string',
              format: 'binary',
            },
          },
          required: ['name'],
        },
        {
          $ref: '#/components/schemas/CreateBrandDto',
        },
      ],
    },
  })
  @ApiOperation({ summary: 'Créer une nouvelle marque' })
  async create(@Request() req: FastifyRequest) {
    if (!(req as any).isMultipart()) {
      const body = req.body as CreateBrandDto;
      // For JSON, we still want to benefit from class-transformer and manual validation
      const createDto = plainToInstance(CreateBrandDto, body);
      try {
        await validateOrReject(createDto);
      } catch (errors) {
        const firstError = (errors as ValidationError[])[0];
        const message =
          Object.values(firstError.constraints || {})[0] || 'Validation failed';
        throw new BadRequestException(message);
      }
      return this.brandsService.create(createDto);
    }

    const brandData: Record<string, any> = {};
    let logoFile: Express.Multer.File | undefined = undefined;

    try {
      const parts = (req as any).parts();
      for await (const part of parts) {
        if (part.type === 'file') {
          if (part.fieldname === 'logo') {
            if (!part.filename) continue;
            const buffer = await part.toBuffer();
            logoFile = {
              fieldname: part.fieldname,
              originalname: part.filename,
              encoding: part.encoding,
              mimetype: part.mimetype,
              buffer: buffer,
              size: buffer.length,
            } as Express.Multer.File;
          }
        } else if (part.type === 'field') {
          brandData[part.fieldname] = part.value;
        }
      }
    } catch (error) {
      this.logger.error('Error processing brand multipart form', error);
      throw new InternalServerErrorException(
        ERROR_MESSAGES.SYSTEM.FORM_PROCESSING_ERROR || 'Form processing error',
      );
    }

    const createDto = plainToInstance(CreateBrandDto, brandData, {
      enableImplicitConversion: true,
    });
    try {
      await validateOrReject(createDto);
    } catch (errors) {
      const firstError = (errors as ValidationError[])[0];
      const message =
        Object.values(firstError.constraints || {})[0] || 'Validation failed';
      throw new BadRequestException(message);
    }
    return this.brandsService.create(createDto, logoFile);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les marques' })
  findAll() {
    return this.brandsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une marque par son ID' })
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    description: 'Update brand data with optional logo file or JSON object',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            isActive: { type: 'boolean' },
            logo: {
              type: 'string',
              format: 'binary',
            },
          },
        },
        {
          $ref: '#/components/schemas/UpdateBrandDto',
        },
      ],
    },
  })
  @ApiOperation({ summary: 'Modifier une marque' })
  async update(@Param('id') id: string, @Request() req: FastifyRequest) {
    if (!(req as any).isMultipart()) {
      const body = req.body as UpdateBrandDto;
      const updateDto = plainToInstance(UpdateBrandDto, body);
      try {
        await validateOrReject(updateDto);
      } catch (errors) {
        const firstError = (errors as ValidationError[])[0];
        const message =
          Object.values(firstError.constraints || {})[0] || 'Validation failed';
        throw new BadRequestException(message);
      }
      return this.brandsService.update(id, updateDto);
    }

    const brandData: Record<string, any> = {};
    let logoFile: Express.Multer.File | undefined = undefined;

    try {
      const parts = (req as any).parts();
      for await (const part of parts) {
        if (part.type === 'file') {
          if (part.fieldname === 'logo') {
            if (!part.filename) continue;
            const buffer = await part.toBuffer();
            logoFile = {
              fieldname: part.fieldname,
              originalname: part.filename,
              encoding: part.encoding,
              mimetype: part.mimetype,
              buffer: buffer,
              size: buffer.length,
            } as Express.Multer.File;
          }
        } else if (part.type === 'field') {
          brandData[part.fieldname] = part.value;
        }
      }
    } catch (error) {
      this.logger.error('Error processing brand update multipart form', error);
      throw new InternalServerErrorException(
        ERROR_MESSAGES.SYSTEM.FORM_PROCESSING_ERROR || 'Form processing error',
      );
    }

    const updateDto = plainToInstance(UpdateBrandDto, brandData, {
      enableImplicitConversion: true,
    });
    try {
      await validateOrReject(updateDto);
    } catch (errors) {
      const firstError = (errors as ValidationError[])[0];
      const message =
        Object.values(firstError.constraints || {})[0] || 'Validation failed';
      throw new BadRequestException(message);
    }
    return this.brandsService.update(id, updateDto, logoFile);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Supprimer une marque' })
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
