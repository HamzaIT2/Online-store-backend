<div dir="rtl">

# توثيق مشروع المتجر الإلكتروني العراقي - NestJS Backend

## نظرة عامة على الهيكلية (Architecture Overview)

### ما هو NestJS؟

NestJS هو إطار عمل (Framework) مبني على Node.js يستخدم TypeScript ويتبع نمط التصميم **Modular Architecture**. فكرته الأساسية هي تنظيم الكود في وحدات منفصلة ومستقلة، كل وحدة مسؤولة عن جزء معين من التطبيق.

### المكونات الأساسية في NestJS

#### 1. الوحدات (Modules)

الوحدة هي الحاوية الأساسية للكود في NestJS. كل وحدة تجمع معاً:

- **Controllers**: للتعامل مع الطلبات HTTP
- **Services**: لمنطق الأعمال
- **Entities**: لتمثيل قاعدة البيانات
- **DTOs**: لتحقق من البيانات القادمة من المستخدم

**مثال:** `AuthModule` يجمع كل ما يتعلق بالمصادقة (تسجيل، دخول، إعادة تعيين كلمة المرور).

#### 2. المتحكمات (Controllers)

المتحكم هو المسؤول عن **استقبال الطلبات** من Frontend وإرجاع الاستجابات. هو الواجهة الخارجية للـ API.

**وظيفته:**

- استقبال طلبات HTTP (GET, POST, PUT, DELETE)
- التحقق من صحة البيانات القادمة
- استدعاء الـ Service المناسب
- إرجاع النتيجة للمستخدم

**مثال:** `AuthController` يستقبل طلبات `/api/v1/auth/register` و `/api/v1/auth/login`.

#### 3. الخدمات (Services)

الخدمة تحتوي على **منطق الأعمال** (Business Logic). هي العقل المدبر للتطبيق.

**وظيفتها:**

- تنفيذ العمليات المعقدة
- التعامل مع قاعدة البيانات
- التحقق من قواعد العمل
- التواصل مع الخدمات الأخرى

**مثال:** `AuthService` يقوم بالتحقق من كلمة المرور، إنشاء JWT، إرسال الإيميلات.

#### 4. الكيانات (Entities)

الكيان يمثل **جدول في قاعدة البيانات**. هو نسخة TypeScript من الجدول.

**وظيفته:**

- تعريف أعمدة الجدول
- تحديد العلاقات بين الجداول
- تحويل البيانات من قاعدة البيانات إلى كائنات JavaScript

**مثال:** `User Entity` يمثل جدول `users` في قاعدة البيانات.

---

## دورة حياة الطلب (Request Lifecycle)

### الخطوة 1: الطلب يصل من Frontend

```
Frontend → HTTP Request → NestJS Application
```

الطلب يصل إلى التطبيق عبر HTTP مع معلومات مثل:

- **Method**: GET, POST, PUT, DELETE
- **URL**: `/api/v1/products`
- **Headers**: Authorization, Content-Type
- **Body**: البيانات (في حالة POST/PUT)

### الخطوة 2: Middleware & Guards

```
Request → CORS → Global Pipes → Guards → Controller
```

- **CORS**: التحقق من مصدر الطلب
- **Global Validation Pipe**: التحقق من صحة البيانات
- **JWT Auth Guard**: التحقق من وجود توكن صحيح
- **Admin Guard**: التحقق من صلاحيات المدير (إذا لزم)

### الخطوة 3: Controller يستقبل الطلب

```typescript
@Get('products')
async findAll(@Query() query: GetProductsDto) {
  return this.productsService.findAll(query);
}
```

- **Controller** يستقبل الطلب
- **Extracts** البيانات من Query Parameters
- **Calls** الـ Service المناسب

### الخطوة 4: Service ينفذ منطق الأعمال

```typescript
async findAll(query: GetProductsDto) {
  const products = await this.productRepository.find({
    where: query,
    relations: ['seller', 'category']
  });
  return products;
}
```

- **Service** يبني استعلام SQL
- **Communicates** مع TypeORM
- **Applies** قواعد العمل

### الخطوة 5: TypeORM يتعامل مع قاعدة البيانات

```
Service → TypeORM → PostgreSQL Database
```

- **TypeORM** يحول الكائنات إلى SQL
- **Executes** الاستعلام على PostgreSQL
- **Maps** النتائج إلى كائنات TypeScript

### الخطوة 6: العودة بالاستجابة

```
Database → TypeORM → Service → Controller → HTTP Response → Frontend
```

- **Database** ترجع البيانات
- **TypeORM** يحولها إلى كائنات
- **Service** يعالج البيانات
- **Controller** يعيد الاستجابة بصيغة JSON

---

## تفصيل المجلدات والملفات (Detailed File Breakdown)

### 1. وحدة المصادقة (Auth Module)

#### الملفات:

- `auth.module.ts`
- `auth.controller.ts`
- `auth.service.ts`
- `dto/` (RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto)
- `strategies/jwt.strategy.ts`

#### Auth Controller - وظيفته بالتفصيل:

```typescript
@Controller("auth")
export class AuthController {
  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    // يستقبل بيانات التسجيل (اسم، إيميل، كلمة مرور، هاتف)
    // يرسلها إلى الـ Service للمعالجة
  }

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    // يستقبل الإيميل وكلمة المرور
    // يتحقق من صحتها ويعيد JWT Token
  }

  @Post("forgot-password")
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    // يستقبل الإيميل
    // يرسل رابط إعادة تعيين كلمة المرور
  }
}
```

#### Auth Service - وظيفته بالتفصيل:

```typescript
@Injectable()
export class AuthService {
  async register(registerDto: RegisterDto) {
    // 1. التحقق من عدم وجود مستخدم بنفس الإيميل أو الهاتف
    // 2. تشفير كلمة المرور باستخدام bcrypt
    // 3. إنشاء كود تحقق OTP (6 أرقام)
    // 4. حفظ المستخدم في قاعدة البيانات
    // 5. إرسال إيميل التحقق
    // 6. إرجاع رسالة نجاح
  }

  async login(loginDto: LoginDto) {
    // 1. البحث عن المستخدم بالإيميل
    // 2. مقارنة كلمة المرور المشفرة
    // 3. التحقق من تفعيل الحساب
    // 4. إنشاء JWT Token
    // 5. إرجاع التوكن وبيانات المستخدم
  }
}
```

#### User Entity - هيكلته بالتفصيل:

```typescript
@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ name: "user_id" })
  userId: number; // المفتاح الأساسي

  @Column({ unique: true })
  email: string; // الإيميل (فريد)

  @Column({ name: "password_hash" })
  @Exclude() // لا يظهر في الاستجابة
  passwordHash: string; // كلمة المرور المشفرة

  @Column({ name: "full_name" })
  fullName: string; // الاسم الكامل

  @Column({ name: "full_name_ar" })
  fullNameAr: string; // الاسم بالعربية

  @Column({ name: "phone_number", unique: true })
  phoneNumber: string; // رقم الهاتف (فريد)

  @Column({ default: "user" })
  role: "user" | "admin"; // صلاحيات المستخدم

  @Column({ default: false })
  isVerified: boolean; // هل تم تفعيل الحساب؟

  @Column({ nullable: true })
  verificationCode: string; // كود التحقق

  @Column({ type: "timestamp", nullable: true })
  verificationCodeExpiry: Date; // تاريخ انتهاء الكود

  // العلاقات
  @ManyToOne(() => Province)
  province: Province; // المحافظة

  @OneToMany(() => Product, (product) => product.seller)
  products: Product[]; // المنتجات التي يبيعها
}
```

---

### 2. وحدة المنتجات (Products Module)

#### الملفات:

- `products.module.ts`
- `products.controller.ts`
- `products.service.ts`
- `entities/product.entity.ts`
- `dto/` (CreateProductDto, UpdateProductDto, GetProductsDto)

#### Products Controller - وظيفته بالتفصيل:

```typescript
@Controller("products")
export class ProductsController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor("images", 10))
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: User,
    @UploadedFiles() images: Array<Express.Multer.File>,
  ) {
    // يستقبل بيانات المنتج (عنوان، سعر، وصف، صور)
    // يتحقق من توكن المستخدم
    // يحفظ الصور في مجلد uploads
    // يرسل كل شيء للـ Service
  }

  @Get()
  async findAll(
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Query("categoryId") categoryId?: number,
    @Query("search") search?: string,
    @Query("minPrice") minPrice?: number,
    @Query("maxPrice") maxPrice?: number,
  ) {
    // يستقبل معاملات البحث والتصفية
    // يدعم التصفح (pagination)
    // يدعم البحث بالعنوان والوصف
    // يدعم التصفية بالفئة والسعر
  }

  @Get(":id")
  async findOne(@Param("id") id: number) {
    // يجلب منتج واحد بالمعرف
    // يزيد عداد المشاهدات
    // يعيد كل التفاصيل مع الصور والبائع
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: number,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: User,
  ) {
    // يتحقق من أن المستخدم هو صاحب المنتج
    // يسمح بتحديث كل الحقول ما عدا الحالة
    // يحفظ التغييرات
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async remove(@Param("id") id: number, @CurrentUser() user: User) {
    // يتحقق من ملكية المنتج
    // يمنع حذف المنتجات المباعة
    // يحذف المنتج وصوره
  }
}
```

#### Products Service - وظيفته بالتفصيل:

```typescript
@Injectable()
export class ProductsService {
  async create(
    createProductDto: CreateProductDto,
    user: User,
    images: Array<Express.Multer.File>,
  ) {
    // 1. إنشاء كائن المنتج مع ربطه بالمستخدم
    // 2. حفظ المنتج في قاعدة البيانات
    // 3. حفظ الصور في جدول الصور
    // 4. ربط الصور بالمنتج
    // 5. إرجاع المنتج الكامل مع العلاقات
  }

  async findAll(page: number, limit: number, filters: ProductFilters) {
    // 1. بناء استعلام ديناميكي حسب الفلاتر
    // 2. إضافة العلاقات (seller, category, images)
    // 3. تطبيق التصفح (skip/take)
    // 4. ترتيب النتائج حسب تاريخ الإنشاء
    // 5. حساب التقييمات للبائعين
    // 6. إرجاع البيانات مع معلومات التصفح
  }

  async update(id: number, updateProductDto: UpdateProductDto, user: User) {
    // 1. جلب المنتج والتحقق من وجوده
    // 2. التحقق من ملكية المستخدم للمنتج
    // 3. منع تغيير الحالة عبر هذه الدالة
    // 4. تطبيق التحديثات المسموح بها
    // 5. حفظ التغييرات
  }

  async markAsSold(productId: number, buyerId: number, sellerId: number) {
    // 1. التحقق من توفر المنتج
    // 2. التحقق من أن البائع هو المالك
    // 3. تحديث حالة المنتج إلى 'sold'
    // 4. تسجيل تاريخ البيع والمشتري
    // 5. إرجاع المنتج المحدث
  }
}
```

#### Product Entity - هيكلته بالتفصيل:

```typescript
@Entity("products")
export class Product {
  @PrimaryGeneratedColumn({ name: "product_id" })
  productId: number; // المفتاح الأساسي

  @Column({ name: "seller_id" })
  sellerId: number; // معرف البائع

  @Column({ name: "category_id" })
  categoryId: number; // معرف الفئة

  @Column({ length: 200 })
  title: string; // عنوان المنتج

  @Column({ type: "text" })
  description: string; // وصف المنتج

  @Column({ type: "decimal", precision: 12, scale: 2 })
  price: number; // السعر

  @Column({ length: 20, default: "used" })
  condition: string; // الحالة (new/used)

  @Column({ default: true })
  isNegotiable: boolean; // قابل للتفاوض

  @Column({ length: 20, default: "available" })
  status: string; // الحالة (available/sold/unavailable)

  @Column({ default: 0 })
  viewCount: number; // عدد المشاهدات

  @Column({ default: false })
  isVip: boolean; // هل هو منتج مميز؟

  @Column({ type: "timestamp", nullable: true })
  vipExpiryDate: Date; // تاريخ انتهاء التمييز

  // العلاقات
  @ManyToOne(() => User)
  seller: User; // البائع

  @ManyToOne(() => User)
  buyer: User; // المشتري (بعد البيع)

  @ManyToOne(() => Category)
  category: Category; // الفئة

  @OneToMany(() => Image, (image) => image.product)
  images: Image[]; // صور المنتج
}
```

---

### 3. وحدة الفئات (Categories Module)

#### الملفات:

- `categories.module.ts`
- `categories.controller.ts`
- `categories.service.ts`
- `entities/category.entity.ts`
- `dto/` (CreateCategoryDto, UpdateCategoryDto)

#### Categories Controller - وظيفته بالتفصيل:

```typescript
@Controller("categories")
export class CategoriesController {
  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    // فقط الأدمن يمكنه إنشاء فئات
    // يستقبل اسم الفئة بالعربي والإنجليزي
    // يمكن تحديد فئة أصل (parent)
  }

  @Get()
  async findAll() {
    // يعيد كل الفئات الرئيسية مع الفئات الفرعية
    // مرتبة أبجدياً
    // بصيغة مناسبة للـ Frontend
  }

  @Get("tree")
  async getCategoryTree() {
    // يعيد الهيكل الشجري الكامل للفئات
    // مفيد لعرض القوائم المنسدلة
  }

  @Get(":id/subcategories")
  async findSubcategories(@Param("id") id: number) {
    // يعيد الفئات الفرعية لفئة معينة
    // يتحقق من وجود الفئة الأصل
  }
}
```

#### Categories Service - وظيفته بالتفصيل:

```typescript
@Injectable()
export class CategoriesService {
  async findAll() {
    // 1. جلب الفئات الرئيسية فقط (parent_id IS NULL)
    // 2. جلب الفئات الفرعية المرتبطة بها
    // 3. ترتيب النتائج أبجدياً
    // 4. تنسيق البيانات للـ Frontend
    // 5. إرجاع مصفوفة من الفئات مع subs
  }

  async create(createCategoryDto: CreateCategoryDto) {
    // 1. التحقق من عدم وجود فئة بنفس الاسم
    // 2. التحقق من وجود الفئة الأصل إذا تم تحديدها
    // 3. منع الفئة من أن تكون أصل لنفسها
    // 4. حفظ الفئة الجديدة
  }

  async remove(id: number) {
    // 1. التحقق من وجود الفئة
    // 2. التحقق من عدم وجود فئات فرعية
    // 3. التحقق من عدم وجود منتجات
    // 4. حذف الفئة
  }
}
```

#### Category Entity - هيكلته بالتفصيل:

```typescript
@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn({ name: "category_id" })
  categoryId: number; // المفتاح الأساسي

  @Column({ name: "parent_id", nullable: true })
  parentId: number; // معرف الفئة الأصل

  @Column({ length: 100 })
  name: string; // الاسم بالإنجليزي

  @Column({ name: "name_ar", length: 100 })
  nameAr: string; // الاسم بالعربي

  @Column({ type: "text", nullable: true })
  description: string; // الوصف

  @Column({ length: 100, nullable: true })
  icon: string; // الأيقونة

  @Column({ name: "is_active", default: true })
  isActive: boolean; // هل الفئة نشطة؟

  @Column({ name: "display_order", default: 0 })
  displayOrder: number; // ترتيب العرض

  // العلاقات
  @ManyToOne(() => Category, (category) => category.subCategories)
  parentCategory: Category; // الفئة الأصل

  @OneToMany(() => Category, (category) => category.parentCategory)
  subCategories: Category[]; // الفئات الفرعية

  @OneToMany(() => Product, (product) => product.category)
  products: Product[]; // المنتجات في هذه الفئة
}
```

---

### 4. وحدة المعاملات/الطلبات (Transactions Module)

#### الملفات:

- `transactions.module.ts`
- `transactions.controller.ts`
- `transactions.service.ts`
- `entities/transaction.entity.ts`
- `dto/create-transaction.dto.ts`

#### Transactions Controller - وظيفته بالتفصيل:

```typescript
@Controller("transactions")
@UseGuards(JwtAuthGuard) // كل العمليات تتطلب مصادقة
export class TransactionsController {
  @Post()
  async createTransaction(@Body() body: CreateTransactionDto, @Request() req) {
    // يستقبل productId و amount
    // يستخرج buyerId من التوكن أو من الطلب
    // يستدعي الـ Service لإنشاء المعاملة
  }

  @Get("purchase-history")
  async getPurchaseHistory(@Request() req) {
    // يعيد قائمة مشتريات المستخدم الحالي
    // يشمل تفاصيل المنتج والبائع
  }

  @Get("sold-products")
  async getSoldProducts(@Request() req) {
    // يعيد قائمة المنتجات المباعة من المستخدم الحالي
    // يشمل تفاصيل المنتج والمشتري
  }
}
```

#### Transactions Service - وظيفته بالتفصيل:

```typescript
@Injectable()
export class TransactionsService {
  async createTransaction(productId: number, amount: number, buyerId: number) {
    // يستخدم Database Transaction لضمان التكامل
    return await this.dataSource.transaction(async (manager) => {
      // 1. قفل المنتج لمنع الشراء المتزامن
      const product = await manager.findOne(Product, {
        where: { productId },
        lock: { mode: "pessimistic_write" },
      });

      // 2. التحقق من توفر المنتج
      if (product.status !== "available") {
        throw new Error("Product is not available");
      }

      // 3. التحقق من أن المشتري ليس البائع
      if (product.sellerId === buyerId) {
        throw new Error("Cannot purchase your own product");
      }

      // 4. إنشاء المعاملة
      const transaction = manager.create(Transaction, {
        productId,
        buyerId,
        sellerId: product.sellerId,
        amount,
        status: "completed",
      });

      // 5. حفظ المعاملة
      await manager.save(transaction);

      // 6. تحديث حالة المنتج
      await manager.update(Product, productId, {
        status: "sold",
        buyerId,
        soldAt: new Date(),
        purchaseId: transaction.id,
      });

      return transaction;
    });
  }

  async getPurchaseHistory(buyerId: number) {
    // يجلب كل معاملات المشتري
    // مع تفاصيل المنتج والبائع
    // مرتبة حسب التاريخ (الأحدث أولاً)
  }
}
```

#### Transaction Entity - هيكلته بالتفصيل:

```typescript
@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number; // المفتاح الأساسي

  @Column({ name: "product_id" })
  productId: number; // معرف المنتج

  @Column({ name: "buyer_id" })
  buyerId: number; // معرف المشتري

  @Column({ name: "seller_id" })
  sellerId: number; // معرف البائع

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount: number; // المبلغ المدفوع

  @Column({ length: 20, default: "pending" })
  status: string; // الحالة (pending/completed/cancelled)

  // العلاقات
  @ManyToOne(() => Product)
  product: Product; // المنتج

  @ManyToOne(() => User)
  buyer: User; // المشتري

  @ManyToOne(() => User)
  seller: User; // البائع
}
```

---

### 5. قاعدة البيانات والبيانات الأولية (Database & Seeds)

#### Database Configuration - `database.config.ts`

```typescript
export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: "postgres", // نوع قاعدة البيانات
  host: configService.get("DB_HOST"), // الخادم
  port: configService.get("DB_PORT"), // المنفذ
  username: configService.get("DB_USERNAME"), // اسم المستخدم
  password: configService.get("DB_PASSWORD"), // كلمة المرور
  database: configService.get("DB_DATABASE"), // اسم قاعدة البيانات
  entities: [__dirname + "/../**/*.entity{.ts,.js}"], // ملفات الكيانات
  synchronize: process.env.NODE_ENV === "development", // المزامنة في بيئة التطوير
  logging: process.env.NODE_ENV === "development", // تسجيل الاستعلامات
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});
```

#### Seed Data - `seed.ts`

الملف يحتوي على بيانات أولية للعراق:

- **18 محافظة** مع أسمائها بالعربي والإنجليزي
- **54 مدينة** موزعة على المحافظات
- **8 فئات رئيسية** للمنتجات (إلكترونيات، أزياء، عقارات، مركبات، إلخ)

**مميزات الـ Seeding:**

1. **Idempotent**: يمكن تشغيله عدة مرات دون مشاكل
2. **Bilingual Support**: بيانات بالعربي والإنجليزي
3. **Smart Checking**: يتحقق من وجود البيانات قبل إضافتها
4. **Structured Data**: بيانات منظمة وعلاقات صحيحة

---

## نقاط قوة المشروع (Project Strengths)

### 1. الدعم ثنائي اللغة (Bilingual Support)

**الميزة الفنية:** المشروع يدعم اللغتين العربية والإنجليزية بشكل كامل في:

- **الكيانات (Entities):** كل جدول يحتوي على حقول باللغتين

  ```typescript
  @Column({ name: 'full_name' })
  fullName: string;                  // بالإنجليزي

  @Column({ name: 'full_name_ar' })
  fullNameAr: string;                // بالعربي
  ```

- **الفئات:** اسم الفئة بالعربي والإنجليزي
- **المحافظات والمدن:** أسماء باللغتين
- **الرسائل:** رسائل الخطأ والنجاح بالعربي

**الأهمية في الدفاع:** يظهر فهمك لـ Internationalization (i18n) واحتياجات السوق العراقي.

### 2. علاقات TypeORM المتقدمة (Advanced TypeORM Relationships)

**الميزة الفنية:** استخدام متقدم للعلاقات في قاعدة البيانات:

```typescript
// علاقة ManyToMany ضمنية
@OneToMany(() => Product, product => product.seller)
products: Product[];

// علاقة ذاتية (Self-referencing)
@ManyToOne(() => Category, category => category.subCategories)
parentCategory: Category;

@OneToMany(() => Category, category => category.parentCategory)
subCategories: Category[];
```

**الأهمية في الدفاع:** يظهر إتقانك لـ Database Design و ORM المتقدم.

### 3. الـ Idempotent Seeding الذكي (Smart Idempotent Seeding)

**الميزة الفنية:** نظام seeding ذكي يمكن تشغيله عدة مرات:

```typescript
// التحقق من وجود البيانات قبل الإضافة
let province = await provinceRepository.findOne({
  where: [{ name: provinceData.name }, { nameAr: provinceData.nameAr }],
});

if (!province) {
  province = provinceRepository.create({...});
  await provinceRepository.save(province);
} else {
  console.log(`⏭️  Province already exists: ${provinceData.name}`);
}
```

**الأهمية في الدفاع:** يظهر فهماً عميقاً لـ Data Migration و Database Seeding.

### 4. التعامل مع المعاملات الآمن (Safe Transaction Handling)

**الميزة الفنية:** استخدام Database Transactions لضمان التكامل:

```typescript
return await this.dataSource.transaction(async manager => {
  // قفل المنتج لمنع الشراء المتزامن
  const product = await manager.findOne(Product, {
    where: { productId },
    lock: { mode: 'pessimistic_write' }
  });

  // كل العمليات يجب أن تنجح أو تفشل معاً
  const transaction = await manager.save(transaction);
  await manager.update(Product, productId, {...});
});
```

**الأهمية في الدفاع:** يظهر فهماً لـ ACID Properties و Concurrency Control.

### 5. نظام المصادقة المتكامل (Integrated Authentication System)

**الميزة الفنية:** نظام مصادقة كامل يشمل:

- **JWT Tokens** مع انتهاء الصلاحية
- **Email Verification** مع أكواد OTP
- **Password Reset** مع روابط آمنة
- **Role-based Access Control** (Admin/User)
- **Guards** للحماية على مستوى الـ Controller

**الأهمية في الدفاع:** يظهر فهماً لـ Security Best Practices.

---

## خلاصة المشروع

هذا المشروع يعرض **ممارسات تطوير احترافية** باستخدام NestJS:

- **Architecture**: Modular Design مع فصل المسؤوليات
- **Database**: TypeORM مع علاقات معقدة
- **Security**: مصادقة وتفويض متكامل
- **Internationalization**: دعم ثنائي اللغة
- **Error Handling**: معالجة أخطاء شاملة
- **Documentation**: Swagger API Documentation
- **Testing**: هيكلية جاهزة للاختبار

المشروع جاهز تماماً للعرض في الدفاع ويعرض مهارات برمجية متقدمة في تطوير Backend باستخدام أحدث التقنيات.

</div>
