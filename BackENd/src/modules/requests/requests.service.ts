import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AssignmentService } from '../assignment/assignment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestResponseDto } from './dto/request-response.dto';
import { RequestHistory } from './entities/request-history.entity';
import { Request } from './entities/request.entity';

const RELATIONS = { volunteer: true } as const;
const ACTIVE_STATUSES = [RequestStatus.ASSIGNED, RequestStatus.PICKED_UP];

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    private readonly assignmentService: AssignmentService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    dto: CreateRequestDto,
    creator?: AuthenticatedUser,
  ): Promise<RequestResponseDto> {
    const existingWaiting = await this.requestsRepository.findOne({
      where: { teamNumber: dto.teamNumber, status: RequestStatus.WAITING },
    });
    if (existingWaiting) {
      throw new ConflictException(
        `Team ${dto.teamNumber} already has a pending request.`,
      );
    }

    const requestId = await this.requestsRepository.manager.transaction(
      async (manager) => {
        const created = manager.create(Request, {
          hall: dto.hall,
          teamNumber: dto.teamNumber,
          gender: dto.gender,
          requestType: dto.requestType,
          fixtureType: dto.fixtureType ?? null,
          priority: dto.priority ?? 0,
          status: RequestStatus.WAITING,
        });
        const saved = await manager.save(created);
        await this.recordHistory(
          manager,
          saved.id,
          creator?.id ?? null,
          RequestStatus.WAITING,
        );
        return saved.id;
      },
    );

    // Attempt immediate auto-assignment (Phase 6); falls back to WAITING if
    // no eligible volunteer is free right now.
    await this.assignmentService.tryAssign(requestId);
    const created = await this.findOne(requestId);
    await this.notificationsService.notifyRequestCreated(created);
    return created;
  }

  findAll(): Promise<RequestResponseDto[]> {
    return this.findByStatuses();
  }

  findWaiting(): Promise<RequestResponseDto[]> {
    return this.findByStatuses([RequestStatus.WAITING]);
  }

  findActive(): Promise<RequestResponseDto[]> {
    return this.findByStatuses(ACTIVE_STATUSES);
  }

  findCompleted(): Promise<RequestResponseDto[]> {
    return this.findByStatuses([RequestStatus.COMPLETED]);
  }

  async findMyActive(volunteerId: string): Promise<RequestResponseDto[]> {
    const requests = await this.requestsRepository.find({
      where: { volunteerId, status: In(ACTIVE_STATUSES) },
      relations: RELATIONS,
      order: { createdAt: 'ASC' },
    });
    return requests.map((r) => new RequestResponseDto(r));
  }

  async findOne(id: string): Promise<RequestResponseDto> {
    return new RequestResponseDto(await this.findEntityOrThrow(id));
  }

  async start(
    id: string,
    volunteer: AuthenticatedUser,
  ): Promise<RequestResponseDto> {
    const result = await this.requestsRepository.manager.transaction(
      async (manager) => {
        // Lock the claiming volunteer's own row: serializes concurrent
        // self-claims BY THE SAME VOLUNTEER (e.g. a double-tap on flaky wifi
        // hitting two different WAITING requests at once) so the capacity
        // count below can't be read-then-both-pass under two overlapping
        // transactions.
        const user = await manager
          .createQueryBuilder(User, 'user')
          .setLock('pessimistic_write')
          .where('user.id = :id', { id: volunteer.id })
          .getOne();
        if (!user) {
          throw new NotFoundException('Authenticated user no longer exists');
        }

        const activeCount = await manager.count(Request, {
          where: { volunteerId: user.id, status: In(ACTIVE_STATUSES) },
        });
        if (activeCount >= user.capacity) {
          throw new ConflictException(
            'You have reached your maximum concurrent request capacity',
          );
        }

        // Atomic compare-and-swap guards against a DIFFERENT volunteer
        // claiming this SAME request at the same instant — Postgres
        // serializes concurrent UPDATEs to one row, so the losing writer's
        // WHERE predicate simply matches 0 rows once the winner commits.
        const result = await manager
          .createQueryBuilder()
          .update(Request)
          .set({
            volunteerId: user.id,
            status: RequestStatus.ASSIGNED,
            assignedAt: new Date(),
          })
          .where('id = :id AND status = :status', {
            id,
            status: RequestStatus.WAITING,
          })
          .execute();

        if (result.affected !== 1) {
          throw new ConflictException(
            'Request has already been claimed or is no longer waiting',
          );
        }

        await this.recordHistory(manager, id, user.id, RequestStatus.ASSIGNED);
        await this.assignmentService.syncVolunteerStatus(manager, user.id);

        const full = await manager.findOneOrFail(Request, {
          where: { id },
          relations: RELATIONS,
        });
        return new RequestResponseDto(full);
      },
    );

    await this.notificationsService.notifyRequestAssigned(result);
    return result;
  }

  async pickup(
    id: string,
    volunteer: AuthenticatedUser,
  ): Promise<RequestResponseDto> {
    const result = await this.transition(
      id,
      volunteer.id,
      RequestStatus.ASSIGNED,
      RequestStatus.PICKED_UP,
      (request, now) => {
        request.pickedUpAt = now;
      },
    );
    this.notificationsService.notifyRequestUpdated(result);
    return result;
  }

  async complete(
    id: string,
    volunteer: AuthenticatedUser,
  ): Promise<RequestResponseDto> {
    await this.transition(
      id,
      volunteer.id,
      RequestStatus.PICKED_UP,
      RequestStatus.COMPLETED,
      (request, now) => {
        request.completedAt = now;
      },
    );
    // Completing frees a capacity slot: re-sync this volunteer's status and
    // sweep WAITING requests in case one can now be auto-assigned. Re-fetch
    // afterward so the returned volunteer snapshot reflects the sync, not
    // the pre-sync state captured inside transition()'s own transaction.
    await this.assignmentService.resyncAndSweep(volunteer.id);
    const dto = await this.findOne(id);
    await this.notificationsService.notifyRequestCompleted(dto);
    return dto;
  }

  async cancel(
    id: string,
    leader: AuthenticatedUser,
  ): Promise<RequestResponseDto> {
    let freedVolunteerId: string | null = null;
    await this.requestsRepository.manager.transaction(async (manager) => {
      const request = await manager.findOne(Request, {
        where: { id },
        relations: RELATIONS,
      });
      if (!request) {
        throw new NotFoundException(`Request with id ${id} not found`);
      }
      const cancellable: RequestStatus[] = [
        RequestStatus.WAITING,
        RequestStatus.ASSIGNED,
      ];
      if (!cancellable.includes(request.status)) {
        throw new ConflictException(
          `Cannot cancel a request in status ${request.status}`,
        );
      }
      freedVolunteerId = request.volunteerId;
      request.status = RequestStatus.CANCELLED;
      const saved = await manager.save(request);
      await this.recordHistory(
        manager,
        saved.id,
        leader.id,
        RequestStatus.CANCELLED,
      );
    });

    if (freedVolunteerId) {
      // Cancelling an ASSIGNED request frees the volunteer's capacity slot;
      // re-fetch afterward so the returned volunteer snapshot reflects the
      // sync (mirrors the same fix applied to complete()).
      await this.assignmentService.resyncAndSweep(freedVolunteerId);
    }
    const dto = await this.findOne(id);
    await this.notificationsService.notifyRequestCancelled(dto);
    return dto;
  }

  private async transition(
    id: string,
    volunteerId: string,
    fromStatus: RequestStatus,
    toStatus: RequestStatus,
    applyTimestamp: (request: Request, now: Date) => void,
  ): Promise<RequestResponseDto> {
    return this.requestsRepository.manager.transaction(async (manager) => {
      const request = await manager.findOne(Request, {
        where: { id },
        relations: RELATIONS,
      });
      if (!request) {
        throw new NotFoundException(`Request with id ${id} not found`);
      }
      if (request.volunteerId !== volunteerId) {
        throw new ForbiddenException(
          'You are not the volunteer assigned to this request',
        );
      }
      if (request.status !== fromStatus) {
        throw new ConflictException(
          `Cannot transition a request in status ${request.status} to ${toStatus}`,
        );
      }
      request.status = toStatus;
      applyTimestamp(request, new Date());
      const saved = await manager.save(request);
      await this.recordHistory(manager, saved.id, volunteerId, toStatus);
      return new RequestResponseDto(saved);
    });
  }

  private async findByStatuses(
    statuses?: RequestStatus[],
  ): Promise<RequestResponseDto[]> {
    const requests = await this.requestsRepository.find({
      where: statuses ? { status: In(statuses) } : {},
      relations: RELATIONS,
      order: { createdAt: 'ASC' },
    });
    return requests.map((r) => new RequestResponseDto(r));
  }

  private async findEntityOrThrow(id: string): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: RELATIONS,
    });
    if (!request) {
      throw new NotFoundException(`Request with id ${id} not found`);
    }
    return request;
  }

  private async recordHistory(
    manager: EntityManager,
    requestId: string,
    changedById: string | null,
    status: RequestStatus,
  ): Promise<void> {
    await manager.insert(RequestHistory, { requestId, changedById, status });
  }
}
