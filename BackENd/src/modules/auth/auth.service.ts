import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(code: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { code } });
    if (!user) {
      throw new UnauthorizedException('Invalid code');
    }
    return user;
  }

  login(user: User): LoginResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      code: user.code,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: new UserResponseDto(user),
    };
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return new UserResponseDto(user);
  }
}
