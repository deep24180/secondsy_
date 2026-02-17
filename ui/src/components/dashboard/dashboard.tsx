"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchContext } from "../../context/search-context";
import CategoriesSection from "../category/CategoriesSection";
import ProductCard, { Product } from "../product/ProductCard";
import { getProducts } from "../../lib/api/product";
import PageLoader from "../ui/page-loader";

const PRODUCTS_PER_PAGE = 8;

export default function Dashboard() {
  const searchParams = useSearchParams();
  const { query } = useContext(SearchContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProducts, setIsFetchingProducts] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [visibleCountByFilter, setVisibleCountByFilter] = useState<
    Record<string, number>
  >({});

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const selectedCategory = (searchParams.get("category") || "")
    .trim()
    .toLowerCase();
  const filterKey = `${normalizedQuery}::${selectedCategory}`;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const productCategory = product.category.toLowerCase();
      const categoryMatches = selectedCategory
        ? productCategory === selectedCategory ||
          productCategory.includes(selectedCategory) ||
          selectedCategory.includes(productCategory)
        : true;
      const searchMatches = normalizedQuery
        ? [product.title, product.category, product.subcategory, product.location]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        : true;

      return categoryMatches && searchMatches;
    });
  }, [products, normalizedQuery, selectedCategory]);

  const visibleCount = visibleCountByFilter[filterKey] ?? PRODUCTS_PER_PAGE;
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsFetchingProducts(true);
      try {
        const products = await getProducts();
        setProducts(products);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsFetchingProducts(false);
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

  if (isFetchingProducts) {
    return <PageLoader message="Loading listings..." />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <CategoriesSection />

        {/* Products */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Recent Listings</h2>
          {normalizedQuery ? (
            <p className="mb-6 text-sm text-slate-500">
              Showing results for: {query}
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
