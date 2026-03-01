import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Purchase, PurchaseStatus } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PricingStock } from '../products/entities/pricing-stock.entity';
import { ProductPosStock } from '../products/entities/product-pos-stock.entity';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    private purchaseItemRepository: Repository<PurchaseItem>,
    @InjectRepository(PricingStock)
    private pricingStockRepository: Repository<PricingStock>,
    @InjectRepository(ProductPosStock)
    private productPosStockRepository: Repository<ProductPosStock>,
    private dataSource: DataSource,
  ) { }

  async create(
    createPurchaseDto: CreatePurchaseDto,
    adminId: string,
  ): Promise<Purchase> {
    this.logger.log(
      `Crée un achat pour le POS: ${createPurchaseDto.posId}, Par: ${adminId}`,
    );

    const purchaseNumber = await this.generatePurchaseNumber();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let total = 0;
      const items = createPurchaseDto.items.map((itemDto) => {
        const itemTotal = Number(itemDto.costPrice) * Number(itemDto.qty);
        total += itemTotal;

        const purchaseItem = new PurchaseItem();
        purchaseItem.productId = itemDto.productId;
        purchaseItem.name = itemDto.name;
        purchaseItem.costPrice = itemDto.costPrice;
        purchaseItem.qty = itemDto.qty;
        purchaseItem.total = itemTotal;
        return purchaseItem;
      });

      const purchase = this.purchaseRepository.create({
        ...createPurchaseDto,
        purchaseNumber,
        createdById: adminId,
        total,
        status: PurchaseStatus.RECEIVED,
        items,
      });

      const savedPurchase = await queryRunner.manager.save(purchase);

      // Mettre à jour le stock dans le POS
      for (const item of items) {
        // Find the appropriate PricingStock for this product
        const pricingStock = await queryRunner.manager.findOne(PricingStock, {
          where: { product: { id: item.productId } },
        });

        if (!pricingStock) {
          this.logger.warn(`No pricing stock found for product ${item.productId}`);
          continue;
        }

        let productPosStock = await queryRunner.manager.findOne(ProductPosStock, {
          where: { pricingStockId: pricingStock.id, posId: createPurchaseDto.posId },
        });

        if (!productPosStock) {
          productPosStock = queryRunner.manager.create(ProductPosStock, {
            pricingStockId: pricingStock.id,
            posId: createPurchaseDto.posId,
            stock: item.qty,
          });
        } else {
          productPosStock.stock = Number(productPosStock.stock) + Number(item.qty);
        }
        await queryRunner.manager.save(productPosStock);
      }

      await queryRunner.commitTransaction();
      return savedPurchase;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error("Erreur lors de la création de l'achat", error.stack);
      throw new InternalServerErrorException(
        "Impossible d'enregistrer l'achat",
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Purchase[]> {
    return this.purchaseRepository.find({
      relations: ['pos', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Purchase> {
    const purchase = await this.purchaseRepository.findOne({
      where: { id },
      relations: ['pos', 'createdBy', 'items', 'items.product'],
    });

    if (!purchase) {
      throw new NotFoundException(`Achat #${id} pa jwenn`);
    }

    return purchase;
  }

  private async generatePurchaseNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const lastPurchase = await this.purchaseRepository.find({
      order: { createdAt: 'DESC' },
      take: 1,
    });

    let sequence = 1;
    if (lastPurchase.length > 0) {
      const lastNumber = lastPurchase[0].purchaseNumber;
      const parts = lastNumber.split('-');
      if (parts.length === 3) {
        const lastSequence = parseInt(parts[2]);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
    }

    return `PUR-${year}${month}-${sequence.toString().padStart(5, '0')}`;
  }
}
