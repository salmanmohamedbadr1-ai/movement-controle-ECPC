import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hall } from '../../common/enums/hall.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';
import { Request } from '../requests/entities/request.entity';
import { User } from '../users/entities/user.entity';
import {
  DashboardOverviewDto,
  HallBreakdownDto,
  RequestCountsDto,
  VolunteerCountsDto,
} from './dto/dashboard-overview.dto';

const ACTIVE_STATUSES = [RequestStatus.ASSIGNED, RequestStatus.PICKED_UP];

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
  ) {}

  async getOverview(): Promise<DashboardOverviewDto> {
    const requests = await this.requestsRepository.find();
    const volunteers = await this.requestsRepository.manager.find(User, {
      where: { role: UserRole.VOLUNTEER },
    });

    const requestCounts: RequestCountsDto = {
      waiting: 0,
      assigned: 0,
      pickedUp: 0,
      completed: 0,
      cancelled: 0,
      total: requests.length,
    };

    const perHallStats = new Map<
      Hall,
      { waitingCount: number; activeCount: number }
    >();
    for (const hall of Object.values(Hall)) {
      perHallStats.set(hall, { waitingCount: 0, activeCount: 0 });
    }

    for (const request of requests) {
      switch (request.status) {
        case RequestStatus.WAITING:
          requestCounts.waiting++;
          break;
        case RequestStatus.ASSIGNED:
          requestCounts.assigned++;
          break;
        case RequestStatus.PICKED_UP:
          requestCounts.pickedUp++;
          break;
        case RequestStatus.COMPLETED:
          requestCounts.completed++;
          break;
        case RequestStatus.CANCELLED:
          requestCounts.cancelled++;
          break;
      }

      const hallStats = perHallStats.get(request.hall);
      if (hallStats) {
        if (request.status === RequestStatus.WAITING) {
          hallStats.waitingCount++;
        } else if (ACTIVE_STATUSES.includes(request.status)) {
          hallStats.activeCount++;
        }
      }
    }

    const volunteerCounts: VolunteerCountsDto = {
      available: 0,
      busy: 0,
      offline: 0,
      total: volunteers.length,
    };
    for (const volunteer of volunteers) {
      switch (volunteer.status) {
        case VolunteerStatus.AVAILABLE:
          volunteerCounts.available++;
          break;
        case VolunteerStatus.BUSY:
          volunteerCounts.busy++;
          break;
        case VolunteerStatus.OFFLINE:
          volunteerCounts.offline++;
          break;
      }
    }

    const perHall: HallBreakdownDto[] = Array.from(perHallStats.entries()).map(
      ([hall, stats]) => ({
        hall,
        waitingCount: stats.waitingCount,
        activeCount: stats.activeCount,
      }),
    );

    return {
      requests: requestCounts,
      volunteers: volunteerCounts,
      perHall,
    };
  }
}
