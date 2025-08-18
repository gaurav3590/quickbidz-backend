import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, set this to your frontend URL
  },
  namespace: 'auction-events',
})
export class AuctionEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger('AuctionEventsGateway');

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.logger.log('WebSocket Server Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinAuction')
  handleJoinAuction(client: Socket, auctionId: string) {
    client.join(`auction-${auctionId}`);
    this.logger.log(`Client ${client.id} joined auction room: ${auctionId}`);
    return { event: 'joinedAuction', data: { auctionId } };
  }

  @SubscribeMessage('leaveAuction')
  handleLeaveAuction(client: Socket, auctionId: string) {
    client.leave(`auction-${auctionId}`);
    this.logger.log(`Client ${client.id} left auction room: ${auctionId}`);
    return { event: 'leftAuction', data: { auctionId } };
  }

  // Method to emit a new bid event to all clients in an auction room
  emitNewBid(auctionId: string, bidData: any) {
    this.server.to(`auction-${auctionId}`).emit('newBid', bidData);
  }

  // Method to emit auction status changes
  emitAuctionStatusChange(auctionId: string, status: string) {
    this.server.to(`auction-${auctionId}`).emit('auctionStatusChange', {
      auctionId,
      status,
    });
  }

  // Method to emit time remaining updates (can be used for countdown)
  emitTimeRemaining(auctionId: string, timeRemaining: number) {
    this.server.to(`auction-${auctionId}`).emit('timeRemaining', {
      auctionId,
      timeRemaining,
    });
  }

  // Method to emit when a user joins an auction (for displaying active users)
  emitUserJoined(auctionId: string, username: string) {
    this.server.to(`auction-${auctionId}`).emit('userJoined', {
      auctionId,
      username,
    });
  }

  // Broadcast method for admin announcements
  broadcastToAllAuctions(message: string) {
    this.server.emit('announcement', { message });
  }
} 