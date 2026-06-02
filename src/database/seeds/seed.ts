import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { Province } from '../../modules/provinces/entities/province.entity';
import { City } from '../../modules/provinces/entities/city.entity';
import { Category } from '../../modules/categories/entities/category.entity';

interface ProvinceData {
  name: string;
  nameAr: string;
  cities: { name: string; nameAr: string }[];
}

interface CategoryData {
  name: string;
  nameAr: string;
  description?: string;
  icon?: string;
  subcategories?: { name: string; nameAr: string; description?: string; icon?: string }[]; // 🎯 تم إضافة icon هنا للأقسام الفرعية
}

// 📍 1. مصفوفة المحافظات والمدن الكاملة
const provincesData: ProvinceData[] = [
  {
    name: 'Baghdad',
    nameAr: 'بغداد',
    cities: [
      { name: 'Baghdad', nameAr: 'بغداد' },
      { name: 'Kadhimiya', nameAr: 'الكاظمية' },
      { name: 'Sadr City', nameAr: 'مدينة الصدر' },
    ],
  },
  {
    name: 'Basra',
    nameAr: 'البصرة',
    cities: [
      { name: 'Basra', nameAr: 'البصرة' },
      { name: 'Al-Zubair', nameAr: 'الزبير' },
      { name: 'Umm Qasr', nameAr: 'أم قصر' },
    ],
  },
  {
    name: 'Najaf',
    nameAr: 'النجف',
    cities: [
      { name: 'Najaf', nameAr: 'النجف' },
      { name: 'Kufa', nameAr: 'الكوفة' },
    ],
  },
  {
    name: 'Karbala',
    nameAr: 'كربلاء',
    cities: [
      { name: 'Karbala', nameAr: 'كربلاء' },
      { name: 'Al-Hindiya', nameAr: 'الهندية' },
    ],
  },
  {
    name: 'Erbil',
    nameAr: 'أربيل',
    cities: [
      { name: 'Erbil', nameAr: 'أربيل' },
      { name: 'Shaqlawa', nameAr: 'شقلاوة' },
      { name: 'Soran', nameAr: 'سوران' },
    ],
  },
  {
    name: 'Sulaymaniyah',
    nameAr: 'السليمانية',
    cities: [
      { name: 'Sulaymaniyah', nameAr: 'السليمانية' },
      { name: 'Chamchamal', nameAr: 'جمجمال' },
      { name: 'Rania', nameAr: 'رانية' },
    ],
  },
  {
    name: 'Duhok',
    nameAr: 'دهوك',
    cities: [
      { name: 'Duhok', nameAr: 'دهوك' },
      { name: 'Zakho', nameAr: 'زاخو' },
      { name: 'Amedi', nameAr: 'عامدية' },
    ],
  },
  {
    name: 'Nineveh',
    nameAr: 'نينوى',
    cities: [
      { name: 'Mosul', nameAr: 'الموصل' },
      { name: 'Tal Afar', nameAr: 'تلعفر' },
      { name: 'Sinjar', nameAr: 'سنجار' },
    ],
  },
  {
    name: 'Kirkuk',
    nameAr: 'كركوك',
    cities: [
      { name: 'Kirkuk', nameAr: 'كركوك' },
      { name: 'Daquq', nameAr: 'داقوق' },
      { name: 'Hawija', nameAr: 'الحويجة' },
    ],
  },
  {
    name: 'Diyala',
    nameAr: 'ديالى',
    cities: [
      { name: 'Baqubah', nameAr: 'بعقوبة' },
      { name: 'Khalis', nameAr: 'خالص' },
      { name: 'Muqdadiyah', nameAr: 'المقدادية' },
    ],
  },
  {
    name: 'Anbar',
    nameAr: 'الأنبار',
    cities: [
      { name: 'Ramadi', nameAr: 'الرمادي' },
      { name: 'Fallujah', nameAr: 'الفلوجة' },
      { name: 'Haditha', nameAr: 'حديثة' },
    ],
  },
  {
    name: 'Babil',
    nameAr: 'بابل',
    cities: [
      { name: 'Hilla', nameAr: 'الحلة' },
      { name: 'Kufa', nameAr: 'الكوفة' },
      { name: 'Mahawil', nameAr: 'المحاويل' },
    ],
  },
  {
    name: 'Wasit',
    nameAr: 'واسط',
    cities: [
      { name: 'Kut', nameAr: 'الكوت' },
      { name: 'Al-Hayy', nameAr: 'الحي' },
      { name: 'Al-Aziziyah', nameAr: 'العزيزية' },
    ],
  },
  {
    name: 'Maysan',
    nameAr: 'ميسان',
    cities: [
      { name: 'Amarah', nameAr: 'العمارة' },
      { name: 'Ali Al-Gharbi', nameAr: 'علي الغربي' },
      { name: 'Majar Al-Kabir', nameAr: 'مجر الكبير' },
    ],
  },
  {
    name: 'Dhi Qar',
    nameAr: 'ذي قار',
    cities: [
      { name: 'Nasiriyah', nameAr: 'الناصرية' },
      { name: 'Al-Rifai', nameAr: 'الرفاعي' },
      { name: 'Al-Shatra', nameAr: 'الشطرة' },
    ],
  },
  {
    name: 'Al-Muthanna',
    nameAr: 'المثنى',
    cities: [
      { name: 'Samawah', nameAr: 'السماوة' },
      { name: 'Al-Rumaitha', nameAr: 'الرميثة' },
      { name: 'Al-Khidir', nameAr: 'الخضر' },
    ],
  },
  {
    name: 'Al-Qadisiyah',
    nameAr: 'القادسية',
    cities: [
      { name: 'Diwaniyah', nameAr: 'الديوانية' },
      { name: 'Hamza', nameAr: 'حمزة' },
      { name: 'Afak', nameAr: 'عفك' },
    ],
  },
  {
    name: 'Salah ad Din',
    nameAr: 'صلاح الدين',
    cities: [
      { name: 'Samarra', nameAr: 'سامراء' },
      { name: 'Tikrit', nameAr: 'تكريت' },
      { name: 'Baiji', nameAr: 'بيجي' },
      { name: 'Al-Shirqat', nameAr: 'الشرقاط' },
    ],
  },
];

// 🏷️ 2. مصفوفة الأقسام الرئيسية والفرعية مع ربط الصور الذكي بالسيرفر
const categoriesData: CategoryData[] = [
  {
    name: 'Electronics',
    nameAr: 'إلكترونيات',
    description: 'Electronic devices and accessories',
    icon: '/uploads/categories/electronics.jpg',
    subcategories: [
      { name: 'Mobile Phones', nameAr: 'هواتف وملحقات', icon: '/uploads/categories/phone.jpg' },
      { name: 'Laptops & Computers', nameAr: 'لابتوبات وكمبيوترات', icon: '/uploads/categories/labtop.jpg' },
      { name: 'Accessories', nameAr: 'إكسسوارات شاشات وأجهزة', icon: '/uploads/categories/mobility.jpg' },
      { name: 'Home Appliances', nameAr: 'اجهزة منزلية', icon: '/uploads/categories/dvicehome.jpg' }
    ]
  },
  {
    name: 'Fashion',
    nameAr: 'أزياء',
    description: 'Clothing, shoes and accessories',
    icon: '/uploads/categories/fashion.jpg',
    subcategories: [
      { name: 'Men', nameAr: 'رجالي', icon: '/uploads/categories/man.jpg' },
      { name: 'Women', nameAr: 'نسائي', icon: '/uploads/categories/weman.jpg' },
      { name: 'Shoes & Bags', nameAr: 'أحذية وحقائب', icon: '/uploads/categories/xy.jpg' },
      { name: 'Accessories', nameAr: 'إكسسوارات', icon: '/uploads/categories/mobility.jpg' }
    ]
  },
  {
    name: 'Beauty & Health',
    nameAr: 'جمال وصحة',
    description: 'Beauty and health products',
    icon: '/uploads/categories/beauty.jpg',
    subcategories: [
      { name: 'Cosmetics', nameAr: 'مستحضرات تجميل', icon: '/uploads/categories/tjmel.jpg' },
      { name: 'Perfumes', nameAr: 'عطور', icon: '/uploads/categories/ator.jpg' },
      { name: 'Beauty Devices', nameAr: 'أجهزة عناية', icon: '/uploads/categories/dvicepersonal.jpg' }
    ]
  },
  {
    name: 'Vehicles',
    nameAr: 'مركبات',
    description: 'Cars, motorcycles and parts',
    icon: '/uploads/categories/vehicles.jpg',
    subcategories: [
      { name: 'Cars', nameAr: 'سيارات مستعملة', icon: '/uploads/categories/camry.jpg' },
      { name: 'Motorcycles', nameAr: 'دراجات نارية', icon: '/uploads/categories/bicke.jpg' },
      { name: 'Spare Parts', nameAr: 'قطع غيار ', icon: '/uploads/categories/quta.jpg' },
      { name: 'Accessories', nameAr: 'اكسسوارات', icon: '/uploads/categories/mobility.jpg' }
    ]
  },
  {
    name: 'Furniture & Home',
    nameAr: 'أثاث وديكور',
    description: 'Furniture and home improvement',
    icon: '/uploads/categories/home.jpg',
    subcategories: [
      { name: 'Bedroom', nameAr: 'غرف نوم', icon: '/uploads/categories/room.jpg' },
      { name: 'Living Room', nameAr: 'غرف جلوس', icon: '/uploads/categories/room1.jpg' },
      { name: 'Office', nameAr: 'مكاتب وكراسي', icon: '/uploads/categories/mm.jpg' },
      { name: 'Decor', nameAr: 'ديكورات منزلية', icon: '/uploads/categories/mmm.jpg' }
    ]
  },
  {
    name: 'Tools & Hobbies',
    nameAr: 'أدوات وهوايات',
    description: 'Sports equipment and hobby items',
    icon: '/uploads/categories/sports.jpg',
    subcategories: [
      { name: 'Sports', nameAr: 'رياضة ولياقة', icon: '/uploads/categories/jem.jpg' },
      { name: 'Musical Instruments', nameAr: 'أدوات موسيقية', icon: '/uploads/categories/music.jpg' },
      { name: 'Games & Gifts', nameAr: 'ألعاب وهدايا', icon: '/uploads/categories/game.jpg' },
      { name: 'Books & Stationery', nameAr: 'كتب ومستلزمات دراسية', icon: '/uploads/categories/book.jpg' }
    ]
  },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('🌱 Starting database seeding...');

    // 📍 زراعة المحافظات والمدن
    console.log('📍 Seeding provinces and cities...');
    const provinceRepository = dataSource.getRepository(Province);
    const cityRepository = dataSource.getRepository(City);

    for (const provinceData of provincesData) {
      let province = await provinceRepository.findOne({
        where: [{ name: provinceData.name }, { nameAr: provinceData.nameAr }],
      });

      if (!province) {
        province = provinceRepository.create({
          name: provinceData.name,
          nameAr: provinceData.nameAr,
        });
        await provinceRepository.save(province);
        console.log(`✅ Created province: ${provinceData.name} (${provinceData.nameAr})`);
      } else {
        console.log(`⏭️  Province already exists: ${provinceData.name} (${provinceData.nameAr})`);
      }

      for (const cityData of provinceData.cities) {
        const existingCity = await cityRepository.findOne({
          where: [{ name: cityData.name }, { nameAr: cityData.nameAr }],
        });

        if (!existingCity) {
          const targetProvinceId = province.provinceId; 
          const city = cityRepository.create({
            name: cityData.name,
            nameAr: cityData.nameAr,
            provinceId: targetProvinceId,
          });
          await cityRepository.save(city);
          console.log(`  ✅ Created city: ${cityData.name} (${cityData.nameAr})`);
        } else {
          console.log(`  ⏭️  City already exists: ${cityData.name} (${cityData.nameAr})`);
        }
      }
    }

    // 🏷️ زراعة الأقسام الرئيسية والأقسام الفرعية التابعة لها
    console.log('🏷️  Seeding categories and subcategories...');
    const categoryRepository = dataSource.getRepository(Category);

    for (const categoryData of categoriesData) {
      let existingCategory = await categoryRepository.findOne({
        where: [{ name: categoryData.name }, { nameAr: categoryData.nameAr }],
      });

      if (!existingCategory) {
        existingCategory = categoryRepository.create({
          name: categoryData.name,
          nameAr: categoryData.nameAr,
          description: categoryData.description,
          icon: categoryData.icon,
          isActive: true,
          displayOrder: 0,
        });
        existingCategory = await categoryRepository.save(existingCategory);
        console.log(`✅ Created Main Category: ${categoryData.name} (${categoryData.nameAr})`);
      } else {
        console.log(`⏭️  Main Category already exists: ${categoryData.name} (${categoryData.nameAr})`);
      }

      if (categoryData.subcategories && categoryData.subcategories.length > 0) {
        for (const subData of categoryData.subcategories) {
          const existingSub = await categoryRepository.findOne({
            where: [{ name: subData.name }, { nameAr: subData.nameAr }],
          });

          if (!existingSub) {
            const targetCategoryId = existingCategory.categoryId; 
            const sub = categoryRepository.create({
              name: subData.name,
              nameAr: subData.nameAr,
              description: subData.description,
              icon: subData.icon, // 🎯 تم التعديل لحفظ مسار أيقونة القسم الفرعي في قاعدة البيانات
              parentId: targetCategoryId, 
              isActive: true,
              displayOrder: 0,
            });
            await categoryRepository.save(sub);
            console.log(`  ✅ Created Subcategory: ${subData.name} (${subData.nameAr})`);
          } else {
            console.log(`  ⏭️  Subcategory already exists: ${subData.name} (${subData.nameAr})`);
          }
        }
      }
    }

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seed()
  .then(() => {
    console.log('🌱 Seeding process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });