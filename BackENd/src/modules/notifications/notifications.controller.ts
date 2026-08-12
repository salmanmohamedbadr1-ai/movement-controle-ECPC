import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FindNotificationsQueryDto } from './dto/find-notifications-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List the caller's own notifications" })
  findMine(
    @Query() query: FindNotificationsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.findMine(user.id, query.unreadOnly);
  }

  // Declared before ':id/read' — a static segment must be matched first.
  @Patch('read-all')
  @ApiOperation({ summary: "Mark all of the caller's notifications as read" })
  async markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<null> {
    await this.notificationsService.markAllRead(user.id);
    return null;
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read (owner only)' })
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markRead(id, user.id);
  }
}
