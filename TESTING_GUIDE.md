# Testing Guide for Product Purchase System

## Database Migration
Run the SQL migration script:
```sql
-- File: migrations/001_add_purchase_fields_to_products.sql
```

## API Endpoints Testing

### 1. Create Purchase Transaction
```bash
POST /transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": 1,
  "paymentMethod": "cash"
}
```

### 2. Get Purchase History (Buyer)
```bash
GET /transactions/purchase-history?page=1&limit=20
Authorization: Bearer <token>
```

### 3. Get Sold Products (Seller)
```bash
GET /transactions/sold-products?page=1&limit=20
Authorization: Bearer <token>
```

### 4. Get All Products (Should exclude sold products)
```bash
GET /products?page=1&limit=20
```

### 5. Get Product Details (Should include buyer info if sold)
```bash
GET /products/1
```

## Business Logic Tests

### Test Cases:
1. **Concurrent Purchase Prevention**
   - Send multiple POST requests to `/transactions` for the same product simultaneously
   - Only one should succeed, others should return "Product is no longer available"

2. **Self-Purchase Prevention**
   - Try to purchase your own product
   - Should return "You cannot purchase your own product"

3. **Sold Product Filtering**
   - Purchase a product
   - Verify it no longer appears in `/products` listing
   - Verify it still appears in `/products/:id` with status "sold"

4. **Purchase History Accuracy**
   - Make a purchase
   - Check `/transactions/purchase-history` shows the transaction
   - Verify buyer and seller information are correct

5. **Sold Products Tracking**
   - As a seller, check `/transactions/sold-products`
   - Verify sold products appear with buyer information

## Expected Response Formats

### Product Response
```json
{
  "productId": 1,
  "title": "Product Title",
  "status": "available" | "sold",
  "sellerId": 1,
  "buyerId": 2, // Only if sold
  "soldAt": "2024-01-01T12:00:00Z", // Only if sold
  "purchaseId": 1, // Only if sold
  // ... other fields
}
```

### Transaction Response
```json
{
  "transactionId": 1,
  "productId": 1,
  "buyerId": 2,
  "sellerId": 1,
  "price": 100.00,
  "status": "completed",
  "completedAt": "2024-01-01T12:00:00Z",
  "product": { /* Product details */ },
  "seller": { /* Seller details */ }
}
```

## Performance Considerations
- Database indexes added for buyer_id, status, and sold_at columns
- Pessimistic locking used to prevent concurrent purchases
- Product listings filtered to exclude sold items by default

## Error Handling
- 404: Product not found
- 400: Product not available
- 403: Cannot purchase own product
- 500: Database errors (transaction rollback)
