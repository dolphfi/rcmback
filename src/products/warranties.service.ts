import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warranty } from './entities/warranty.entity';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';

@Injectable()
export class WarrantiesService {
    private readonly logger = new Logger(WarrantiesService.name);

    constructor(
        @InjectRepository(Warranty)
        private readonly warrantyRepository: Repository<Warranty>,
    ) { }

    async create(createWarrantyDto: CreateWarrantyDto): Promise<Warranty> {
        const warranty = this.warrantyRepository.create(createWarrantyDto);
        return await this.warrantyRepository.save(warranty);
    }

    async findAll(): Promise<Warranty[]> {
        return await this.warrantyRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Warranty> {
        const warranty = await this.warrantyRepository.findOne({ where: { id } });
        if (!warranty) {
            throw new NotFoundException(`Warranty with ID ${id} not found`);
        }
        return warranty;
    }

    async update(id: string, updateWarrantyDto: UpdateWarrantyDto): Promise<Warranty> {
        const warranty = await this.findOne(id);
        Object.assign(warranty, updateWarrantyDto);
        return await this.warrantyRepository.save(warranty);
    }

    async remove(id: string): Promise<void> {
        const warranty = await this.findOne(id);
        await this.warrantyRepository.remove(warranty);
    }
}
