import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id/subcategories')
  findSubcategories(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findSubcategoriesByCategoryId(id);
  }

  @Get('name/:name/subcategories')
  findSubcategoriesByName(@Param('name') name: string) {
    return this.categoriesService.findSubcategoriesByCategoryName(name);
  }
}
