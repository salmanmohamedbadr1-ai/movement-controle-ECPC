import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Gender } from '../../../common/enums/gender.enum';
import { UserRole } from '../../../common/enums/user-role.enum';

export class BulkCreateUserItemDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;
}

export class BulkCreateUsersDto {
  @ApiProperty({ enum: UserRole, example: UserRole.VOLUNTEER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: 1, minimum: 1, maximum: 4 })
  @IsInt()
  @Min(1)
  @Max(4)
  hall: number;

  @ApiProperty({ type: [BulkCreateUserItemDto] })
  @ValidateNested({ each: true })
  @Type(() => BulkCreateUserItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  users: BulkCreateUserItemDto[];
}
