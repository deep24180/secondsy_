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
        ? [
            product.title,
            product.category,
            product.subcategory,
            product.location,
          ]
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
              [filterKey]:
                (prev[filterKey] ?? PRODUCTS_PER_PAGE) + PRODUCTS_PER_PAGE,
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.55)] backdrop-blur sm:p-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Marketplace Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Find quality listings in seconds
              </h1>
            </div>
            <p className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600">
              {products.length} total listings
            </p>
          </div>
          <CategoriesSection />
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.45)] sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Recent Listings
            </h2>
            <p className="text-sm text-slate-500">
              {filteredProducts.length} matching item
              {filteredProducts.length === 1 ? "" : "s"}
            </p>
          </div>

          {(normalizedQuery || selectedCategory) && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {normalizedQuery ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Search: {query}
                </span>
              ) : null}
              {selectedCategory ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Category: {searchParams.get("category")}
                </span>
              ) : null}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No listings found with the selected filters.
            </p>
          ) : null}

          {visibleCount < filteredProducts.length && (
            <div
              ref={loaderRef}
              className="mt-12 flex h-20 items-center justify-center"
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
