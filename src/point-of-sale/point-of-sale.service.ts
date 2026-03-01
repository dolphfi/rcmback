import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { PointOfSale } from './entities/point-of-sale.entity';
import { CreatePointOfSaleDto } from './dto/create-point-of-sale.dto';
import { UpdatePointOfSaleDto } from './dto/update-point-of-sale.dto';
import { PaginationQueryDto } from '../utility/common/dto/pagination-query.dto';

@Injectable()
export class PointOfSaleService {
  constructor(
    @InjectRepository(PointOfSale)
    private readonly posRepository: Repository<PointOfSale>,
  ) {}

  async create(createDto: CreatePointOfSaleDto): Promise<PointOfSale> {
    const existing = await this.posRepository.findOne({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Un point de vente avec le nom "${createDto.name}" existe déjà.`,
      );
    }
    const pos = this.posRepository.create(createDto);
    return await this.posRepository.save(pos);
  }

  async findAll(query: PaginationQueryDto): Promise<{
    data: PointOfSale[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.name = Like(`%${search}%`);
      // Note: If you want OR condition for address, you'd need an array in TypeORM where
      // where: [{ name: Like(...) }, { address: Like(...) }]
    }

    const [data, total] = await this.posRepository.findAndCount({
      where: search
        ? [{ name: Like(`%${search}%`) }, { address: Like(`%${search}%`) }]
        : {},
      skip,
      take: limit,
      order: { createdAt: 'DESC' } as any,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<PointOfSale> {
    const pos = await this.posRepository.findOne({ where: { id } });
    if (!pos) {
      throw new NotFoundException(
        `Point de vente avec l'ID "${id}" non trouvé.`,
      );
    }
    return pos;
  }

  async update(
    id: string,
    updateDto: UpdatePointOfSaleDto,
  ): Promise<PointOfSale> {
    const pos = await this.findOne(id);
    Object.assign(pos, updateDto);
    return await this.posRepository.save(pos);
  }

  async remove(id: string): Promise<void> {
    const pos = await this.findOne(id);
    await this.posRepository.remove(pos);
  }
}
