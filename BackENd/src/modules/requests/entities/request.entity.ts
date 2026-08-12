import { Column, Entity, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract/abstract.entity';
import { FixtureType } from '../../../common/enums/fixture-type.enum';
import { Gender } from '../../../common/enums/gender.enum';
import { Hall } from '../../../common/enums/hall.enum';
import { RequestStatus } from '../../../common/enums/request-status.enum';
import { RequestType } from '../../../common/enums/request-type.enum';
import { User } from '../../users/entities/user.entity';

@Entity('requests')
export class Request extends AbstractEntity {
  @Column({ type: 'enum', enum: Hall })
  hall: Hall;

  @Column()
  teamNumber: number;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @ManyToOne(() => User, { nullable: true })
  volunteer: User | null;

  @Column({ type: 'uuid', nullable: true })
  volunteerId: string | null;

  @Column({ type: 'enum', enum: RequestType })
  requestType: RequestType;

  @Column({ type: 'enum', enum: FixtureType, nullable: true })
  fixtureType: FixtureType | null;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.WAITING,
  })
  status: RequestStatus;

  @Column({ default: 0 })
  priority: number;

  @Column({ type: 'timestamptz', nullable: true })
  assignedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  pickedUpAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}
