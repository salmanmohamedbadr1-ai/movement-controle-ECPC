import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { EventsGateway } from '../events/events.gateway';
import { RequestResponseDto } from '../requests/dto/request-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async notifyRequestCreated(dto: RequestResponseDto): Promise<void> {
    this.eventsGateway.emitRequestCreated(dto);
    await this.notifyLeaders(
      NotificationType.REQUEST_CREATED,
      `New ${dto.requestType} request for Team ${dto.teamNumber} (${dto.hall})`,
      dto.id,
    );
  }

  async notifyRequestAssigned(dto: RequestResponseDto): Promise<void> {
    if (!dto.volunteer) {
      return;
    }
    this.eventsGateway.emitRequestAssigned(dto);
    await this.createAndPush(
      dto.volunteer.id,
      NotificationType.REQUEST_ASSIGNED,
      `You have been assigned a ${dto.requestType} request for Team ${dto.teamNumber} (${dto.hall})`,
      dto.id,
    );
  }

  async notifyRequestUnassigned(
    dto: RequestResponseDto,
    previousVolunteerId: string,
  ): Promise<void> {
    this.eventsGateway.emitRequestUnassigned(dto, previousVolunteerId);
    await this.createAndPush(
      previousVolunteerId,
      NotificationType.REQUEST_UNASSIGNED,
      `You are no longer assigned to the ${dto.requestType} request for Team ${dto.teamNumber} (${dto.hall})`,
      dto.id,
    );
  }

  async notifyRequestCompleted(dto: RequestResponseDto): Promise<void> {
    this.eventsGateway.emitRequestUpdated(dto);
    await this.notifyLeaders(
      NotificationType.REQUEST_COMPLETED,
      `${dto.requestType} request for Team ${dto.teamNumber} (${dto.hall}) was completed`,
      dto.id,
    );
  }

  async notifyRequestCancelled(dto: RequestResponseDto): Promise<void> {
    this.eventsGateway.emitRequestUpdated(dto);
    await this.notifyLeaders(
      NotificationType.REQUEST_CANCELLED,
      `${dto.requestType} request for Team ${dto.teamNumber} (${dto.hall}) was cancelled`,
      dto.id,
    );
  }

  // Live-sync only — not part of the persisted "core lifecycle set".
  notifyRequestUpdated(dto: RequestResponseDto): void {
    this.eventsGateway.emitRequestUpdated(dto);
  }

  // Live-sync only — not part of the persisted "core lifecycle set".
  notifyVolunteerStatusChanged(dto: UserResponseDto): void {
    this.eventsGateway.emitVolunteerStatusChanged(dto);
  }

  async findMine(
    userId: string,
    unreadOnly?: boolean,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationsRepository.find({
      where: unreadOnly
        ? { recipientId: userId, read: false }
        : { recipientId: userId },
      order: { createdAt: 'DESC' },
    });
    return notifications.map((n) => new NotificationResponseDto(n));
  }

  async markRead(id: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationsRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    if (notification.recipientId !== userId) {
      throw new ForbiddenException(
        'You can only mark your own notifications as read',
      );
    }
    notification.read = true;
    notification.readAt = new Date();
    const saved = await this.notificationsRepository.save(notification);
    return new NotificationResponseDto(saved);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { recipientId: userId, read: false },
      { read: true, readAt: new Date() },
    );
  }

  private async notifyLeaders(
    type: NotificationType,
    message: string,
    requestId: string,
  ): Promise<void> {
    const leaders = await this.notificationsRepository.manager.find(User, {
      where: { role: UserRole.LEADER },
    });
    for (const leader of leaders) {
      await this.createAndPush(leader.id, type, message, requestId);
    }
  }

  private async createAndPush(
    recipientId: string,
    type: NotificationType,
    message: string,
    requestId: string,
  ): Promise<void> {
    const created = this.notificationsRepository.create({
      recipientId,
      type,
      message,
      requestId,
    });
    const saved = await this.notificationsRepository.save(created);
    this.eventsGateway.emitNotification(
      recipientId,
      new NotificationResponseDto(saved),
    );
  }
}
