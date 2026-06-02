import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/categories', // المجلد الذي ستحفظ فيه صور الأقسام
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `cat-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  @ApiOperation({ summary: 'Create a new category (requires authentication)' })
  @ApiResponse({ status: 201, description: 'Category successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Parent category not found' })
  create(
    @Body() createCategoryDto: any, // استخدمنا any لأن البيانات ستأتي كـ FormData
    @UploadedFile() file: Express.Multer.File
  ) {
    // إذا تم رفع صورة، نقوم بتخزين مسارها في حقل icon الموجود في الداتا بيز مسبقاً
    if (file) {
      createCategoryDto.icon = `/uploads/categories/${file.filename}`;
    }

    // الـ FormData ترسل الأرقام كنصوص، لذلك نعيد تحويل parentId إلى رقم إذا كان قسماً فرعياً
    if (createCategoryDto.parentId && createCategoryDto.parentId !== 'null') {
      createCategoryDto.parentId = Number(createCategoryDto.parentId);
    } else {
      createCategoryDto.parentId = null;
    }

    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all main categories with their subcategories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async findAll() {
    const result = await this.categoriesService.findAll();
    //console.log("BACKEND RESPONSE TO FRONTEND:", result);
    return result;
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get complete category tree structure' })
  @ApiResponse({ status: 200, description: 'Category tree retrieved successfully' })
  getCategoryTree() {
    return this.categoriesService.getCategoryTree();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single category by ID with its subcategories and products' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(@Param('id') id: number) {
    return this.categoriesService.findOne(id);
  }

  @Get(':id/subcategories')
  @ApiOperation({ summary: 'Get all subcategories of a parent category' })
  @ApiResponse({ status: 200, description: 'Subcategories retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Parent category not found' })
  findSubcategories(@Param('id') id: number) {
    return this.categoriesService.findSubCategories(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a category (requires authentication)' })
  @ApiResponse({ status: 200, description: 'Category successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot be its own parent' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  update(@Param('id') id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a category (requires authentication)' })
  @ApiResponse({ status: 200, description: 'Category successfully deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete - has subcategories or products' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  remove(@Param('id') id: number) {
    return this.categoriesService.remove(id);
  }
}