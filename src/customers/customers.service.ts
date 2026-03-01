import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createDto: CreateCustomerDto): Promise<Customer> {
    if (createDto.email) {
      const existingEmail = await this.customerRepository.findOne({
        where: { email: createDto.email },
      });
      if (existingEmail) {
        throw new ConflictException(
          `Un client avec l'email "${createDto.email}" esiste déjà.`,
        );
      }
    }
    if (createDto.phone) {
      const existingPhone = await this.customerRepository.findOne({
        where: { phone: createDto.phone },
      });
      if (existingPhone) {
        throw new ConflictException(
          `Un client avec le téléphone "${createDto.phone}" esiste déjà.`,
        );
      }
    }

    const customer = this.customerRepository.create(createDto);
    return await this.customerRepository.save(customer);
  }

  async findAll(): Promise<Customer[]> {
    return await this.customerRepository.find();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Client avec l'ID "${id}" non trouvé.`);
    }
    return customer;
  }

  async findByPhone(phone: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { phone },
    });
    if (!customer) {
      throw new NotFoundException(
        `Client avec le téléphone "${phone}" non trouvé.`,
      );
    }
    return customer;
  }

  async update(id: string, updateDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, updateDto);
    return await this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
  }
}
