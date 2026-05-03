import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateExpenseDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNotEmpty()
  @IsUUID()
  posId: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}
