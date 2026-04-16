# Testing the Fixed Transaction System

## 1. Database Migration
First, run the updated migration:
```sql
-- File: migrations/001_add_purchase_fields_to_products.sql
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
```

## 2. Start the Server
```bash
npm run start:dev
```

## 3. Test the API Endpoints

### Create a Transaction (with buyerId in request body)
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "amount": 1000,
    "buyerId": 4
  }'
```

### Expected Console Logs:
```
=== Transaction Request ===
Request body: { productId: 1, amount: 1000, buyerId: 4 }
Request user: { id: 1, userId: 1, ... }
Using buyerId: 4
=== Creating Transaction ===
productId: 1
amount: 1000
buyerId: 4
Found product: { productId: 1, sellerId: 1, status: 'available', ... }
Product sellerId: 1
Request buyerId: 4
Saved transaction: { id: 1, productId: 1, buyerId: 4, sellerId: 1, ... }
Updated product with buyerId: 4
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "productId": 1,
    "buyerId": 4,
    "sellerId": 1,
    "amount": 1000,
    "status": "completed",
    "createdAt": "2026-03-17T12:00:00.000Z"
  },
  "message": "Product purchased successfully"
}
```

## 4. Verify Database Updates
Check the products table:
```sql
SELECT productId, sellerId, buyerId, status, soldAt, purchaseId 
FROM products 
WHERE productId = 1;
```

Expected result:
```sql
productId | sellerId | buyerId | status | soldAt                | purchaseId
1         | 1        | 4       | sold   | 2026-03-17 12:00:00 | 1
```

## 5. Test Purchase History
```bash
curl -X GET http://localhost:3000/transactions/purchase-history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected console logs:
```
=== Purchase History Request ===
User ID: 1
Found purchases: 1
```

## 6. Test Sold Products
```bash
curl -X GET http://localhost:3000/transactions/sold-products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected console logs:
```
=== Sold Products Request ===
User ID: 1
Found sold products: 1
```

## Key Fixes Applied:

1. **Database Migration**: Updated to make columns NULLable initially
2. **Request Body Handling**: Now accepts `buyerId` from request body
3. **Fallback Logic**: Uses authenticated user ID if buyerId not provided
4. **Console Logging**: Added comprehensive logging for debugging
5. **User ID Handling**: Properly handles both `req.user.id` and `req.user.userId`
6. **Validation**: Added DTO with validation decorators
7. **Error Handling**: Better error messages and logging

The backend should now properly read the `buyerId: 4` from the request body and store it in the database.
