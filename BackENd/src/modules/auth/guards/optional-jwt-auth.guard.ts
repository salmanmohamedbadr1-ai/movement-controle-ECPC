import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Never throws — a missing or invalid token just means "anonymous caller",
  // it does not block the request the way the regular JwtAuthGuard would.
  // The signature matches Passport's own `IAuthGuard.handleRequest<TUser>`.
  handleRequest<TUser = AuthenticatedUser | null>(
    _err: unknown,
    user: TUser,
  ): TUser {
    return user;
  }
}
