import { ApiProperty } from '@nestjs/swagger';
import { Hall } from '../../../common/enums/hall.enum';

export class RequestCountsDto {
  @ApiProperty() waiting: number;
  @ApiProperty() assigned: number;
  @ApiProperty() pickedUp: number;
  @ApiProperty() completed: number;
  @ApiProperty() cancelled: number;
  @ApiProperty() total: number;
}

export class VolunteerCountsDto {
  @ApiProperty() available: number;
  @ApiProperty() busy: number;
  @ApiProperty() offline: number;
  @ApiProperty() total: number;
}

export class HallBreakdownDto {
  @ApiProperty({ enum: Hall }) hall: Hall;
  @ApiProperty() waitingCount: number;
  @ApiProperty() activeCount: number;
}

export class DashboardOverviewDto {
  @ApiProperty({ type: RequestCountsDto }) requests: RequestCountsDto;
  @ApiProperty({ type: VolunteerCountsDto }) volunteers: VolunteerCountsDto;
  @ApiProperty({ type: [HallBreakdownDto] }) perHall: HallBreakdownDto[];
}
