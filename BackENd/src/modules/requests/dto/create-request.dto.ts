import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min, ValidateIf } from 'class-validator';
import { FixtureType } from '../../../common/enums/fixture-type.enum';
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

  @ApiPropertyOptional({
    enum: FixtureType,
    example: FixtureType.URINAL,
    description: 'Required when gender is MALE and requestType is BATHROOM',
  })
  @ValidateIf(
    (o: CreateRequestDto) =>
      o.gender === Gender.MALE && o.requestType === RequestType.BATHROOM,
  )
  @IsEnum(FixtureType)
  fixtureType?: FixtureType;

  @ApiPropertyOptional({ example: 0, minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
