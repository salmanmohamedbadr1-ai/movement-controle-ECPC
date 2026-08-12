import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCapacityDto {
  @ApiProperty({ example: 3, minimum: 0 })
  @IsInt()
  @Min(0)
  capacity: number;
}
