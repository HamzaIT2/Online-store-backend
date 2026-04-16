-- Add indexes for better chat performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created_at ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id_created_at ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id_last_message_at ON conversations(buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id_last_message_at ON conversations(seller_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_product_id_buyer_seller ON conversations(product_id, buyer_id, seller_id);
