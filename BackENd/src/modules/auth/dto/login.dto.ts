import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '0492' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
