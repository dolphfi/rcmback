import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async create(createExpenseDto: CreateExpenseDto, user: User): Promise<Expense> {
    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      userId: user.id,
    });
    return await this.expenseRepository.save(expense);
  }

  async findAll(posId?: string, startDate?: string, endDate?: string): Promise<Expense[]> {
    const query = this.expenseRepository.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.pos', 'pos')
      .leftJoinAndSelect('expense.user', 'user')
      .orderBy('expense.date', 'DESC');

    if (posId) {
      query.andWhere('expense.posId = :posId', { posId });
    }

    if (startDate && endDate) {
      query.andWhere('expense.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['pos', 'user'],
    });
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  async remove(id: string): Promise<void> {
    const expense = await this.findOne(id);
    await this.expenseRepository.remove(expense);
  }
}
