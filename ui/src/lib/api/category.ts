import { categories as fallbackCategories, type Category } from "../../data/categories";
import { API_URL } from "./user";

export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await fetch(`${API_URL}/categories`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return Array.isArray(data) ? data : fallbackCategories;
  } catch (error) {
    console.error("Error while fetching categories:", error);
    return fallbackCategories;
  }
};
