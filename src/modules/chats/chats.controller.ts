import { Controller, Post, Get, Param, Query, Body, UseGuards, ParseIntPipe, Req, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';

@ApiTags('Chats')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) { }

  @Get('find')
  async findChat(
    @Req() req,
    @Query('buyerId', ParseIntPipe) buyerId: number,
    @Query('sellerId', ParseIntPipe) sellerId: number,
    @Query('productId', ParseIntPipe) productId: number,
  ) {
    const currentUserId = Number(req.user.userId);
    if (currentUserId !== buyerId && currentUserId !== sellerId) {
      throw new BadRequestException('You can only find chats you are part of');
    }
    const chatId = await this.chatsService.findChat(buyerId, sellerId, productId);
    return { id: chatId };
  }

  @Post()
  async createOrGetChat(@Req() req, @Body() dto: CreateChatDto) {
    const buyerId = Number(req.user.userId);
    if (!dto.sellerId) throw new BadRequestException('sellerId is required');
    if (dto.sellerId === buyerId) throw new BadRequestException('Cannot start chat with yourself');
    const id = await this.chatsService.createOrGetChat(buyerId, dto.sellerId, dto.productId);
    return { id };
  }

  @Get()
  async listMyChats(@Req() req) {
    const userId = Number(req.user.userId);
    return this.chatsService.listChats(userId);
  }

  @Get(':chatId/messages')
  async listMessages(
    @Req() req,
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('limit') limitQ?: string,
  ) {
    const userId = Number(req.user.userId);
    const limit = Math.min(parseInt(limitQ || '50', 10) || 50, 100);
    await this.chatsService.ensureMember(chatId, userId);
    return this.chatsService.listMessages(chatId, limit);
  }

  @Post(':chatId/messages')
  async sendMessage(
    @Req() req,
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: SendMessageDto,
  ) {
    const userId = Number(req.user.userId);
    await this.chatsService.ensureMember(chatId, userId);
    if (dto.type !== 'text' || !dto.text?.trim()) {
      throw new BadRequestException('Only text messages with non-empty text are allowed in MVP');
    }
    return this.chatsService.sendTextMessage(chatId, userId, dto.text.trim());
  }

  @Post(':chatId/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = 'uploads/chat';
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const ts = Date.now();
          const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
          cb(null, `${ts}_${safe}`);
        },
      }),
    }),
  )
  async uploadAttachment(
    @Req() req,
    @Param('chatId', ParseIntPipe) chatId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const userId = Number(req.user.userId);
    if (!file) throw new BadRequestException('No file uploaded');

    let conversationId = chatId;
    try {
      await this.chatsService.ensureMember(conversationId, userId);
    } catch (err) {
      const sellerId = body?.sellerId ? Number(body.sellerId) : undefined;
      const productId = body?.productId ? Number(body.productId) : undefined;
      if (sellerId && productId) {
        conversationId = await this.chatsService.createOrGetChat(userId, sellerId, productId);
      } else {
        throw err;
      }
    }

    const url = `/uploads/chat/${file.filename}`;
    const message = await this.chatsService.sendAttachmentMessage(conversationId, userId, url);
    return { conversationId, message };
  }
}
