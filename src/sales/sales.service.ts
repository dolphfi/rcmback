import {
    Injectable,
    Logger,
    InternalServerErrorException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, SaleStatus, PaymentMethod } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PricingStock } from '../products/entities/pricing-stock.entity';
import { ProductPosStock } from '../products/entities/product-pos-stock.entity';
import { Customer } from '../customers/entities/customer.entity';

@Injectable()
export class SalesService {
    private readonly logger = new Logger(SalesService.name);

    constructor(
        @InjectRepository(Sale)
        private readonly saleRepository: Repository<Sale>,
        @InjectRepository(SaleItem)
        private readonly saleItemRepository: Repository<SaleItem>,
        @InjectRepository(PricingStock)
        private readonly pricingStockRepository: Repository<PricingStock>,
        @InjectRepository(ProductPosStock)
        private readonly productPosStockRepository: Repository<ProductPosStock>,
        @InjectRepository(Customer)
        private readonly customerRepository: Repository<Customer>,
        private dataSource: DataSource,
    ) { }

    /**
     * Enregistrer une nouvelle vente avec déduction de stock
     */
    async create(createSaleDto: CreateSaleDto, cashierId: string): Promise<Sale> {
        this.logger.log(
            `Crée une vente pour le POS: ${createSaleDto.posId}, Caissier: ${cashierId}`,
        );

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const receiptNumber = await this.generateReceiptNumber();

            // Calculer les totaux
            let subtotal = 0;
            const items: SaleItem[] = [];

            for (const itemDto of createSaleDto.items) {
                const itemTotal = Number(itemDto.price) * Number(itemDto.qty);
                subtotal += itemTotal;

                const saleItem = new SaleItem();
                saleItem.productId = itemDto.productId;
                saleItem.serviceId = itemDto.serviceId;
                saleItem.name = itemDto.name;
                saleItem.price = itemDto.price;
                saleItem.qty = itemDto.qty;
                saleItem.total = itemTotal;
                items.push(saleItem);

                // Déduction de stock si c'est un produit
                if (itemDto.productId) {
                    const pricingStock = await queryRunner.manager.findOne(PricingStock, {
                        where: { product: { id: itemDto.productId } },
                    });

                    if (!pricingStock) {
                        throw new BadRequestException(
                            `Pwodwi "${itemDto.name}" la pa gen enfòmasyon pri/stock.`,
                        );
                    }

                    const productPosStock = await queryRunner.manager.findOne(ProductPosStock, {
                        where: { pricingStockId: pricingStock.id, posId: createSaleDto.posId },
                    });

                    if (!productPosStock) {
                        throw new BadRequestException(
                            `Pwodwi "${itemDto.name}" la pa disponib nan POS sa a.`,
                        );
                    }

                    if (productPosStock.stock < itemDto.qty) {
                        throw new BadRequestException(
                            `Stock ensifizan pou "${itemDto.name}". Disponib: ${productPosStock.stock}`,
                        );
                    }

                    // Déduire le stock
                    productPosStock.stock -= itemDto.qty;
                    await queryRunner.manager.save(productPosStock);
                }
            }

            const tax = subtotal * 0.1;
            const discount = createSaleDto.discount || 0;
            const total = subtotal + tax - discount;

            // Handle amountPaid and isPaid
            const amountPaid = createSaleDto.amountPaid !== undefined
                ? Number(createSaleDto.amountPaid)
                : (createSaleDto.paymentMethod === PaymentMethod.CREDIT ? 0 : total);

            const isPaid = amountPaid >= total;

            const sale = this.saleRepository.create({
                ...createSaleDto,
                receiptNumber,
                cashierId,
                subtotal,
                tax,
                discount,
                total,
                amountPaid,
                isPaid,
                status: SaleStatus.COMPLETED,
                items,
            });

            const savedSale = await queryRunner.manager.save(sale);

            // Award loyalty points to customer if present
            if (createSaleDto.customerId) {
                const customer = await queryRunner.manager.findOne(Customer, {
                    where: { id: createSaleDto.customerId },
                });
                if (customer) {
                    const pointsToAward = Math.floor(total);
                    customer.loyaltyPoints = Number(customer.loyaltyPoints || 0) + pointsToAward;
                    await queryRunner.manager.save(customer);
                    this.logger.log(`Awarded ${pointsToAward} points to customer ${customer.id}`);
                }
            }

            await queryRunner.commitTransaction();
            this.logger.log(
                `Vente enregistrée avec succès: ${savedSale.receiptNumber}`,
            );
            return savedSale;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error('Erreur lors de la création de la vente', error.stack);
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException(
                "Impossible d'enregistrer la vente",
            );
        } finally {
            await queryRunner.release();
        }
    }

    private async generateReceiptNumber(): Promise<string> {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        const count = await this.saleRepository.count();
        const sequence = (count + 1).toString().padStart(5, '0');

        return `REC-${year}${month}${day}-${sequence}`;
    }

    async findAll() {
        return this.saleRepository.find({
            relations: ['items', 'pos', 'cashier', 'customer'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string) {
        const sale = await this.saleRepository.findOne({
            where: { id },
            relations: ['items', 'pos', 'cashier', 'customer'],
        });
        if (!sale) throw new NotFoundException(`Lavant #${id} pa jwenn`);
        return sale;
    }

    /**
     * Liste des ventes à crédit non payées
     */
    async findCredits() {
        return this.saleRepository.find({
            where: {
                paymentMethod: 'CREDIT' as any,
                isPaid: false,
            },
            relations: ['customer', 'cashier', 'pos'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Enregistrer un paiement pour une vente à crédit
     */
    async markAsPaid(id: string, amount?: number) {
        const sale = await this.findOne(id);

        if (amount !== undefined) {
            sale.amountPaid = Number(sale.amountPaid) + Number(amount);
        } else {
            sale.amountPaid = sale.total;
        }

        sale.isPaid = Number(sale.amountPaid) >= Number(sale.total);
        return this.saleRepository.save(sale);
    }
}
