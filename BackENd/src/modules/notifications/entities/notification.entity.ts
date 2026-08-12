import { Column, Entity, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract/abstract.entity';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { Request } from '../../requests/entities/request.entity';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification extends AbstractEntity {
  @ManyToOne(() => User, { nullable: false })
  recipient: User;

  @Column({ type: 'uuid' })
  recipientId: string;

  @ManyToOne(() => Request, { nullable: true, onDelete: 'SET NULL' })
  request: Request | null;

  @Column({ type: 'uuid', nullable: true })
  requestId: string | null;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  message: string;

  @Column({ default: false })
  read: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;
}
