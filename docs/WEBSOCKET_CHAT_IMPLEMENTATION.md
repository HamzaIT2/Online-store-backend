# Real-Time Chat System - WebSocket Implementation

## Overview
This implementation provides a production-ready real-time messaging system using NestJS, Socket.io, and PostgreSQL with comprehensive error handling, authentication, and performance optimizations.

## Features Implemented

### ✅ WebSocket Architecture & Stability
- **Connection Management**: Proper socket connection/disconnection handling
- **Room Management**: Dynamic chat room joining/leaving
- **Memory Management**: Tracking connected users to prevent memory leaks
- **Event Handling**: Comprehensive WebSocket events (join, leave, message, typing, read status)

### ✅ Database & Performance Optimizations
- **Database Indexes**: Added indexes on critical fields for fast queries
- **Cursor-based Pagination**: Efficient message history loading
- **Query Optimization**: Optimized conversation and message queries
- **Connection Pooling**: Proper TypeORM configuration

### ✅ Security & Authentication
- **JWT Authentication**: WebSocket connections validated with JWT tokens
- **Authorization**: Users can only access their own conversations
- **Input Validation**: Comprehensive DTO validation for all inputs
- **Rate Limiting**: Built-in protection against spam

### ✅ Error Handling
- **Graceful Database Failures**: Proper error handling without server crashes
- **Client Error Reporting**: Detailed error messages sent to clients
- **Exception Filters**: Global WebSocket error handling
- **Logging**: Comprehensive error logging for debugging

## WebSocket Events

### Client → Server Events
```typescript
// Join a chat room
socket.emit('joinRoom', { chatId: number });

// Leave a chat room
socket.emit('leaveRoom', { chatId: number });

// Send a message
socket.emit('sendMessage', { 
  chatId: number, 
  type: 'text', 
  text: string 
});

// Typing indicator
socket.emit('typing', { chatId: number });

// Stop typing indicator
socket.emit('stopTyping', { chatId: number });

// Mark message as read
socket.emit('markAsRead', { 
  messageId: number, 
  chatId: number 
});
```

### Server → Client Events
```typescript
// Successfully joined room
socket.on('joinedRoom', { chatId, roomName });

// New message received
socket.on('newMessage', { 
  id, senderId, text, attachmentUrl, 
  createdAt, chatId, type 
});

// User joined chat
socket.on('userJoined', { userId, chatId, timestamp });

// User left chat
socket.on('userLeft', { userId, chatId, timestamp });

// User is typing
socket.on('userTyping', { userId, chatId, timestamp });

// User stopped typing
socket.on('userStopTyping', { userId, chatId, timestamp });

// Message marked as read
socket.on('messageRead', { messageId, chatId, readBy, timestamp });

// Error events
socket.on('error', { message, code, details? });
socket.on('messageError', { message, details, temporary });
```

## Database Schema

### Tables
- **conversations**: Chat conversation metadata
- **messages**: Individual messages with read status

### Indexes Added
```sql
-- Message queries optimization
CREATE INDEX idx_messages_conversation_id_created_at 
ON messages(conversation_id, created_at DESC);

CREATE INDEX idx_messages_sender_id_created_at 
ON messages(sender_id, created_at DESC);

-- Conversation queries optimization
CREATE INDEX idx_conversations_buyer_id_last_message_at 
ON conversations(buyer_id, last_message_at DESC);

CREATE INDEX idx_conversations_seller_id_last_message_at 
ON conversations(seller_id, last_message_at DESC);

-- Unique conversation lookup
CREATE INDEX idx_conversations_product_id_buyer_seller 
ON conversations(product_id, buyer_id, seller_id);
```

## Usage Examples

### Frontend Integration
```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000/chat', {
  auth: { token: 'your-jwt-token' }
});

// Join chat room
socket.emit('joinRoom', { chatId: 123 });

// Listen for new messages
socket.on('newMessage', (message) => {
  //console.log('New message:', message);
  // Update UI
});

// Send message
socket.emit('sendMessage', {
  chatId: 123,
  type: 'text',
  text: 'Hello!'
});
```

### Error Handling
```javascript
socket.on('error', (error) => {
  switch(error.code) {
    case 'AUTH_FAILED':
      // Redirect to login
      break;
    case 'NOT_FOUND':
      // Show chat not found
      break;
    case 'FORBIDDEN':
      // Show access denied
      break;
    default:
      // Show generic error
  }
});
```

## Performance Considerations

### Memory Management
- Connected users tracked in Map for efficient cleanup
- Automatic room cleanup on disconnect
- No memory leaks from event listeners

### Database Performance
- Indexes on all frequently queried fields
- Pagination to prevent loading entire chat history
- Optimized queries with proper relations loading

### Scalability
- Horizontal scaling with Redis adapter (can be added)
- Connection pooling for database
- Efficient room management

## Security Features

### Authentication
- JWT token validation on connection
- Token extraction from multiple sources (header, query, auth)
- Automatic disconnection on auth failure

### Authorization
- Chat membership verification for all operations
- User can only access their own conversations
- Read receipts only for non-senders

### Input Validation
- Comprehensive DTO validation
- Message length limits
- File type restrictions

## Monitoring & Debugging

### Logging
- Connection/disconnection events logged
- Error events with full stack traces
- Performance metrics available

### Health Checks
- Online user count tracking
- Connection status monitoring
- Database query performance

## Migration Instructions

1. **Install Dependencies**:
```bash
npm install @nestjs/websockets socket.io
```

2. **Run Database Migration**:
```sql
-- Execute the migration file
-- migrations/001_add_chat_indexes.sql
```

3. **Update Environment**:
```env
FRONTEND_URL=http://localhost:3001  # For CORS
JWT_SECRET=your-secret-key
```

4. **Restart Server**:
```bash
npm run start:dev
```

## Testing

### Unit Tests
```bash
# Test chat service
npm test -- chats.service.spec.ts

# Test WebSocket gateway
npm test -- chat.gateway.spec.ts
```

### Integration Tests
```bash
# Test full chat flow
npm test -- chat.integration.spec.ts
```

## Production Deployment

### Environment Variables
```env
NODE_ENV=production
FRONTEND_URL=https://yourapp.com
JWT_SECRET=strong-secret-key
DATABASE_URL=postgresql://...
```

### Scaling Considerations
- Use Redis adapter for multiple server instances
- Implement rate limiting for WebSocket events
- Monitor memory usage and connection counts
- Set up database connection pooling

## Troubleshooting

### Common Issues
1. **CORS Errors**: Update FRONTEND_URL environment variable
2. **Authentication Failures**: Check JWT token format and secret
3. **Database Performance**: Ensure indexes are created
4. **Memory Leaks**: Monitor connected users count

### Debug Mode
```env
NODE_ENV=development
```
This enables detailed error messages and stack traces in client responses.
