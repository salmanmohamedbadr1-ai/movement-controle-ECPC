import { Injectable } from '@nestjs/common';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { hallToNumber } from '../../common/utils/hall.util';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestResponseDto } from '../requests/dto/request-response.dto';
import { RequestHistory } from '../requests/entities/request-history.entity';
import { Request } from '../requests/entities/request.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { AssignmentAttemptDto } from './dto/assignment-attempt.dto';

const ACTIVE_STATUSES = [RequestStatus.ASSIGNED, RequestStatus.PICKED_UP];
const RELATIONS = { volunteer: true } as const;

interface ScoredCandidate {
  user: User;
  hallMatch: boolean;
  distance: number;
  availableSince: number;
}

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async runAssignment(): Promise<AssignmentAttemptDto[]> {
    const waiting = await this.requestsRepository.find({
      where: { status: RequestStatus.WAITING },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });

    const results: AssignmentAttemptDto[] = [];
    for (const request of waiting) {
      results.push(await this.tryAssign(request.id));
    }
    return results;
  }

  async tryAssign(requestId: string): Promise<AssignmentAttemptDto> {
    const result = await this.requestsRepository.manager.transaction(
      async (manager) => {
        const request = await manager.findOne(Request, {
          where: { id: requestId },
        });
        if (!request || request.status !== RequestStatus.WAITING) {
          return { requestId, assigned: false };
        }

        const candidate = await this.findBestCandidate(manager, request);
        if (!candidate) {
          return { requestId, assigned: false };
        }

        const claimed = await this.claimForVolunteer(
          manager,
          requestId,
          candidate.id,
        );
        return claimed
          ? { requestId, assigned: true, volunteerId: candidate.id }
          : { requestId, assigned: false };
      },
    );

    if (result.assigned) {
      const dto = await this.toResponseDto(requestId);
      await this.notificationsService.notifyRequestAssigned(dto);
    }
    return result;
  }

  async reassign(
    requestId: string,
    leader: AuthenticatedUser,
  ): Promise<RequestResponseDto> {
    let oldVolunteerId = '';
    await this.requestsRepository.manager.transaction(async (manager) => {
      const request = await manager.findOne(Request, {
        where: { id: requestId },
      });
      if (!request) {
        throw new NotFoundException(`Request with id ${requestId} not found`);
      }
      if (request.status !== RequestStatus.ASSIGNED) {
        throw new ConflictException(
          `Only an ASSIGNED request can be reassigned (current status: ${request.status})`,
        );
      }

      oldVolunteerId = request.volunteerId as string;
      await manager.update(Request, requestId, {
        volunteerId: null,
        status: RequestStatus.WAITING,
        assignedAt: null,
      });
      await manager.insert(RequestHistory, {
        requestId,
        changedById: leader.id,
        status: RequestStatus.WAITING,
      });
      await this.syncVolunteerStatus(manager, oldVolunteerId);
    });

    const unassignedDto = await this.toResponseDto(requestId);
    await this.notificationsService.notifyRequestUnassigned(
      unassignedDto,
      oldVolunteerId,
    );

    await this.tryAssign(requestId);
    return this.toResponseDto(requestId);
  }

  async reassignAllForVolunteer(volunteerId: string): Promise<void> {
    const assigned = await this.requestsRepository.find({
      where: { volunteerId, status: RequestStatus.ASSIGNED },
    });

    for (const request of assigned) {
      await this.requestsRepository.manager.transaction(async (manager) => {
        await manager.update(Request, request.id, {
          volunteerId: null,
          status: RequestStatus.WAITING,
          assignedAt: null,
        });
        await manager.insert(RequestHistory, {
          requestId: request.id,
          changedById: volunteerId,
          status: RequestStatus.WAITING,
        });
      });
      const unassignedDto = await this.toResponseDto(request.id);
      await this.notificationsService.notifyRequestUnassigned(
        unassignedDto,
        volunteerId,
      );
      await this.tryAssign(request.id);
    }
  }

  async resyncAndSweep(volunteerId: string): Promise<void> {
    await this.requestsRepository.manager.transaction(async (manager) => {
      await this.syncVolunteerStatus(manager, volunteerId);
    });
    await this.runAssignment();
  }

  async syncVolunteerStatus(
    manager: EntityManager,
    volunteerId: string,
  ): Promise<void> {
    const user = await manager.findOne(User, { where: { id: volunteerId } });
    if (!user || user.status === VolunteerStatus.OFFLINE) {
      return;
    }

    const activeCount = await manager.count(Request, {
      where: { volunteerId, status: In(ACTIVE_STATUSES) },
    });

    if (activeCount >= user.capacity && user.status !== VolunteerStatus.BUSY) {
      await manager.update(User, volunteerId, {
        status: VolunteerStatus.BUSY,
      });
      user.status = VolunteerStatus.BUSY;
      this.notificationsService.notifyVolunteerStatusChanged(
        new UserResponseDto(user),
      );
    } else if (
      activeCount < user.capacity &&
      user.status === VolunteerStatus.BUSY
    ) {
      const availableSince = new Date();
      await manager.update(User, volunteerId, {
        status: VolunteerStatus.AVAILABLE,
        availableSince,
      });
      user.status = VolunteerStatus.AVAILABLE;
      user.availableSince = availableSince;
      this.notificationsService.notifyVolunteerStatusChanged(
        new UserResponseDto(user),
      );
    }
  }

  private async findBestCandidate(
    manager: EntityManager,
    request: Request,
  ): Promise<User | null> {
    const candidates = await manager.find(User, {
      where: {
        role: UserRole.VOLUNTEER,
        status: VolunteerStatus.AVAILABLE,
        hall: hallToNumber[request.hall],
        gender: request.gender,
      },
    });
    if (candidates.length === 0) {
      return null;
    }

    const candidateIds = candidates.map((c) => c.id);
    const activeRequests = await manager.find(Request, {
      where: { volunteerId: In(candidateIds), status: In(ACTIVE_STATUSES) },
    });

    const activeByVolunteer = new Map<string, Request[]>();
    for (const active of activeRequests) {
      const key = active.volunteerId as string;
      const list = activeByVolunteer.get(key) ?? [];
      list.push(active);
      activeByVolunteer.set(key, list);
    }

    const scored: ScoredCandidate[] = [];
    for (const user of candidates) {
      const active = activeByVolunteer.get(user.id) ?? [];
      if (active.length >= user.capacity) {
        continue;
      }

      const sameHall = active.filter((r) => r.hall === request.hall);
      const hallMatch = sameHall.length > 0;
      const distance = hallMatch
        ? Math.min(
            ...sameHall.map((r) => Math.abs(r.teamNumber - request.teamNumber)),
          )
        : Number.POSITIVE_INFINITY;

      scored.push({
        user,
        hallMatch,
        distance,
        availableSince: (user.availableSince ?? user.createdAt).getTime(),
      });
    }

    if (scored.length === 0) {
      return null;
    }

    scored.sort((a, b) => {
      if (a.hallMatch !== b.hallMatch) {
        return a.hallMatch ? -1 : 1;
      }
      if (a.hallMatch && b.hallMatch && a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return a.availableSince - b.availableSince;
    });

    return scored[0].user;
  }

  private async claimForVolunteer(
    manager: EntityManager,
    requestId: string,
    candidateId: string,
  ): Promise<boolean> {
    const user = await manager
      .createQueryBuilder(User, 'user')
      .setLock('pessimistic_write')
      .where('user.id = :id', { id: candidateId })
      .getOne();
    if (!user || user.status !== VolunteerStatus.AVAILABLE) {
      return false;
    }

    const activeCount = await manager.count(Request, {
      where: { volunteerId: user.id, status: In(ACTIVE_STATUSES) },
    });
    if (activeCount >= user.capacity) {
      return false;
    }

    const result = await manager
      .createQueryBuilder()
      .update(Request)
      .set({
        volunteerId: user.id,
        status: RequestStatus.ASSIGNED,
        assignedAt: new Date(),
      })
      .where('id = :id AND status = :status', {
        id: requestId,
        status: RequestStatus.WAITING,
      })
      .execute();
    if (result.affected !== 1) {
      return false;
    }

    await manager.insert(RequestHistory, {
      requestId,
      changedById: user.id,
      status: RequestStatus.ASSIGNED,
    });
    await this.syncVolunteerStatus(manager, user.id);
    return true;
  }

  private async toResponseDto(requestId: string): Promise<RequestResponseDto> {
    const request = await this.requestsRepository.findOneOrFail({
      where: { id: requestId },
      relations: RELATIONS,
    });
    return new RequestResponseDto(request);
  }
}
