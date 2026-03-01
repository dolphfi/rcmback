import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'scanner',
})
export class ScannerGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ScannerGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('scan')
  handleScan(client: Socket, payload: { barcode: string }): void {
    this.logger.log(`Barcode scanned: ${payload.barcode}`);
    // Broadcast the scanned barcode to all connected clients in the 'scanner' namespace
    // In a real scenario, you might want to room-based broadcasting (e.g., by enterprise or POS)
    this.server.emit('barcode-scanned', payload);
  }
}
