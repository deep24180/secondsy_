"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import CategoriesSection from "../category/CategoriesSection";
import ProductCard, { Product } from "../product/ProductCard";
import { getProducts } from "../../lib/api/product";

const PRODUCTS_PER_PAGE = 8;

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [visibleCountByFilter, setVisibleCountByFilter] = useState<
    Record<string, number>
  >({});

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const selectedCategory = (searchParams.get("category") || "")
    .trim()
    .toLowerCase();
  const filterKey = `${query}::${selectedCategory}`;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const productCategory = product.category.toLowerCase();
      const categoryMatches = selectedCategory
        ? productCategory === selectedCategory ||
          productCategory.includes(selectedCategory) ||
          selectedCategory.includes(productCategory)
        : true;
      const searchMatches = query
        ? [product.title, product.category, product.subcategory, product.location]
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;

      return categoryMatches && searchMatches;
    });
  }, [products, query, selectedCategory]);

  const visibleCount = visibleCountByFilter[filterKey] ?? PRODUCTS_PER_PAGE;
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await getProducts();
        setProducts(products);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (
          firstEntry.isIntersecting &&
          !isLoading &&
          visibleCount < filteredProducts.length
        ) {
          setIsLoading(true);

          // simulate API delay
          setTimeout(() => {
            setVisibleCountByFilter((prev) => ({
              ...prev,
              [filterKey]: (prev[filterKey] ?? PRODUCTS_PER_PAGE) + PRODUCTS_PER_PAGE,
            }));
            setIsLoading(false);
          }, 1000);
        }
      },
      { threshold: 1 },
    );

    observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [isLoading, visibleCount, filteredProducts.length, filterKey]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <CategoriesSection />

        {/* Products */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Recent Listings</h2>
          {query ? (
            <p className="mb-6 text-sm text-slate-500">
              Showing results for: {searchParams.get("q")}
            </p>
          ) : null}
          {selectedCategory ? (
            <p className="mb-6 text-sm text-slate-500">
              Selected category: {searchParams.get("category")}
            </p>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <p className="mt-8 text-sm text-slate-500">
              No listings found with the selected filters.
            </p>
          ) : null}

          {/* Loader */}
          {visibleCount < filteredProducts.length && (
            <div
              ref={loaderRef}
              className="flex justify-center items-center mt-12 h-20"
            >
              {isLoading && (
                <span className="h-8 w-8 rounded-full border-4 border-slate-300 border-t-primary animate-spin" />
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
