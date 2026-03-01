import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createDto: CreateBrandDto,
    file?: Express.Multer.File,
  ): Promise<Brand> {
    this.logger.log(
      `Attempting to create a new brand: "${createDto.name}" with logo file: ${file ? file.originalname : 'No'}`,
    );

    const existing = await this.brandRepository.findOne({
      where: { name: createDto.name },
    });
    if (existing) {
      this.logger.warn(
        `Brand creation failed: Brand with name "${createDto.name}" already exists.`,
      );
      throw new ConflictException(
        `Une marque avec le nom "${createDto.name}" esiste déjà.`,
      );
    }

    if (file) {
      try {
        this.logger.log(
          `Uploading logo for brand "${createDto.name}" to Cloudinary...`,
        );
        const uploadResult = await this.cloudinaryService.uploadImage(
          file,
          'brands',
        );
        createDto.logoUrl = uploadResult.secure_url;
        createDto.logoPublicId = uploadResult.public_id;
        this.logger.log(
          `Logo uploaded successfully for brand "${createDto.name}". URL: ${createDto.logoUrl}, Public ID: ${createDto.logoPublicId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to upload brand logo for "${createDto.name}" to Cloudinary.`,
          error.stack,
        );
        // Decide on error handling: non-blocking or throw error
        // Following UserProfile style, we log and continue if non-critical, but let's be strict for now or keep it like UserProfile
      }
    }

    try {
      const brand = this.brandRepository.create(createDto);
      const savedBrand = await this.brandRepository.save(brand);
      this.logger.log(
        `Brand "${createDto.name}" created successfully with ID: ${savedBrand.id}`,
      );
      return savedBrand;
    } catch (error) {
      this.logger.error(
        `Failed to save new brand "${createDto.name}" to database.`,
        error.stack,
      );
      throw error;
    }
  }

  async findAll(): Promise<Brand[]> {
    return await this.brandRepository.find();
  }

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findOne({ where: { id } });
    if (!brand) {
      throw new NotFoundException(`Marque avec l'ID "${id}" non trouvée.`);
    }
    return brand;
  }

  async update(
    id: string,
    updateDto: UpdateBrandDto,
    file?: Express.Multer.File,
  ): Promise<Brand> {
    this.logger.log(
      `Attempting to update brand ID: ${id} with logo file: ${file ? file.originalname : 'No'}`,
    );

    const brand = await this.findOne(id);

    const oldLogoPublicId = brand.logoPublicId;

    if (file) {
      try {
        if (oldLogoPublicId) {
          this.logger.log(
            `Attempting to delete old logo (public_id: ${oldLogoPublicId}) for brand ${id} from Cloudinary...`,
          );
          try {
            await this.cloudinaryService.deleteImage(oldLogoPublicId);
            this.logger.log(`Old logo deleted successfully for brand ${id}.`);
          } catch (deleteError) {
            this.logger.error(
              `Failed to delete old logo (public_id: ${oldLogoPublicId}) for brand ${id}.`,
              deleteError.stack,
            );
          }
        }

        this.logger.log(`Uploading new logo for brand ${id} to Cloudinary...`);
        const uploadResult = await this.cloudinaryService.uploadImage(
          file,
          'brands',
        );
        updateDto.logoUrl = uploadResult.secure_url;
        brand.logoPublicId = uploadResult.public_id;
        this.logger.log(
          `New logo uploaded successfully for brand ${id}. URL: ${updateDto.logoUrl}, Public ID: ${brand.logoPublicId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to process logo update for brand ${id} on Cloudinary.`,
          error.stack,
        );
      }
    }

    // Apply DTO updates explicitly
    const updatedFields: string[] = [];
    const dtoKeys = Object.keys(updateDto) as Array<keyof UpdateBrandDto>;
    dtoKeys.forEach((key) => {
      if (
        updateDto[key] !== undefined &&
        (brand as any)[key] !== updateDto[key]
      ) {
        if (key in brand) {
          (brand as any)[key] = updateDto[key];
          updatedFields.push(key);
        }
      }
    });

    if (updatedFields.length > 0) {
      this.logger.log(
        `Updating fields for brand ${id}: ${updatedFields.join(', ')}`,
      );
    }

    try {
      const savedBrand = await this.brandRepository.save(brand);
      this.logger.log(`Brand ${id} updated successfully.`);
      return savedBrand;
    } catch (error) {
      this.logger.error(
        `Failed to update brand ${id} in database.`,
        error.stack,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Attempting to remove brand ID: ${id}`);
    const brand = await this.findOne(id);

    if (brand.logoPublicId) {
      this.logger.log(
        `Deleting logo (public_id: ${brand.logoPublicId}) for brand ${id} before removal...`,
      );
      try {
        await this.cloudinaryService.deleteImage(brand.logoPublicId);
        this.logger.log(`Logo deleted successfully for brand ${id}.`);
      } catch (error) {
        this.logger.warn(
          `Could not delete logo for brand ${id} during removal.`,
          error.stack,
        );
      }
    }

    try {
      await this.brandRepository.remove(brand);
      this.logger.log(`Brand ${id} removed successfully.`);
    } catch (error) {
      this.logger.error(
        `Failed to remove brand ${id} from database.`,
        error.stack,
      );
      throw error;
    }
  }
}
