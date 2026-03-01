import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from './entities/promotion.entity';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto';

@Injectable()
export class PromotionsService {
    constructor(
        @InjectRepository(Promotion)
        private readonly promotionRepository: Repository<Promotion>,
    ) { }

    async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
        const existing = await this.promotionRepository.findOne({
            where: { code: createPromotionDto.code.toUpperCase() },
        });
        if (existing) {
            throw new ConflictException(`Promo kòd "${createPromotionDto.code}" la deja egziste.`);
        }

        const promotion = this.promotionRepository.create(createPromotionDto);
        return this.promotionRepository.save(promotion);
    }

    async findAll(): Promise<Promotion[]> {
        return this.promotionRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Promotion> {
        const promotion = await this.promotionRepository.findOne({ where: { id } });
        if (!promotion) {
            throw new NotFoundException(`Pwomosyon #${id} pa jwenn.`);
        }
        return promotion;
    }

    async update(id: string, updatePromotionDto: UpdatePromotionDto): Promise<Promotion> {
        const promotion = await this.findOne(id);

        if (updatePromotionDto.code) {
            const existing = await this.promotionRepository.findOne({
                where: { code: updatePromotionDto.code.toUpperCase() },
            });
            if (existing && existing.id !== id) {
                throw new ConflictException(`Promo kòd "${updatePromotionDto.code}" la deja egziste.`);
            }
        }

        Object.assign(promotion, updatePromotionDto);
        return this.promotionRepository.save(promotion);
    }

    async remove(id: string): Promise<void> {
        const promotion = await this.findOne(id);
        await this.promotionRepository.remove(promotion);
    }

    async findByCode(code: string): Promise<Promotion> {
        const promotion = await this.promotionRepository.findOne({
            where: { code: code.toUpperCase(), isActive: true },
        });
        if (!promotion) {
            throw new NotFoundException(`Kòd promo "${code}" sa a pa valid oswa li ekspire.`);
        }

        const now = new Date();
        if (now < promotion.startDate || now > promotion.endDate) {
            throw new ConflictException(`Kòd promo "${code}" sa a pa nan peryòd validite li.`);
        }

        return promotion;
    }
}
