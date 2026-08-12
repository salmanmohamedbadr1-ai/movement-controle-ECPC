import {
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestResponseDto } from '../requests/dto/request-response.dto';
import { AssignmentService } from './assignment.service';
import { AssignmentAttemptDto } from './dto/assignment-attempt.dto';

@ApiTags('assignment')
@ApiBearerAuth('access-token')
@Controller('assignment')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post('run')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({
    summary:
      'Sweep all WAITING requests and attempt to auto-assign each (Leader only)',
  })
  run(): Promise<AssignmentAttemptDto[]> {
    return this.assignmentService.runAssignment();
  }

  @Patch(':id/reassign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({
    summary:
      'Unassign an ASSIGNED request from its current volunteer and re-run auto-assignment for it (Leader only)',
  })
  reassign(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() leader: AuthenticatedUser,
  ): Promise<RequestResponseDto> {
    return this.assignmentService.reassign(id, leader);
  }
}
