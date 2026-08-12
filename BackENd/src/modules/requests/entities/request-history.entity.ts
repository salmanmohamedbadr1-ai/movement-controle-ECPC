import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract/abstract.entity';
import { RequestStatus } from '../../../common/enums/request-status.enum';
import { User } from '../../users/entities/user.entity';
import { Request } from './request.entity';

@Entity('request_history')
export class RequestHistory extends AbstractEntity {
  @ManyToOne(() => Request, { nullable: false, onDelete: 'CASCADE' })
  request: Request;

  @Column({ type: 'uuid' })
  requestId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedBy: User | null;

  @Column({ type: 'uuid', name: 'changed_by', nullable: true })
  changedById: string | null;

  @Column({ type: 'enum', enum: RequestStatus })
  status: RequestStatus;
}
