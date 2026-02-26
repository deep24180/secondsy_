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

  const clearAllFilters = () => {
    router.push(pathname);
  };

  if (isFetchingProducts) {
    return <PageLoader message="Loading listings..." />;
  }

  const hasActiveFilters =
    normalizedQuery || selectedCategory || selectedSubcategory || selectedTag;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_#eff6ff_28%,_#f8fafc_50%,_#ffffff_100%)]">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_20px_55px_-30px_rgba(30,64,175,0.35)] sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-200/45 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-cyan-100/55 blur-3xl" />

          <div className="relative z-10 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                Marketplace Dashboard
              </p>
              <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Discover smarter deals in one clean marketplace view
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                Browse by category, narrow by subcategory and tags, then find
                the right listing fast.
              </p>
            </div>
          </div>

          <div className="relative z-10 rounded-2xl border border-slate-200/80 bg-white/90 p-4 sm:p-6">
            <CategoriesSection />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.45)] lg:sticky lg:top-24">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Refine Results
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                  Filters
                </h2>
              </div>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Clear all
                </button>
              ) : null}
            </div>

            <div className="mt-5 space-y-5">
              {normalizedQuery ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Search
                  </p>
                  <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {query}
                  </span>
                </div>
              ) : null}

              {selectedCategory ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Category
                  </p>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                    {searchParams.get("category")}
                  </span>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-500">
                  Pick a category above to unlock subcategory and tag filters.
                </p>
              )}

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                    Subcategories
                  </p>
                  {selectedCategory && availableSubcategories.length > 0 ? (
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      {availableSubcategories.length}
                    </span>
                  ) : null}
                </div>

                {!selectedCategory ? (
                  <p className="text-xs text-slate-500">
                    Select a category first to view subcategories.
                  </p>
                ) : availableSubcategories.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No subcategories available for this category yet.
                  </p>
                ) : (
                  <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSubcategory) {
                          updateSubcategoryFilter(selectedSubcategory);
                        }
                      }}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        !selectedSubcategory
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      All
                    </button>
                    {availableSubcategories.map((subcategory) => (
                      <button
                        key={subcategory}
                        type="button"
                        onClick={() => updateSubcategoryFilter(subcategory)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
                          selectedSubcategory === subcategory
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {subcategory}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedCategory && availableTags.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => updateTagFilter(tag)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          selectedTag === tag
                            ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>

          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.45)] sm:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Fresh Listings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Updated marketplace view based on your selected filters.
                </p>
              </div>
              <p className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-600">
                {filteredProducts.length} matching item
                {filteredProducts.length === 1 ? "" : "s"}
              </p>
            </div>

            {hasActiveFilters ? (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {normalizedQuery ? (
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    Search: {query}
                  </span>
                ) : null}
                {selectedCategory ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                    Category: {searchParams.get("category")}
                  </span>
                ) : null}
                {selectedSubcategory ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                    Subcategory: {searchParams.get("subcategory")}
                  </span>
                ) : null}
                {selectedTag ? (
                  <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                    Tag: #{selectedTag}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
                  <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
