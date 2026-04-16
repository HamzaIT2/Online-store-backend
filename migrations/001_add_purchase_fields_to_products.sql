-- Add purchase fields to products table
ALTER TABLE products 
ADD COLUMN buyerId INT NULL,
ADD COLUMN soldAt TIMESTAMP NULL,
ADD COLUMN purchaseId INT NULL;

-- Add foreign key constraint (only if buyerId is not null)
ALTER TABLE products ADD CONSTRAINT fk_buyer 
FOREIGN KEY (buyerId) REFERENCES users(user_id);

-- Add performance indexes
CREATE INDEX idx_products_buyer_id ON products(buyerId);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_sold_at ON products(soldAt);
