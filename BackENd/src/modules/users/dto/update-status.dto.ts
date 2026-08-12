import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { VolunteerStatus } from '../../../common/enums/volunteer-status.enum';

export class UpdateStatusDto {
  @ApiProperty({ enum: VolunteerStatus })
  @IsEnum(VolunteerStatus)
  status: VolunteerStatus;
}
