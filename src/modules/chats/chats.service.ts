import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Message } from '../messages/entities/message.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) { }

  async findChat(buyerId: number, sellerId: number, productId: number) {
    const existing = await this.conversationRepository.findOne({
      where: {
        buyerId,
        sellerId,
        productId,
      },
    });
    return existing?.conversationId;
  }

  async createOrGetChat(buyerId: number, sellerId: number, productId?: number) {
    const existing = await this.conversationRepository.findOne({
      where: {
        buyerId,
        sellerId,
        ...(productId ? { productId } : {}),
      },
    });
    if (existing) return existing.conversationId;

    if (productId == null) throw new BadRequestException('productId is required');

    const chat = this.conversationRepository.create({
      buyerId,
      sellerId,
      productId,
    });
    const savedChat = await this.conversationRepository.save(chat);
    return savedChat.conversationId;
  }

  async listChats(userId: number) {
    const conversations = await this.conversationRepository.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      order: { lastMessageAt: 'DESC' },
      relations: ['buyer', 'seller', 'messages'],
    });

    return {
      items: conversations.map((c) => {
        const other = c.buyerId === userId ? c.seller : c.buyer;
        const last = c.messages[0];
        return {
          id: c.conversationId,
          otherUserName: other?.username ?? '',
          lastMessageSnippet: last?.messageText?.startsWith('/uploads/') ? undefined : last?.messageText ?? '',
          unreadCount: 0,
        };
      }),
    };
  }

  async ensureMember(chatId: number, userId: number) {
    const c = await this.conversationRepository.findOne({
      where: { conversationId: chatId },
      select: { buyerId: true, sellerId: true },
    });
    if (!c) throw new NotFoundException('Chat not found');
    if (c.buyerId !== userId && c.sellerId !== userId) {
      throw new ForbiddenException('Not a member of this chat');
    }
  }

  async listMessages(chatId: number, limit: number, offset?: number) {
    const msgs = await this.messageRepository.find({
      where: { conversationId: chatId },
      order: { createdAt: 'DESC' }, // Get newest first for better pagination
      take: limit,
      skip: offset || 0,
    });

    // Reverse to show oldest first
    const reversedMsgs = msgs.reverse();

    const items = reversedMsgs.map((m) => ({
      id: m.messageId,
      senderId: m.senderId,
      text: m.messageText?.startsWith('/uploads/') ? undefined : m.messageText,
      attachmentUrl: m.messageText?.startsWith('/uploads/') ? m.messageText : undefined,
      isRead: m.isRead,
      createdAt: m.createdAt,
    }));
    return { items };
  }

  async sendTextMessage(chatId: number, senderId: number, text: string) {
    const msg = this.messageRepository.create({
      conversationId: chatId,
      senderId,
      messageText: text,
    });

    await this.messageRepository.save(msg);

    await this.conversationRepository.update(
      { conversationId: chatId },
      { lastMessageAt: new Date() }
    );

    return {
      id: msg.messageId,
      senderId: msg.senderId,
      text: msg.messageText,
      attachmentUrl: undefined,
      createdAt: msg.createdAt,
    };
  }

  async sendAttachmentMessage(chatId: number, senderId: number, fileUrl: string) {
    const msg = this.messageRepository.create({
      conversationId: chatId,
      senderId,
      messageText: fileUrl,
    });

    await this.messageRepository.save(msg);

    await this.conversationRepository.update(
      { conversationId: chatId },
      { lastMessageAt: new Date() }
    );

    return {
      id: msg.messageId,
      senderId: msg.senderId,
      text: undefined,
      attachmentUrl: msg.messageText,
      createdAt: msg.createdAt,
    };
  }

  async markMessageAsRead(messageId: number, userId: number) {
    const message = await this.messageRepository.findOne({
      where: { messageId },
      relations: ['conversation'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user is member of this conversation
    await this.ensureMember(message.conversationId, userId);

    // Mark as read if user is not the sender
    if (message.senderId !== userId) {
      await this.messageRepository.update(
        { messageId },
        { isRead: true }
      );
    }

    return true;
  }
}
