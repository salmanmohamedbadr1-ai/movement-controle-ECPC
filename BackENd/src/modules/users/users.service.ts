import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import PDFDocument from 'pdfkit';
import { In, QueryFailedError, Repository } from 'typeorm';
import { formatHallGroupLabel, getHallGroup } from '../../common/utils/hall-group.util';
import { Gender } from '../../common/enums/gender.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AssignmentService } from '../assignment/assignment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BulkCreateUsersDto } from './dto/bulk-create-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateCapacityDto } from './dto/update-capacity.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

const CODE_LENGTH = 4;
const CODE_GENERATION_MAX_ATTEMPTS = 5;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly assignmentService: AssignmentService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const saved = await this.saveWithUniqueCode({
      name: dto.name,
      role: dto.role,
      hall: dto.hall,
      gender: dto.gender,
    });
    return new UserResponseDto(saved);
  }

  async createBulk(dto: BulkCreateUsersDto): Promise<UserResponseDto[]> {
    const results: UserResponseDto[] = [];
    for (const item of dto.users) {
      const saved = await this.saveWithUniqueCode({
        name: item.name,
        role: dto.role,
        hall: dto.hall,
        gender: item.gender,
      });
      results.push(new UserResponseDto(saved));
    }
    return results;
  }

  async findAll(query: FindUsersQueryDto): Promise<UserResponseDto[]> {
    const where: Partial<Pick<User, 'role' | 'status' | 'gender'>> = {};
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.gender) where.gender = query.gender;

    const users = await this.usersRepository.find({
      where,
      order: { createdAt: 'ASC' },
    });
    return users.map((user) => new UserResponseDto(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.findEntityOrThrow(id);
    return new UserResponseDto(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findEntityOrThrow(id);
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.hall !== undefined) user.hall = dto.hall;
    if (dto.gender !== undefined) user.gender = dto.gender;
    const saved = await this.usersRepository.save(user);
    return new UserResponseDto(saved);
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    requester: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    if (requester.role !== UserRole.LEADER && requester.id !== id) {
      throw new ForbiddenException('You can only update your own status');
    }
    const user = await this.findEntityOrThrow(id);
    user.status = dto.status;
    if (dto.status === VolunteerStatus.AVAILABLE) {
      user.availableSince = new Date();
    }
    const saved = await this.usersRepository.save(user);

    if (dto.status === VolunteerStatus.OFFLINE) {
      await this.assignmentService.reassignAllForVolunteer(id);
    } else if (dto.status === VolunteerStatus.AVAILABLE) {
      await this.assignmentService.resyncAndSweep(id);
    }

    // Re-fetch: resyncAndSweep/reassignAllForVolunteer may have flipped the
    // status again (e.g. still-active requests immediately marking them
    // BUSY) — using the stale `saved` snapshot here would emit/return a
    // status that's already wrong.
    const result = new UserResponseDto(await this.findEntityOrThrow(id));
    this.notificationsService.notifyVolunteerStatusChanged(result);
    return result;
  }

  async updateCapacity(
    id: string,
    dto: UpdateCapacityDto,
  ): Promise<UserResponseDto> {
    const user = await this.findEntityOrThrow(id);
    user.capacity = dto.capacity;
    await this.usersRepository.save(user);
    await this.assignmentService.resyncAndSweep(id);

    const result = new UserResponseDto(await this.findEntityOrThrow(id));
    this.notificationsService.notifyVolunteerStatusChanged(result);
    return result;
  }

  async exportHallPdf(hall: number): Promise<Buffer> {
    const users = await this.usersRepository.find({
      where: { hall: In(getHallGroup(hall)) },
      order: { name: 'ASC' },
    });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    doc.fontSize(18).text(`${formatHallGroupLabel(hall)} — Volunteer Codes`, { align: 'center' });
    doc.moveDown(1.5);

    for (const user of users) {
      doc.fontSize(12).text(`${user.name}  —  ${user.code}`);
      doc.moveDown(0.5);
    }
    if (users.length === 0) {
      doc.fontSize(12).text('No users in this hall yet.');
    }

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  async remove(id: string): Promise<null> {
    await this.findEntityOrThrow(id);
    await this.usersRepository.softDelete(id);
    return null;
  }

  private async findEntityOrThrow(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  private async saveWithUniqueCode(data: {
    name: string;
    role: UserRole;
    hall: number;
    gender: Gender;
  }): Promise<User> {
    for (let attempt = 1; attempt <= CODE_GENERATION_MAX_ATTEMPTS; attempt++) {
      const user = this.usersRepository.create({
        code: this.randomCode(),
        name: data.name,
        role: data.role,
        hall: data.hall,
        gender: data.gender,
      });

      try {
        return await this.usersRepository.save(user);
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          continue;
        }
        throw error;
      }
    }

    throw new InternalServerErrorException(
      'Failed to generate a unique user code, please try again',
    );
  }

  private randomCode(): string {
    const max = 10 ** CODE_LENGTH;
    return String(randomInt(0, max)).padStart(CODE_LENGTH, '0');
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as unknown as { code?: string }).code === '23505'
    );
  }
}
