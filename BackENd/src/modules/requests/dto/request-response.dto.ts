import { ApiProperty } from '@nestjs/swagger';
import { FixtureType } from '../../../common/enums/fixture-type.enum';
import { Gender } from '../../../common/enums/gender.enum';
import { Hall } from '../../../common/enums/hall.enum';
import { RequestStatus } from '../../../common/enums/request-status.enum';
import { RequestType } from '../../../common/enums/request-type.enum';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { Request } from '../entities/request.entity';

export class RequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: Hall })
  hall: Hall;

  @ApiProperty()
  teamNumber: number;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiProperty({ type: UserResponseDto, nullable: true })
  volunteer: UserResponseDto | null;

  @ApiProperty({ enum: RequestType })
  requestType: RequestType;

  @ApiProperty({ enum: FixtureType, nullable: true })
  fixtureType: FixtureType | null;

  @ApiProperty({ enum: RequestStatus })
  status: RequestStatus;

  @ApiProperty()
  priority: number;

  @ApiProperty({ nullable: true })
  assignedAt: Date | null;

  @ApiProperty({ nullable: true })
  pickedUpAt: Date | null;

  @ApiProperty({ nullable: true })
  completedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(request: Request) {
    this.id = request.id;
    this.hall = request.hall;
    this.teamNumber = request.teamNumber;
    this.gender = request.gender;
    this.volunteer = request.volunteer
      ? new UserResponseDto(request.volunteer)
      : null;
    this.requestType = request.requestType;
    this.fixtureType = request.fixtureType;
    this.status = request.status;
    this.priority = request.priority;
    this.assignedAt = request.assignedAt;
    this.pickedUpAt = request.pickedUpAt;
    this.completedAt = request.completedAt;
    this.createdAt = request.createdAt;
    this.updatedAt = request.updatedAt;
  }
}
