import { Column, DeleteDateColumn, Entity } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract/abstract.entity';
import { Gender } from '../../../common/enums/gender.enum';
import { UserRole } from '../../../common/enums/user-role.enum';
import { VolunteerStatus } from '../../../common/enums/volunteer-status.enum';

@Entity('users')
export class User extends AbstractEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({
    type: 'enum',
    enum: VolunteerStatus,
    default: VolunteerStatus.AVAILABLE,
  })
  status: VolunteerStatus;

  @Column({ default: 1 })
  capacity: number;

  @Column({ type: 'smallint', nullable: true })
  hall: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  availableSince: Date | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
