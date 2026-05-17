import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

type JoinSlotPayload = {
  // epoch ms of the 10-minute time slot
  startTimeSlotMs: number;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PartiesGateway implements OnGatewayConnection {
  private readonly logger = new Logger(PartiesGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(token);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.verifiedAt) {
        throw new UnauthorizedException('User not verified.');
      }

      client.data.userId = user.id;
      client.join(`user:${user.id}`);
    } catch (e) {
      this.logger.warn(`Socket auth failed: ${(e as Error).message}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join-slot')
  async joinSlot(
    @MessageBody() data: JoinSlotPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const startTimeSlotMs = Number(data?.startTimeSlotMs);
    if (!Number.isFinite(startTimeSlotMs)) {
      return { ok: false, error: 'Invalid startTimeSlotMs' };
    }

    const room = this.roomForSlot(startTimeSlotMs);
    client.join(room);
    return { ok: true };
  }

  roomForSlot(startTimeSlotMs: number) {
    return `slot:${startTimeSlotMs}`;
  }

  notifySlot(startTimeSlotMs: number, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(this.roomForSlot(startTimeSlotMs)).emit(event, payload);
  }

  notifyUser(userId: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit('notification', payload);
  }
}

