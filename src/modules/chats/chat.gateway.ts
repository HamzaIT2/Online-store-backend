import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ChatsService } from './chats.service';
import { SendMessageDto } from './dto/send-message.dto';

interface AuthenticatedSocket extends Socket {
  userId: number;
  user: any;
}

interface JoinRoomPayload {
  chatId: number;
}

interface SendMessagePayload extends SendMessageDto {
  chatId: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');
  private readonly connectedUsers = new Map<number, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private readonly chatsService: ChatsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Check if userId is provided directly in auth (for simpler auth)
      const directUserId = client.handshake.auth.userId;

      if (directUserId) {
        // Direct userId approach - simpler auth
        const userId = Number(directUserId);

        const authenticatedClient = client as AuthenticatedSocket;
        authenticatedClient.userId = userId;
        authenticatedClient.user = { userId };

        // Track user connections
        if (!this.connectedUsers.has(userId)) {
          this.connectedUsers.set(userId, new Set());
        }
        this.connectedUsers.get(userId)!.add(client.id);

        this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

        // Join user to their personal room for notifications
        await client.join(`user:${userId}`);

      } else {
        // JWT token approach
        const token = this.extractTokenFromSocket(client);
        if (!token) {
          throw new UnauthorizedException('No token or userId provided');
        }

        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });

        const authenticatedClient = client as AuthenticatedSocket;
        authenticatedClient.userId = payload.userId;
        authenticatedClient.user = payload;

        // Track user connections
        if (!this.connectedUsers.has(payload.userId)) {
          this.connectedUsers.set(payload.userId, new Set());
        }
        this.connectedUsers.get(payload.userId)!.add(client.id);

        this.logger.log(`Client connected: ${client.id} (User: ${payload.userId})`);

        // Join user to their personal room for notifications
        await client.join(`user:${payload.userId}`);
      }

    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const authenticatedClient = client as AuthenticatedSocket;
    const userId = authenticatedClient.userId;

    if (userId) {
      // Remove socket from user connections
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }
    }

    this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() payload: JoinRoomPayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { chatId } = payload;
      const userId = client.userId;

      //console.log("DEBUG: User joined room:", chatId);

      // Verify user is member of this chat
      await this.chatsService.ensureMember(chatId, userId);

      // Join chat room
      const roomName = `chat:${chatId}`;
      await client.join(roomName);

      // Notify other participants
      client.to(roomName).emit('userJoined', {
        userId,
        chatId,
        timestamp: new Date(),
      });

      // Send confirmation
      client.emit('joinedRoom', { chatId, roomName });

      this.logger.log(`User ${userId} joined chat room ${chatId}`);
    } catch (error) {
      this.logger.error(`Failed to join room:`, error.message);
      client.emit('error', { message: 'Failed to join room', details: error.message });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() payload: JoinRoomPayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { chatId } = payload;
      const roomName = `chat:${chatId}`;

      await client.leave(roomName);

      // Notify other participants
      client.to(roomName).emit('userLeft', {
        userId: client.userId,
        chatId,
        timestamp: new Date(),
      });

      client.emit('leftRoom', { chatId });
      this.logger.log(`User ${client.userId} left chat room ${chatId}`);
    } catch (error) {
      this.logger.error(`Failed to leave room:`, error.message);
      client.emit('error', { message: 'Failed to leave room' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() payload: SendMessagePayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { chatId, type, text } = payload;
      const userId = client.userId;

      //console.log("DEBUG: Received message from client:", payload);

      // Validate message type
      if (type !== 'text' || !text?.trim()) {
        throw new WsException('Only text messages with non-empty text are allowed');
      }

      // Verify user is member of this chat
      await this.chatsService.ensureMember(chatId, userId);

      // Save message to database with error handling
      const message = await this.chatsService.sendTextMessage(chatId, userId, text.trim());

      const roomName = `chat:${chatId}`;

      const savedMessage = {
        ...message,
        chatId,
        type: 'text',
      };

      //console.log("DEBUG: Broadcasting message to room:", chatId, "with payload:", savedMessage);

      // Broadcast to all users in the chat room
      this.server.to(roomName).emit('newMessage', savedMessage);

      // Send confirmation to sender
      client.emit('messageSent', { messageId: message.id, timestamp: message.createdAt });

      this.logger.log(`Message sent in chat ${chatId} by user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send message:`, error.message);

      // Send specific error to client
      client.emit('messageError', {
        message: 'Failed to send message',
        details: error.message,
        temporary: true, // Indicates message wasn't saved
      });
    }
  }

  @SubscribeMessage('broadcastMessage')
  handleBroadcastMessage(@MessageBody() payload: any) {
    //console.log('📡 BACKEND RECEIVED BROADCAST REQUEST:', payload);

    // Assuming payload has chatId
    const roomId = payload.chatId.toString();
    this.server.to(roomId).emit('newMessage', payload);

    //console.log('📡 BACKEND EMITTED newMessage TO ROOM:', roomId);
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() payload: JoinRoomPayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { chatId } = payload;
      const userId = client.userId;

      // Verify user is member of this chat
      await this.chatsService.ensureMember(chatId, userId);

      const roomName = `chat:${chatId}`;

      // Broadcast typing indicator to other users in the room
      client.to(roomName).emit('userTyping', {
        userId,
        chatId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to handle typing indicator:`, error.message);
      // Silently fail for typing indicators
    }
  }

  @SubscribeMessage('stopTyping')
  async handleStopTyping(
    @MessageBody() payload: JoinRoomPayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { chatId } = payload;
      const userId = client.userId;

      await this.chatsService.ensureMember(chatId, userId);

      const roomName = `chat:${chatId}`;

      client.to(roomName).emit('userStopTyping', {
        userId,
        chatId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to handle stop typing:`, error.message);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() payload: { chatId: number; messageId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { chatId, messageId } = payload;
      const userId = client.userId;

      await this.chatsService.ensureMember(chatId, userId);
      await this.chatsService.markMessageAsRead(messageId, userId);

      const roomName = `chat:${chatId}`;

      // Notify other participants that message was read
      client.to(roomName).emit('messageRead', {
        messageId,
        chatId,
        readBy: userId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to mark message as read:`, error.message);
      client.emit('error', { message: 'Failed to mark message as read' });
    }
  }

  // Helper method to extract token from socket
  private extractTokenFromSocket(client: Socket): string | null {
    const token = client.handshake.auth.token ||
      client.handshake.headers.authorization?.replace('Bearer ', '') ||
      client.handshake.query.token;

    return token as string || null;
  }

  /**
   * Broadcast a new message to all clients in a chat room.
   * Called by ChatsController when a message is sent via HTTP API.
   */
  broadcastNewMessageToRoom(chatId: number, message: { id: number; senderId: number; text?: string; attachmentUrl?: string; attachmentName?: string; createdAt: Date; type?: 'text' | 'attachment' }) {
    const roomName = `chat:${chatId}`;
    const payload = {
      ...message,
      chatId,
      type: message.type || 'text',
    };
    this.server.to(roomName).emit('newMessage', payload);
    this.logger.log(`Broadcast newMessage to room ${roomName} (HTTP API)`);
  }

  // Method to send notification to specific user
  async sendNotificationToUser(userId: number, event: string, data: any) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets && userSockets.size > 0) {
      this.server.to(`user:${userId}`).emit(event, data);
      return true;
    }
    return false;
  }

  // Method to get online users count
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Method to check if user is online
  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }
}
