import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Service } from './entities/service.entity';
import { PointOfSale } from '../point-of-sale/entities/point-of-sale.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(PointOfSale)
    private readonly posRepository: Repository<PointOfSale>,
  ) { }

  async create(createDto: CreateServiceDto): Promise<Service> {
    const { posIds, ...serviceData } = createDto;
    const service = this.serviceRepository.create(serviceData);

    if (posIds && posIds.length > 0) {
      service.pointOfSales = await this.posRepository.findBy({
        id: In(posIds),
      });
    }

    return await this.serviceRepository.save(service);
  }

  async findAll(posId?: string): Promise<Service[]> {
    const query = this.serviceRepository.createQueryBuilder('service')
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('service.pointOfSales', 'pointOfSales');

    if (posId) {
      query.innerJoin('service.pointOfSales', 'posFilter', 'posFilter.id = :posId', { posId });
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['category', 'pointOfSales'],
    });
    if (!service) {
      throw new NotFoundException(`Service avec l'ID "${id}" non trouvé.`);
    }
    return service;
  }

  async update(id: string, updateDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);
    const { posIds, ...serviceData } = updateDto;

    Object.assign(service, serviceData);

    if (posIds) {
      service.pointOfSales = await this.posRepository.findBy({
        id: In(posIds),
      });
    }

    return await this.serviceRepository.save(service);
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);
    await this.serviceRepository.remove(service);
  }
}
