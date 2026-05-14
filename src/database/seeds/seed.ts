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
}

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
    ],
  },
];

const categoriesData: CategoryData[] = [
  {
    name: 'Electronics',
    nameAr: 'إلكترونيات',
    description: 'Electronic devices and accessories',
    icon: 'electronics',
  },
  {
    name: 'Fashion',
    nameAr: 'أزياء',
    description: 'Clothing, shoes and accessories',
    icon: 'fashion',
  },
  {
    name: 'Real Estate',
    nameAr: 'عقارات',
    description: 'Properties for sale and rent',
    icon: 'real-estate',
  },
  {
    name: 'Vehicles',
    nameAr: 'مركبات',
    description: 'Cars, motorcycles and parts',
    icon: 'vehicles',
  },
  {
    name: 'Home & Garden',
    nameAr: 'المنزل والحديقة',
    description: 'Furniture and home improvement',
    icon: 'home',
  },
  {
    name: 'Jobs',
    nameAr: 'وظائف',
    description: 'Employment opportunities',
    icon: 'jobs',
  },
  {
    name: 'Services',
    nameAr: 'خدمات',
    description: 'Professional and personal services',
    icon: 'services',
  },
  {
    name: 'Sports & Hobbies',
    nameAr: 'رياضة وهوايات',
    description: 'Sports equipment and hobby items',
    icon: 'sports',
  },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('🌱 Starting database seeding...');

    // Seed Provinces and Cities
    console.log('📍 Seeding provinces and cities...');
    const provinceRepository = dataSource.getRepository(Province);
    const cityRepository = dataSource.getRepository(City);

    for (const provinceData of provincesData) {
      // Check if province already exists
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

      // Seed cities for this province
      for (const cityData of provinceData.cities) {
        const existingCity = await cityRepository.findOne({
          where: [{ name: cityData.name }, { nameAr: cityData.nameAr }],
        });

        if (!existingCity) {
          const city = cityRepository.create({
            name: cityData.name,
            nameAr: cityData.nameAr,
            provinceId: province.provinceId,
          });
          await cityRepository.save(city);
          console.log(`  ✅ Created city: ${cityData.name} (${cityData.nameAr})`);
        } else {
          console.log(`  ⏭️  City already exists: ${cityData.name} (${cityData.nameAr})`);
        }
      }
    }

    // Seed Categories
    console.log('🏷️  Seeding categories...');
    const categoryRepository = dataSource.getRepository(Category);

    for (const categoryData of categoriesData) {
      const existingCategory = await categoryRepository.findOne({
        where: [{ name: categoryData.name }, { nameAr: categoryData.nameAr }],
      });

      if (!existingCategory) {
        const category = categoryRepository.create({
          name: categoryData.name,
          nameAr: categoryData.nameAr,
          description: categoryData.description,
          icon: categoryData.icon,
          isActive: true,
          displayOrder: 0,
        });
        await categoryRepository.save(category);
        console.log(`✅ Created category: ${categoryData.name} (${categoryData.nameAr})`);
      } else {
        console.log(`⏭️  Category already exists: ${categoryData.name} (${categoryData.nameAr})`);
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

// Run the seed function
seed()
  .then(() => {
    console.log('🌱 Seeding process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
