import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('MatchGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Custom message listener (you can define many)
  @SubscribeMessage('updateMatchData')
  handleMatchUpdate(client: Socket, payload: any): void {
    this.logger.log(`Received match update: ${JSON.stringify(payload)}`);
    // Broadcast to all connected clients
    this.server.emit('matchUpdated', payload);
  }

  // You can add more events like question update, result declare, etc.
  @SubscribeMessage('updateQuestion')
  handleQuestionUpdate(client: Socket, payload: any): void {
    this.server.emit('questionUpdated', payload);
  }

  // Inside MatchGateway class
  matchCreated(match: any) {
    this.logger.log(`Match created: ${JSON.stringify(match)}`);
    this.server.emit('matchCreated', match); // Emit event to all clients
  }

  emitMatchDeleted(matchId: string) {
    this.server.emit('matchDeleted', matchId); // ✅ NEW for delete
  }
}
