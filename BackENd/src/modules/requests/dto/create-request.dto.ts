import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Gender } from '../../../common/enums/gender.enum';
import { Hall } from '../../../common/enums/hall.enum';
import { RequestType } from '../../../common/enums/request-type.enum';

export class CreateRequestDto {
  @ApiProperty({ enum: Hall, example: Hall.HALL_1 })
  @IsEnum(Hall)
  hall: Hall;

  @ApiProperty({ example: 12, minimum: 1 })
  @IsInt()
  @Min(1)
  teamNumber: number;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ enum: RequestType, example: RequestType.BATHROOM })
  @IsEnum(RequestType)
  requestType: RequestType;

  @ApiPropertyOptional({ example: 0, minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
