import { UserRole } from '../enums/user-role.enum';

export interface AuthenticatedUser {
  id: string;
  code: string;
  role: UserRole;
}
