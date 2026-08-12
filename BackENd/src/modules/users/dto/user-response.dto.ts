import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../../common/enums/gender.enum';
import { UserRole } from '../../../common/enums/user-role.enum';
import { VolunteerStatus } from '../../../common/enums/volunteer-status.enum';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiProperty({ enum: VolunteerStatus })
  status: VolunteerStatus;

  @ApiProperty()
  capacity: number;

  @ApiProperty({ nullable: true })
  hall: number | null;

  @ApiProperty({ nullable: true })
  availableSince: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.code = user.code;
    this.name = user.name;
    this.role = user.role;
    this.gender = user.gender;
    this.status = user.status;
    this.capacity = user.capacity;
    this.hall = user.hall;
    this.availableSince = user.availableSince;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
