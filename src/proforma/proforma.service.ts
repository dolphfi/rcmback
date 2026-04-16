import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Proforma, ProformaStatus } from './entities/proforma.entity';
import { ProformaItem } from './entities/proforma-item.entity';
import { CreateProformaDto } from './dto/create-proforma.dto';
import { SalesService } from '../sales/sales.service';
import { CreateSaleDto } from '../sales/dto/create-sale.dto';
import { PaymentMethod } from '../sales/entities/sale.entity';

@Injectable()
export class ProformaService {
  private readonly logger = new Logger(ProformaService.name);

  constructor(
    @InjectRepository(Proforma)
    private readonly proformaRepository: Repository<Proforma>,
    @InjectRepository(ProformaItem)
    private readonly proformaItemRepository: Repository<ProformaItem>,
    private readonly salesService: SalesService,
    private dataSource: DataSource,
  ) {}

  /**
   * Créer un nouveau Proforma (Devis)
   */
  async create(
    createProformaDto: CreateProformaDto,
    adminId: string,
  ): Promise<Proforma> {
    this.logger.log(
      `Crée un proforma pour le POS: ${createProformaDto.posId}, Par: ${adminId}`,
    );

    const proformaNumber = await this.generateProformaNumber();

    // Calculer les totaux
    let subtotal = 0;
    const items = createProformaDto.items.map((itemDto) => {
      const itemTotal = Number(itemDto.price) * Number(itemDto.qty);
      subtotal += itemTotal;

      const proformaItem = new ProformaItem();
      proformaItem.productId = itemDto.productId;
      proformaItem.serviceId = itemDto.serviceId;
      proformaItem.name = itemDto.name;
      proformaItem.price = itemDto.price;
      proformaItem.qty = itemDto.qty;
      proformaItem.total = itemTotal;
      return proformaItem;
    });

    const tax = subtotal * 0.1;
    const discount = createProformaDto.discount || 0;
    const total = subtotal + tax - discount;

    // Date d'expiration (7 jours par défaut)
    const expiresAt = createProformaDto.expiresAt
      ? new Date(createProformaDto.expiresAt)
      : new Date();
    if (!createProformaDto.expiresAt) {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    const proforma = this.proformaRepository.create({
      ...createProformaDto,
      proformaNumber,
      createdById: adminId,
      subtotal,
      tax,
      discount,
      total,
      status: ProformaStatus.PENDING,
      expiresAt,
      items,
    });

    try {
      return await this.proformaRepository.save(proforma);
    } catch (error) {
      this.logger.error('Erreur lors de la création du proforma', error.stack);
      throw new InternalServerErrorException(
        "Impossible d'enregistrer le devis",
      );
    }
  }

  private async generateProformaNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    const count = await this.proformaRepository.count();
    const sequence = (count + 1).toString().padStart(5, '0');

    return `PRO-${year}${month}${day}-${sequence}`;
  }

  async findAll() {
    return this.proformaRepository.find({
      relations: [
        'items',
        'items.service',
        'items.service.category',
        'items.product',
        'pos',
        'createdBy',
        'customer',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const proforma = await this.proformaRepository.findOne({
      where: { id },
      relations: [
        'items',
        'items.service',
        'items.service.category',
        'items.product',
        'pos',
        'createdBy',
        'customer',
      ],
    });
    if (!proforma) throw new NotFoundException(`Devis #${id} pa jwenn`);
    return proforma;
  }

  /**
   * Convertir un devis en vente réelle
   * TODO: Intégrer avec SalesService pour finaliser la conversion
   */
  async convertToSale(proformaId: string, cashierId: string) {
    const proforma = await this.findOne(proformaId);

    if (proforma.status !== ProformaStatus.PENDING) {
      throw new BadRequestException(`Devis sa a deja ${proforma.status}`);
    }

    if (new Date() > new Date(proforma.expiresAt)) {
      proforma.status = ProformaStatus.EXPIRED;
      await this.proformaRepository.save(proforma);
      throw new BadRequestException('Devis sa a ekspire');
    }

    // Simplement un placeholder pour le moment jusqu'à ce que le POS frontend l'utilise
    return proforma;
  }
}
