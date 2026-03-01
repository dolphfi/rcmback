import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    try {
      this.logger.log(`Création d'un nouveau rôle: ${createRoleDto.name}`);

      const existing = await this.roleRepository.findOne({
        where: { name: createRoleDto.name },
      });
      if (existing) {
        throw new ConflictException(
          `Un rôle avec le nom "${createRoleDto.name}" existe déjà.`,
        );
      }

      const role = this.roleRepository.create(createRoleDto);
      return await this.roleRepository.save(role);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(`Erreur création rôle: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Erreur lors de la création du rôle.',
      );
    }
  }

  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Rôle avec l'ID "${id}" introuvable.`);
    }
    return role;
  }

  async findByName(name: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { name } });
    if (!role) {
      throw new NotFoundException(`Rôle avec le nom "${name}" introuvable.`);
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    const updatedRole = Object.assign(role, updateRoleDto);
    return await this.roleRepository.save(updatedRole);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await this.roleRepository.remove(role);
  }
}
