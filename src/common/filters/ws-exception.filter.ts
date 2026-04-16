import { Catch, ArgumentsHost, Logger, UnauthorizedException } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    this.logger.error(`WebSocket Error for client ${client.id}:`, exception);

    // Send appropriate error to client
    if (exception instanceof UnauthorizedException) {
      client.emit('error', {
        message: 'Authentication failed',
        code: 'AUTH_FAILED'
      });
      client.disconnect();
    } else if (exception.message?.includes('not found')) {
      client.emit('error', {
        message: 'Resource not found',
        code: 'NOT_FOUND'
      });
    } else if (exception.message?.includes('forbidden')) {
      client.emit('error', {
        message: 'Access denied',
        code: 'FORBIDDEN'
      });
    } else {
      client.emit('error', {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? exception.message : undefined
      });
    }
  }
}
