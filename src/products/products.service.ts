import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual } from 'typeorm';
import { Product } from './entities/product.entity';
import { PricingStock } from './entities/pricing-stock.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductPosStock } from './entities/product-pos-stock.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(PricingStock)
    private readonly pricingStockRepository: Repository<PricingStock>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async create(
    createDto: CreateProductDto,
    files: Express.Multer.File[],
  ): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const uploadedPublicIds: string[] = [];

    try {
      const { pricingStocks, images, ...productData } = createDto;

      // Check SKU uniqueness for each pricing stock
      if (pricingStocks) {
        for (const ps of pricingStocks) {
          if (ps.sku) {
            const existing = await queryRunner.manager.findOne(PricingStock, {
              where: { sku: ps.sku },
            });
            if (existing) {
              throw new ConflictException(`Le SKU "${ps.sku}" existe déjà.`);
            }
          }
        }
      }

      // Handle Images: Upload to Cloudinary first
      const imagesToSave: { url: string; publicId: string }[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            const uploadResult = await this.cloudinaryService.uploadImage(
              file,
              'products',
            );
            uploadedPublicIds.push(uploadResult.public_id);
            imagesToSave.push({
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id,
            });
          } catch (uploadError) {
            throw new InternalServerErrorException(
              `Erreur upload imaj nan Cloudinary: ${uploadError.message}`,
            );
          }
        }
      }

      const product = this.productRepository.create(productData);
      const savedProduct = await queryRunner.manager.save(product);

      // Save Image Entities
      if (imagesToSave.length > 0) {
        const imageEntities = imagesToSave.map((img, index) =>
          this.productImageRepository.create({
            ...img,
            isPrimary: index === 0,
            product: savedProduct,
          }),
        );
        await queryRunner.manager.save(imageEntities);
      }

      // Handle Pricing & Stocks
      if (pricingStocks && pricingStocks.length > 0) {
        for (const psDto of pricingStocks) {
          const { posStocks, ...psData } = psDto;
          const pricingStock = this.pricingStockRepository.create({
            ...psData,
            product: savedProduct,
          });
          const savedPS = await queryRunner.manager.save(pricingStock);

          if (posStocks && posStocks.length > 0) {
            const posStockEntities = posStocks.map((ps) => ({
              ...ps,
              pricingStock: savedPS,
            }));
            await queryRunner.manager.save(ProductPosStock, posStockEntities);
          }
        }
      }

      await queryRunner.commitTransaction();
      return await this.findOne(savedProduct.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Rollback Cloudinary uploads if DB transaction fails
      if (uploadedPublicIds.length > 0) {
        for (const publicId of uploadedPublicIds) {
          try {
            await this.cloudinaryService.deleteImage(publicId);
          } catch (deleteError) {
            // Log but don't rethrow to avoid masking the primary error
            console.error(`Erreur rollback Cloudinary pou ${publicId}:`, deleteError.message);
          }
        }
      }

      if (error instanceof ConflictException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Erreur kreyasyon pwodwi: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(posId?: string): Promise<Product[]> {
    const query = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.pricingStocks', 'pricingStocks')
      .leftJoinAndSelect('pricingStocks.posStocks', 'posStocks')
      .leftJoinAndSelect('posStocks.pointOfSale', 'pointOfSale')
      .leftJoinAndSelect('product.images', 'images');

    if (posId) {
      query.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from(ProductPosStock, 'p_ps')
          .innerJoin('p_ps.pricingStock', 'p_pst')
          .where('p_pst.productId = product.id')
          .andWhere('p_ps.posId = :posId')
          .getQuery();
        return `EXISTS ${subQuery}`;
      });
      query.setParameters({ posId });
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'category',
        'brand',
        'pricingStocks',
        'pricingStocks.posStocks',
        'pricingStocks.posStocks.pointOfSale',
        'images',
      ],
    });
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID "${id}" non trouvé.`);
    }
    return product;
  }

  async update(id: string, updateDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const { pricingStocks, images, ...productData } = updateDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      Object.assign(product, productData);
      await queryRunner.manager.save(product);

      // Simple strategy for update: Replace everything (Can be optimized later)
      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        const imageEntities = images.map((img) =>
          this.productImageRepository.create({
            ...img,
            product: product,
          }),
        );
        await queryRunner.manager.save(imageEntities);
      }

      if (pricingStocks) {
        // This is complex for updates with variants, but keeping it simple for now as requested
        await queryRunner.manager.delete(PricingStock, { product: { id } });
        for (const psDto of pricingStocks) {
          const { posStocks, ...psData } = psDto;
          const pricingStock = this.pricingStockRepository.create({
            ...psData,
            product: product,
          });
          const savedPS = await queryRunner.manager.save(pricingStock);

          if (posStocks && posStocks.length > 0) {
            const posStockEntities = posStocks.map((ps) => ({
              ...ps,
              pricingStock: savedPS,
            }));
            await queryRunner.manager.save(ProductPosStock, posStockEntities);
          }
        }
      }

      await queryRunner.commitTransaction();
      return await this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        `Erreur modification produit: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async refillStock(dto: UpdateStockDto): Promise<ProductPosStock> {
    const { pricingStockId, posId, quantity } = dto;

    let posStock = await this.dataSource.manager.findOne(ProductPosStock, {
      where: { pricingStockId, posId },
    });

    if (!posStock) {
      // Create new record if it doesn't exist
      posStock = this.dataSource.manager.create(ProductPosStock, {
        pricingStockId,
        posId,
        stock: quantity,
      });
    } else {
      // Increment existing stock
      posStock.stock = Number(posStock.stock) + Number(quantity);
    }

    return await this.dataSource.manager.save(posStock);
  }

  async findExpired(): Promise<Product[]> {
    return await this.productRepository.find({
      where: {
        expiryDate: LessThanOrEqual(new Date()),
      },
      relations: [
        'category',
        'brand',
        'pricingStocks',
        'pricingStocks.posStocks',
        'pricingStocks.posStocks.pointOfSale',
        'images',
      ],
    });
  }
}
