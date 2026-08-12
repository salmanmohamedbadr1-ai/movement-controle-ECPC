import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { RequestResponseDto } from '../requests/dto/request-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { NotificationResponseDto } from '../notifications/dto/notification-response.dto';

const LEADERS_ROOM = 'leaders';
const volunteerRoom = (id: string) => `volunteer:${id}`;
// Every connected user (either role) joins their own personal room too —
// "notification" is inherently a per-recipient object (one DB row per
// recipient, with its own id/read-state), so it must always be delivered
// point-to-point here, never via the shared LEADERS_ROOM broadcast. Routing
// it through LEADERS_ROOM was the bug: with N leader accounts, notifyLeaders()
// creates one row per leader and each push fanned out to every connected
// leader via the shared room, so everyone saw N copies instead of their own 1.
const personalRoom = (id: string) => `user:${id}`;

type AuthenticatedSocket = Omit<Socket, 'data'> & {
  data: { user: AuthenticatedUser };
};

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN ?? '*', credentials: true },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        throw new Error('missing token');
      }
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      (client as AuthenticatedSocket).data.user = {
        id: payload.sub,
        code: payload.code,
        role: payload.role,
      };
      await client.join(
        payload.role === UserRole.LEADER
          ? LEADERS_ROOM
          : volunteerRoom(payload.sub),
      );
      await client.join(personalRoom(payload.sub));
      this.logger.log(`Client connected: ${payload.code} (${payload.role})`);
    } catch {
      this.logger.warn(`Rejected socket connection: ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(): void {
    // Rooms are cleaned up automatically by socket.io on disconnect.
  }

  emitRequestCreated(dto: RequestResponseDto): void {
    this.emit(LEADERS_ROOM, 'request.created', dto);
  }

  emitRequestAssigned(dto: RequestResponseDto): void {
    this.emit(LEADERS_ROOM, 'request.assigned', dto);
    if (dto.volunteer) {
      this.emit(volunteerRoom(dto.volunteer.id), 'request.assigned', dto);
    }
  }

  emitRequestUnassigned(
    dto: RequestResponseDto,
    previousVolunteerId: string,
  ): void {
    this.emit(LEADERS_ROOM, 'request.unassigned', dto);
    this.emit(volunteerRoom(previousVolunteerId), 'request.unassigned', dto);
  }

  emitRequestUpdated(dto: RequestResponseDto): void {
    this.emit(LEADERS_ROOM, 'request.updated', dto);
    if (dto.volunteer) {
      this.emit(volunteerRoom(dto.volunteer.id), 'request.updated', dto);
    }
  }

  emitVolunteerStatusChanged(dto: UserResponseDto): void {
    this.emit(LEADERS_ROOM, 'volunteer.status', dto);
  }

  emitNotification(
    recipientId: string,
    notification: NotificationResponseDto,
  ): void {
    this.emit(personalRoom(recipientId), 'notification', notification);
  }

  // The socket.io server only exists once this gateway has been bootstrapped
  // as part of a running HTTP application (`app.listen()`/`app.init()`).
  // Application-context-only bootstraps (e.g. the seed script) never attach
  // one, so every emit is routed through here and silently no-ops in that case
  // rather than throwing on `this.server` being undefined.
  private emit(room: string, event: string, payload: unknown): void {
    if (!this.server) {
      return;
    }
    this.server.to(room).emit(event, payload);
  }
}
