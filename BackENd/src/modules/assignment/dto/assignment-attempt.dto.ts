import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignmentAttemptDto {
  @ApiProperty()
  requestId: string;

  @ApiProperty()
  assigned: boolean;

  @ApiPropertyOptional()
  volunteerId?: string;
}
