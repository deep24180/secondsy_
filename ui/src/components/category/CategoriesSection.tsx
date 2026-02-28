"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { categories as fallbackCategories } from "../../data/categories";
import type { Category } from "../../type";
import { getCategories } from "../../lib/api/category";
import CategoryCard from "./CategoryCard";

export default function CategoriesSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const activeCategory = (searchParams.get("category") || "").trim();
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);

  useEffect(() => {
    const loadCategories = async () => {
      const data = await getCategories();
      setCategories(data);
    };

    loadCategories();
  }, []);

  const updateCategory = (categoryName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const isSameCategory =
      activeCategory.toLowerCase() === categoryName.toLowerCase();

    if (isSameCategory) {
      params.delete("category");
    } else {
      params.set("category", categoryName);
    }
    // Category changes should reset dependent filters.
    params.delete("subcategory");
    params.delete("tag");

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  const selectAllCategories = () => {
    const params = new URLSearchParams(searchParams.toString());
    const hadCategoryFilters =
      params.has("category") || params.has("subcategory") || params.has("tag");

    if (!hadCategoryFilters) {
      return;
    }

    params.delete("category");
    params.delete("subcategory");
    params.delete("tag");

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const amount = Math.round(sliderRef.current.clientWidth * 0.8);
    sliderRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Browse
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Explore Categories
          </h2>
        </div>
        <p className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
          {categories.length + 1} options
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => scrollCategories("left")}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
          aria-label="Scroll categories left"
        >
          <span className="material-symbols-outlined text-[20px]">
            chevron_left
          </span>
        </button>

        <div
          ref={sliderRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="w-[170px] shrink-0 snap-start">
            <CategoryCard
              name="All Categories"
              icon="apps"
              isActive={!activeCategory}
              onClick={selectAllCategories}
            />
          </div>
          {categories.map((cat) => (
            <div key={cat.id} className="w-[170px] shrink-0 snap-start">
              <CategoryCard
                {...cat}
                isActive={activeCategory.toLowerCase() === cat.name.toLowerCase()}
                onClick={() => updateCategory(cat.name)}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollCategories("right")}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
          aria-label="Scroll categories right"
        >
          <span className="material-symbols-outlined text-[20px]">
            chevron_right
          </span>
        </button>
      </div>
    </section>
  );
}
