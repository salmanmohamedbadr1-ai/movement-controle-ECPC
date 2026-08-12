import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { BulkCreateUsersDto } from './dto/bulk-create-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ExportUsersPdfQueryDto } from './dto/export-users-pdf-query.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateCapacityDto } from './dto/update-capacity.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({
    summary:
      'Create a user; the server auto-generates the login code (Leader only)',
  })
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({
    summary:
      'Create multiple users in one hall at once; each gets an auto-generated login code (Leader only)',
  })
  createBulk(@Body() dto: BulkCreateUsersDto): Promise<UserResponseDto[]> {
    return this.usersService.createBulk(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({
    summary: 'List users, optionally filtered by role/status (Leader only)',
  })
  findAll(@Query() query: FindUsersQueryDto): Promise<UserResponseDto[]> {
    return this.usersService.findAll(query);
  }

  @Get('export/pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({
    summary: 'Download a PDF of names + login codes for one hall (Leader only)',
  })
  async exportPdf(
    @Query() query: ExportUsersPdfQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdf = await this.usersService.exportHallPdf(query.hall);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="hall-${query.hall}-users.pdf"`,
    });
    res.send(pdf);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({ summary: 'Get a single user by id (Leader only)' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({ summary: "Update a user's name/role (Leader only)" })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Update volunteer status (a Leader may update any user; a Volunteer may update only their own status)',
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return this.usersService.updateStatus(id, dto, user);
  }

  @Patch(':id/capacity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({
    summary: "Update a volunteer's escort capacity (Leader only)",
  })
  updateCapacity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCapacityDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateCapacity(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  @ApiOperation({ summary: 'Delete a user (Leader only)' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<null> {
    return this.usersService.remove(id);
  }
}
