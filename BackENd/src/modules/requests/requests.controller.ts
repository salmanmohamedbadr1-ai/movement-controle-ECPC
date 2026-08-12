import {
  Body,
  Controller,
  Get,
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
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestResponseDto } from './dto/request-response.dto';
import { RequestsService } from './requests.service';

@ApiTags('requests')
@ApiBearerAuth('access-token')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      'Create an escort request — open to anyone, no login required; attributed to the caller if a valid token is provided',
  })
  create(
    @Body() dto: CreateRequestDto,
    @CurrentUser() creator?: AuthenticatedUser,
  ): Promise<RequestResponseDto> {
    return this.requestsService.create(dto, creator);
  }

  // --- static-segment GETs MUST be declared before ':id' below ---

  @Get('waiting')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({ summary: 'List all WAITING requests (Leader only)' })
  findWaiting(): Promise<RequestResponseDto[]> {
    return this.requestsService.findWaiting();
  }

  @Get('active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({
    summary: 'List all ASSIGNED/PICKED_UP requests (Leader only)',
  })
  findActive(): Promise<RequestResponseDto[]> {
    return this.requestsService.findActive();
  }

  @Get('completed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({ summary: 'List all COMPLETED requests (Leader only)' })
  findCompleted(): Promise<RequestResponseDto[]> {
    return this.requestsService.findCompleted();
  }

  @Get('my-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VOLUNTEER)
  @ApiOperation({
    summary:
      "List the caller's own ASSIGNED/PICKED_UP requests (Volunteer only)",
  })
  findMyActive(
    @CurrentUser() volunteer: AuthenticatedUser,
  ): Promise<RequestResponseDto[]> {
    return this.requestsService.findMyActive(volunteer.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({
    summary: 'List every request regardless of status (Leader only)',
  })
  findAll(): Promise<RequestResponseDto[]> {
    return this.requestsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a single request by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RequestResponseDto> {
    return this.requestsService.findOne(id);
  }

  @Patch(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VOLUNTEER)
  @ApiOperation({ summary: 'Self-claim a WAITING request (Volunteer only)' })
  start(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() volunteer: AuthenticatedUser,
  ): Promise<RequestResponseDto> {
    return this.requestsService.start(id, volunteer);
  }

  @Patch(':id/pickup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VOLUNTEER)
  @ApiOperation({
    summary: 'Mark an assigned request as picked up (assigned Volunteer only)',
  })
  pickup(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() volunteer: AuthenticatedUser,
  ): Promise<RequestResponseDto> {
    return this.requestsService.pickup(id, volunteer);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VOLUNTEER)
  @ApiOperation({
    summary: 'Mark a picked-up request as completed (assigned Volunteer only)',
  })
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() volunteer: AuthenticatedUser,
  ): Promise<RequestResponseDto> {
    return this.requestsService.complete(id, volunteer);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({
    summary: 'Cancel a WAITING or ASSIGNED request (Leader only)',
  })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() leader: AuthenticatedUser,
  ): Promise<RequestResponseDto> {
    return this.requestsService.cancel(id, leader);
  }
}
