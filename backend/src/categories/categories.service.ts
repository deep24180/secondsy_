import { Injectable, NotFoundException } from '@nestjs/common';
import { CATEGORIES } from './categories.data';

@Injectable()
export class CategoriesService {
  findAll() {
    return CATEGORIES;
  }

  findSubcategoriesByCategoryId(categoryId: number) {
    const category = CATEGORIES.find((item) => item.id === categoryId);

    if (!category) {
      throw new NotFoundException(`Category with id ${categoryId} not found`);
    }

    return {
      categoryId: category.id,
      categoryName: category.name,
      subcategories: category.subcategories,
    };
  }

  findSubcategoriesByCategoryName(categoryName: string) {
    const normalizedName = categoryName.trim().toLowerCase();
    const category = CATEGORIES.find(
      (item) => item.name.trim().toLowerCase() === normalizedName,
    );

    if (!category) {
      throw new NotFoundException(
        `Category with name "${categoryName}" not found`,
      );
    }

    return {
      categoryId: category.id,
      categoryName: category.name,
      subcategories: category.subcategories,
    };
  }
}
