import { Gender } from '../../common/enums/gender.enum';
import { Hall } from '../../common/enums/hall.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { RequestType } from '../../common/enums/request-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';
import { RequestHistory } from '../requests/entities/request-history.entity';
import { Request } from '../requests/entities/request.entity';
import { User } from '../users/entities/user.entity';
import { AssignmentService } from './assignment.service';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'volunteer-1',
    code: 'V1',
    name: 'Volunteer',
    role: UserRole.VOLUNTEER,
    gender: Gender.MALE,
    status: VolunteerStatus.AVAILABLE,
    capacity: 1,
    hall: 1,
    availableSince: null,
    deletedAt: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  } as User;
}

function makeRequest(overrides: Partial<Request> = {}): Request {
  return {
    id: 'request-1',
    hall: Hall.HALL_2,
    teamNumber: 100,
    gender: Gender.MALE,
    volunteer: null,
    volunteerId: null,
    requestType: RequestType.BATHROOM,
    fixtureType: null,
    status: RequestStatus.WAITING,
    priority: 0,
    assignedAt: null,
    pickedUpAt: null,
    completedAt: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  } as Request;
}

/** Builds a mock EntityManager that answers `find`/`findOne`/`count` by entity class name. */
function makeManager(options: {
  users: User[];
  activeRequestsByVolunteer: Map<string, Request[]>;
  requestToAssign: Request;
  activeCountAfterAssignment: number;
}) {
  const { users, activeRequestsByVolunteer, requestToAssign } = options;

  const findOne = jest.fn(async (entity: any, opts: any) => {
    if (entity === Request) {
      return requestToAssign.id === opts.where.id ? requestToAssign : null;
    }
    if (entity === User) {
      return users.find((u) => u.id === opts.where.id) ?? null;
    }
    return null;
  });

  const find = jest.fn(async (entity: any, opts: any) => {
    if (entity === User) {
      const hallList: number[] = opts.where.hall.value ?? opts.where.hall;
      return users.filter(
        (u) =>
          u.role === opts.where.role &&
          u.status === opts.where.status &&
          u.gender === opts.where.gender &&
          hallList.includes(u.hall as number),
      );
    }
    if (entity === Request) {
      const ids: string[] = opts.where.volunteerId.value ?? [];
      const all: Request[] = [];
      for (const id of ids) {
        all.push(...(activeRequestsByVolunteer.get(id) ?? []));
      }
      return all;
    }
    return [];
  });

  const count = jest
    .fn()
    .mockResolvedValueOnce(0)
    .mockResolvedValue(options.activeCountAfterAssignment);

  const update = jest.fn().mockResolvedValue({ affected: 1 });
  const insert = jest.fn().mockResolvedValue({});

  const qbUser = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(async () => users.find((u) => u.id === requestToAssign.volunteerId) ?? users[0]),
  };
  const qbUpdate = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const createQueryBuilder = jest.fn((entity?: any) => {
    if (entity === User) return qbUser;
    return qbUpdate;
  });

  return {
    findOne,
    find,
    count,
    update,
    insert,
    createQueryBuilder,
  } as any;
}

describe('AssignmentService.findBestCandidate (via tryAssign)', () => {
  function buildService(manager: any, request: Request) {
    const requestsRepository = {
      manager: { transaction: jest.fn((cb: any) => cb(manager)) },
      findOneOrFail: jest.fn().mockResolvedValue(request),
      find: jest.fn(),
    };
    const notificationsService = {
      notifyRequestAssigned: jest.fn(),
      notifyVolunteerStatusChanged: jest.fn(),
    };
    return new AssignmentService(
      requestsRepository as any,
      notificationsService as any,
    );
  }

  it('assigns a hall-1 volunteer to a hall-2 request (same group)', async () => {
    const volunteer = makeUser({ id: 'v-hall-1', hall: 1 });
    const request = makeRequest({ hall: Hall.HALL_2, volunteerId: 'v-hall-1' });
    const manager = makeManager({
      users: [volunteer],
      activeRequestsByVolunteer: new Map(),
      requestToAssign: request,
      activeCountAfterAssignment: 1,
    });
    const service = buildService(manager, request);

    const result = await service.tryAssign(request.id);

    expect(result.assigned).toBe(true);
    expect(result.volunteerId).toBe('v-hall-1');
  });

  it('does not assign a hall-4 volunteer to a hall-3 request (different group)', async () => {
    const volunteer = makeUser({ id: 'v-hall-4', hall: 4 });
    const request = makeRequest({ hall: Hall.HALL_3 });
    const manager = makeManager({
      users: [volunteer],
      activeRequestsByVolunteer: new Map(),
      requestToAssign: request,
      activeCountAfterAssignment: 0,
    });
    const service = buildService(manager, request);

    const result = await service.tryAssign(request.id);

    expect(result.assigned).toBe(false);
  });
});
