import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaClient) { }

  async findChat(buyerId: number, sellerId: number, productId: number) {
    const existing = await this.prisma.conversations.findFirst({
      where: {
        buyer_id: buyerId,
        seller_id: sellerId,
        product_id: productId,
      },
      select: { conversation_id: true },
    });
    return existing?.conversation_id;
  }

  async createOrGetChat(buyerId: number, sellerId: number, productId?: number) {
    const existing = await this.prisma.conversations.findFirst({
      where: {
        buyer_id: buyerId,
        seller_id: sellerId,
        ...(productId ? { product_id: productId } : {}),
      },
      select: { conversation_id: true },
    });
    if (existing) return existing.conversation_id;

    if (productId == null) throw new BadRequestException('productId is required');

    const chat = await this.prisma.conversations.create({
      data: {
        buyer_id: buyerId,
        seller_id: sellerId,
        product_id: productId,
      },
      select: { conversation_id: true },
    });
    return chat.conversation_id;
  }

  async listChats(userId: number) {
    const conversations = await this.prisma.conversations.findMany({
      where: { OR: [{ buyer_id: userId }, { seller_id: userId }] },
      orderBy: { last_message_at: 'desc' },
      include: {
        users_conversations_buyer_idTousers: { select: { id: true, username: true, fullName: true, avatar: true } },
        users_conversations_seller_idTousers: { select: { id: true, username: true, fullName: true, avatar: true } },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
          select: { message_text: true },
        },
      },
    });

    return {
      items: conversations.map((c) => {
        const other =
          c.buyer_id === userId ? c.users_conversations_seller_idTousers : c.users_conversations_buyer_idTousers;
        const last = c.messages[0];
        return {
          id: c.conversation_id,
          otherUserName: other?.username ?? '',
          lastMessageSnippet: last?.message_text ?? '',
          unreadCount: 0,
        };
      }),
    };
  }

  async ensureMember(chatId: number, userId: number) {
    const c = await this.prisma.conversations.findUnique({
      where: { conversation_id: chatId },
      select: { buyer_id: true, seller_id: true },
    });
    if (!c) throw new NotFoundException('Chat not found');
    if (c.buyer_id !== userId && c.seller_id !== userId) {
      throw new ForbiddenException('Not a member of this chat');
    }
  }

  async listMessages(chatId: number, limit: number) {
    const msgs = await this.prisma.message.findMany({
      where: { conversation_id: chatId },
      orderBy: { created_at: 'asc' },
      take: limit,
    });
    const items = msgs.map((m) => ({
      id: m.message_id,
      senderId: m.sender_id,
      text: m.message_text?.startsWith('/uploads/') ? undefined : m.message_text,
      attachmentUrl: m.message_text?.startsWith('/uploads/') ? m.message_text : undefined,
      createdAt: m.created_at,
    }));
    return { items };
  }

  async sendTextMessage(chatId: number, senderId: number, text: string) {
    const [msg] = await this.prisma.$transaction([
      this.prisma.message.create({ data: { conversation_id: chatId, sender_id: senderId, message_text: text } }),
      this.prisma.conversations.update({ where: { conversation_id: chatId }, data: { last_message_at: new Date() } }),
    ]);
    return {
      id: msg.message_id,
      senderId: msg.sender_id,
      text: msg.message_text,
      attachmentUrl: undefined,
      createdAt: msg.created_at,
    };
  }

  async sendAttachmentMessage(chatId: number, senderId: number, fileUrl: string) {
    const [msg] = await this.prisma.$transaction([
      this.prisma.message.create({ data: { conversation_id: chatId, sender_id: senderId, message_text: fileUrl } }),
      this.prisma.conversations.update({ where: { conversation_id: chatId }, data: { last_message_at: new Date() } }),
    ]);
    return {
      id: msg.message_id,
      senderId: msg.sender_id,
      text: undefined,
      attachmentUrl: msg.message_text,
      createdAt: msg.created_at,
    };
  }
}
