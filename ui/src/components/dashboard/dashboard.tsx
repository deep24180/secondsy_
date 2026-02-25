"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchContext } from "../../context/search-context";
import CategoriesSection from "../category/CategoriesSection";
import ProductCard, { Product } from "../product/ProductCard";
import { getProducts } from "../../lib/api/product";
import PageLoader from "../ui/page-loader";

const PRODUCTS_PER_PAGE = 8;

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
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
  const selectedSubcategory = (searchParams.get("subcategory") || "")
    .trim()
    .toLowerCase();
  const selectedTag = (searchParams.get("tag") || "").trim().toLowerCase();
  const filterKey = `${normalizedQuery}::${selectedCategory}::${selectedSubcategory}::${selectedTag}`;

  const categoryMatches = useCallback(
    (productCategory: string) =>
      selectedCategory
        ? productCategory === selectedCategory ||
          productCategory.includes(selectedCategory) ||
          selectedCategory.includes(productCategory)
        : true,
    [selectedCategory],
  );

  const productHasTag = (product: Product, tag: string) =>
    Array.isArray(product.tags)
      ? product.tags
          .map((item) => item.toLowerCase().trim())
          .includes(tag.toLowerCase())
      : false;

  const subcategoryMatches = useCallback(
    (productSubcategory: string) =>
      selectedSubcategory
        ? productSubcategory === selectedSubcategory ||
          productSubcategory.includes(selectedSubcategory) ||
          selectedSubcategory.includes(productSubcategory)
        : true,
    [selectedSubcategory],
  );

  const availableSubcategories = useMemo(() => {
    const subcategoriesSet = new Set<string>();

    products.forEach((product) => {
      const productCategory = product.category.toLowerCase();
      if (!categoryMatches(productCategory)) {
        return;
      }

      const normalizedSubcategory = product.subcategory.trim().toLowerCase();
      if (normalizedSubcategory) {
        subcategoriesSet.add(normalizedSubcategory);
      }
    });

    return Array.from(subcategoriesSet).sort((a, b) => a.localeCompare(b));
  }, [products, categoryMatches]);

  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();

    products.forEach((product) => {
      const productCategory = product.category.toLowerCase();
      if (!categoryMatches(productCategory)) {
        return;
      }

      if (!Array.isArray(product.tags)) {
        return;
      }

      product.tags.forEach((tag) => {
        const normalizedTag = tag.trim().toLowerCase();
        if (normalizedTag) {
          tagsSet.add(normalizedTag);
        }
      });
    });

    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
  }, [products, categoryMatches]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const productCategory = product.category.toLowerCase();
      const matchesCategory = categoryMatches(productCategory);
      const matchesSubcategory = subcategoryMatches(
        product.subcategory.toLowerCase(),
      );
      const matchesTag = selectedTag
        ? productHasTag(product, selectedTag)
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

      return matchesCategory && matchesSubcategory && matchesTag && searchMatches;
    });
  }, [
    products,
    normalizedQuery,
    selectedTag,
    categoryMatches,
    subcategoryMatches,
  ]);

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

  const updateTagFilter = (tag: string) => {
    const nextTag = tag.trim().toLowerCase();
    const params = new URLSearchParams(searchParams.toString());

    if (selectedTag === nextTag) {
      params.delete("tag");
    } else {
      params.set("tag", nextTag);
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const updateSubcategoryFilter = (subcategory: string) => {
    const nextSubcategory = subcategory.trim().toLowerCase();
    const params = new URLSearchParams(searchParams.toString());

    if (selectedSubcategory === nextSubcategory) {
      params.delete("subcategory");
    } else {
      params.set("subcategory", nextSubcategory);
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

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
                Find quality listings in secondsy
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

          {(normalizedQuery ||
            selectedCategory ||
            selectedSubcategory ||
            selectedTag) && (
            <div className="mb-6 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
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
                {selectedSubcategory ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    Subcategory: {searchParams.get("subcategory")}
                  </span>
                ) : null}
                {selectedTag ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    Tag: #{selectedTag}
                  </span>
                ) : null}
              </div>

              {selectedCategory && availableSubcategories.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {availableSubcategories.map((subcategory) => (
                    <button
                      key={subcategory}
                      type="button"
                      onClick={() => updateSubcategoryFilter(subcategory)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        selectedSubcategory === subcategory
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {subcategory}
                    </button>
                  ))}
                </div>
              ) : null}

              {selectedCategory && availableTags.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => updateTagFilter(tag)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        selectedTag === tag
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
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
