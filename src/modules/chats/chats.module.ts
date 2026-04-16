import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChatGateway } from './chat.gateway';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Message } from '../messages/entities/message.entity';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message]), JwtModule.register({})],
  controllers: [ChatsController],
  providers: [ChatsService, ChatGateway],
  exports: [ChatsService],
})
export class ChatsModule { }
