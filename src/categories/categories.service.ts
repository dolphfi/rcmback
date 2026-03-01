import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { SubCategory } from './entities/subcategory.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,
  ) { }

  async create(createDto: CreateCategoryDto): Promise<any> {
    if (createDto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: createDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Catégorie parente avec l'ID "${createDto.parentId}" non trouvée.`,
        );
      }
      const subCategory = this.subCategoryRepository.create({
        name: createDto.name,
        description: createDto.description,
        isActive: createDto.isActive,
        category: parent,
      });
      return await this.subCategoryRepository.save(subCategory);
    }

    const existing = await this.categoryRepository.findOne({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Une catégorie avec le nom "${createDto.name}" existe déjà.`,
      );
    }
    const category = this.categoryRepository.create(createDto);
    return await this.categoryRepository.save(category);
  }

  async findAll(type?: 'product' | 'service'): Promise<Category[]> {
    const where: any = {};
    if (type) {
      where.type = type;
    }
    return await this.categoryRepository.find({
      where,
      relations: ['subCategories'],
    });
  }

  async findOne(id: string): Promise<any> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['subCategories'],
    });
    if (category) return category;

    const subCategory = await this.subCategoryRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (subCategory) return subCategory;

    throw new NotFoundException(
      `Catégorie ou Sous-catégorie avec l'ID "${id}" non trouvée.`,
    );
  }

  async update(id: string, updateDto: UpdateCategoryDto): Promise<any> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (category) {
      Object.assign(category, updateDto);
      return await this.categoryRepository.save(category);
    }

    const subCategory = await this.subCategoryRepository.findOne({
      where: { id },
    });
    if (subCategory) {
      if (updateDto.parentId) {
        const parent = await this.categoryRepository.findOne({
          where: { id: updateDto.parentId },
        });
        if (parent) {
          subCategory.category = parent;
        }
      }
      if (updateDto.name !== undefined) subCategory.name = updateDto.name;
      if (updateDto.description !== undefined)
        subCategory.description = updateDto.description;
      if (updateDto.isActive !== undefined)
        subCategory.isActive = updateDto.isActive;

      return await this.subCategoryRepository.save(subCategory);
    }

    throw new NotFoundException(
      `Catégorie ou Sous-catégorie avec l'ID "${id}" non trouvée.`,
    );
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (category) {
      await this.categoryRepository.remove(category);
      return;
    }

    const subCategory = await this.subCategoryRepository.findOne({
      where: { id },
    });
    if (subCategory) {
      await this.subCategoryRepository.remove(subCategory);
      return;
    }

    throw new NotFoundException(
      `Catégorie ou Sous-catégorie avec l'ID "${id}" non trouvée.`,
    );
  }
}
