import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { Notification } from '../entities/notification.entity';

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  message: string;

  @ApiProperty({ nullable: true })
  requestId: string | null;

  @ApiProperty()
  read: boolean;

  @ApiProperty({ nullable: true })
  readAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  constructor(notification: Notification) {
    this.id = notification.id;
    this.type = notification.type;
    this.message = notification.message;
    this.requestId = notification.requestId;
    this.read = notification.read;
    this.readAt = notification.readAt;
    this.createdAt = notification.createdAt;
  }
}
