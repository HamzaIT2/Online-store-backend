import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsIn(['text', 'image', 'file'])
  type: 'text' | 'image' | 'file';

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Message text cannot be empty' })
  @MaxLength(2000, { message: 'Message text cannot exceed 2000 characters' })
  text?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class JoinRoomDto {
  @IsString()
  chatId: string;
}

export class TypingDto {
  @IsString()
  chatId: string;
}

export class MarkAsReadDto {
  @IsString()
  messageId: string;

  @IsString()
  chatId: string;
}
