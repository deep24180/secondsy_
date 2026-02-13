"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { categories } from "../../data/categories";
import CategoryCard from "./CategoryCard";

export default function CategoriesSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = (searchParams.get("category") || "").trim();

  const updateCategory = (categoryName: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (activeCategory.toLowerCase() === categoryName.toLowerCase()) {
      params.delete("category");
    } else {
      params.set("category", categoryName);
    }

    const nextQuery = params.toString();
    router.replace(nextQuery ? `/?${nextQuery}` : "/");
  };

  return (
    <section className="mb-10">
      <h2 className="mb-6 text-lg font-bold">Explore Categories</h2>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            {...cat}
            isActive={activeCategory.toLowerCase() === cat.name.toLowerCase()}
            onClick={() => updateCategory(cat.name)}
          />
        ))}
      </div>
    </section>
  );
}
