import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) { }

  async create(createCategoryDto: CreateCategoryDto) {

    // check if category already exists
    const existing = await this.categoryRepository.findOne({ where: { name: createCategoryDto.name } });
    if (existing) throw new BadRequestException('Category with this name already exists');

    // If parentId is provided, verify it exists
    if (createCategoryDto.parentId) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { categoryId: createCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async findAll() {
    // Only fetch root categories (parent_id IS NULL) with their subCategories
    const mainCategories = await this.categoryRepository.find({
      where: { parentId: IsNull() },
      relations: ['subCategories'],
      order: { name: 'ASC' },
    });

    //console.log("RAW MAIN CATEGORIES FROM DB:", JSON.stringify(mainCategories, null, 2));

    // Format for frontend consumption with exact field names
    const formattedCategories = mainCategories.map(category => ({
      id: category.categoryId,
      name: category.name,       // Must be EXACTLY 'name'
      name_ar: category.nameAr,  // Must be EXACTLY 'name_ar'
      subs: category.subCategories ? category.subCategories.map(sub => ({
        id: sub.categoryId,
        name: sub.name,
        name_ar: sub.nameAr
      })) : []
    }));

    //console.log("BACKEND CATEGORIES EXPORT:", formattedCategories);
    return formattedCategories;
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { categoryId: id },
      relations: ['subCategories', 'parentCategory', 'products'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findSubCategories(parentId: number) {
    const parentCategory = await this.categoryRepository.findOne({
      where: { categoryId: parentId },
    });

    if (!parentCategory) {
      throw new NotFoundException('Parent category not found');
    }

    return await this.categoryRepository.find({
      where: { parentId: parentId },
      order: { name: 'ASC' },
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    // Prevent category from being its own parent
    if (updateCategoryDto.parentId === id) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    // If parentId is being updated, verify it exists
    if (updateCategoryDto.parentId) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { categoryId: updateCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async remove(id: number) {
    const category = await this.findOne(id);

    // Check if category has subCategories
    if (category.subCategories && category.subCategories.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with subCategories. Delete subCategories first.',
      );
    }

    // Check if category has products
    if (category.subCategories && category.subCategories.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with products. Move or delete products first.',
      );
    }

    await this.categoryRepository.remove(category);
    return { message: 'Category deleted successfully' };
  }

  async getCategoryTree() {
    // Get all main categories with nested subCategories
    const mainCategories = await this.categoryRepository.find({
      where: { parentId: null },
      relations: ['subCategories'],
      order: { name: 'ASC' },
    });

    return mainCategories;
  }
}