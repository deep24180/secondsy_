"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchContext } from "../../context/search-context";
import CategoriesSection from "../category/CategoriesSection";
import { getProducts } from "../../lib/api/product";
import PageLoader from "../ui/page-loader";
import { Product } from "@/type";
import ProductCard from "../product/ProductCard";

const PRODUCTS_PER_PAGE = 8;

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { query } = useContext(SearchContext);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetchingProducts, setIsFetchingProducts] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalMatching, setTotalMatching] = useState(0);

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const previousFilterKeyRef = useRef("");
  const normalizedQuery = query.trim().toLowerCase();
  const selectedCategoryParam = (searchParams.get("category") || "").trim();
  const selectedSubcategoryParam = (searchParams.get("subcategory") || "").trim();
  const selectedTagParam = (searchParams.get("tag") || "").trim();

  const selectedCategory = selectedCategoryParam.toLowerCase();
  const selectedSubcategory = selectedSubcategoryParam.toLowerCase();
  const selectedTag = selectedTagParam.toLowerCase();
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
    const subcategoriesMap = new Map<string, string>();

    products.forEach((product) => {
      const productCategory = product.category.toLowerCase();
      if (!categoryMatches(productCategory)) {
        return;
      }

      const rawSubcategory = product.subcategory.trim();
      const normalizedSubcategory = rawSubcategory.toLowerCase();
      if (normalizedSubcategory && !subcategoriesMap.has(normalizedSubcategory)) {
        subcategoriesMap.set(normalizedSubcategory, rawSubcategory);
      }
    });

    return Array.from(subcategoriesMap.values()).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [products, categoryMatches]);

  const availableTags = useMemo(() => {
    const tagsMap = new Map<string, string>();

    products.forEach((product) => {
      const productCategory = product.category.toLowerCase();
      if (!categoryMatches(productCategory)) {
        return;
      }

      if (!Array.isArray(product.tags)) {
        return;
      }

      product.tags.forEach((tag) => {
        const rawTag = tag.trim();
        const normalizedTag = rawTag.toLowerCase();
        if (normalizedTag && !tagsMap.has(normalizedTag)) {
          tagsMap.set(normalizedTag, rawTag);
        }
      });
    });

    return Array.from(tagsMap.values()).sort((a, b) => a.localeCompare(b));
  }, [products, categoryMatches]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const isInactive =
        Boolean(product.sold) ||
        product.status === "Sold" ||
        product.status === "Expired";
      if (isInactive) {
        return false;
      }

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

      return (
        matchesCategory && matchesSubcategory && matchesTag && searchMatches
      );
    });
  }, [
    products,
    normalizedQuery,
    selectedTag,
    categoryMatches,
    subcategoryMatches,
  ]);

  useEffect(() => {
    let mounted = true;

    const hasFilterChanged = previousFilterKeyRef.current !== filterKey;
    if (hasFilterChanged && page !== 1) {
      setPage(1);
      return;
    }

    previousFilterKeyRef.current = filterKey;
    const isFirstPaintLoad = page === 1 && products.length === 0;

    const fetchProducts = async () => {
      if (isFirstPaintLoad) {
        setIsFetchingProducts(true);
      } else if (page > 1) {
        setIsLoadingMore(true);
      }

      try {
        const response = await getProducts({
          page,
          limit: PRODUCTS_PER_PAGE,
          q: normalizedQuery || undefined,
          category: selectedCategoryParam || undefined,
          subcategory: selectedSubcategoryParam || undefined,
          tag: selectedTagParam || undefined,
          excludeStatus: "Sold,Expired",
        });

        if (!mounted) return;

        setProducts((prev) =>
          page === 1 ? response.data : [...prev, ...response.data],
        );
        setHasNextPage(response.meta.hasNextPage);
        setTotalMatching(response.meta.total);
      } catch (error) {
        if (mounted) {
          console.error("Error fetching products:", error);
        }
      } finally {
        if (!mounted) return;
        if (isFirstPaintLoad) {
          setIsFetchingProducts(false);
        } else if (page > 1) {
          setIsLoadingMore(false);
        }
      }
    };

    void fetchProducts();

    return () => {
      mounted = false;
    };
  }, [
    page,
    filterKey,
    normalizedQuery,
    selectedCategory,
    selectedSubcategory,
    selectedTag,
    selectedCategoryParam,
    selectedSubcategoryParam,
    selectedTagParam,
  ]);

  useEffect(() => {
    if (!loaderRef.current || !hasNextPage || isLoadingMore || isFetchingProducts) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (firstEntry.isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 },
    );

    observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isLoadingMore, isFetchingProducts]);

  const updateTagFilter = (tag: string) => {
    const nextTag = tag.trim();
    const nextTagNormalized = nextTag.toLowerCase();
    const params = new URLSearchParams(searchParams.toString());

    if (selectedTag === nextTagNormalized) {
      params.delete("tag");
    } else {
      params.set("tag", nextTag);
    }

    const queryString = params.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  const updateSubcategoryFilter = (subcategory: string) => {
    const nextSubcategory = subcategory.trim();
    const nextSubcategoryNormalized = nextSubcategory.toLowerCase();
    const params = new URLSearchParams(searchParams.toString());

    if (selectedSubcategory === nextSubcategoryNormalized) {
      params.delete("subcategory");
    } else {
      params.set("subcategory", nextSubcategory);
    }

    const queryString = params.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  const clearAllFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  if (isFetchingProducts && products.length === 0) {
    return <PageLoader message="Loading listings..." />;
  }

  const hasActiveFilters =
    normalizedQuery || selectedCategoryParam || selectedSubcategoryParam || selectedTagParam;
  const selectedCategoryLabel = selectedCategoryParam;
  const selectedSubcategoryLabel = selectedSubcategoryParam;
  const activeFilterCount = [
    normalizedQuery,
    selectedCategoryParam,
    selectedSubcategoryParam,
    selectedTagParam,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,_#f8fafc_0%,_#eef2ff_50%,_#f8fafc_100%)]">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(130deg,_#0f172a_0%,_#1e293b_42%,_#1d4ed8_100%)] p-6 text-white shadow-[0_30px_70px_-35px_rgba(15,23,42,0.75)] sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-white/10 -3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-blue-300/25 -3xl" />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/90">
                Main Dashboard
              </p>
              <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Find listings faster with focused filters and cleaner browsing
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-100/90 sm:text-base">
                Explore categories, apply smart filter chips, and scan matching
                products in one place.
              </p>
              <Link
                href="/sell-item"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-white/20 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Sell Item
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-">
                <p className="text-[11px] uppercase tracking-[0.16em] text-blue-100/90">
                  Total
                </p>
                <p className="mt-1 text-2xl font-semibold">{totalMatching}</p>
                <p className="text-xs text-slate-200">Matching filters</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-">
                <p className="text-[11px] uppercase tracking-[0.16em] text-blue-100/90">
                  Loaded
                </p>
                <p className="mt-1 text-2xl font-semibold">{products.length}</p>
                <p className="text-xs text-slate-200">In this view</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-">
                <p className="text-[11px] uppercase tracking-[0.16em] text-blue-100/90">
                  Remaining
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {Math.max(totalMatching - products.length, 0)}
                </p>
                <p className="text-xs text-slate-200">To load</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-">
                <p className="text-[11px] uppercase tracking-[0.16em] text-blue-100/90">
                  Active Filters
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {activeFilterCount}
                </p>
                <p className="text-xs text-slate-200">Current context</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_22px_60px_-45px_rgba(15,23,42,0.55)] sm:p-6">
          <CategoriesSection />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_22px_50px_-40px_rgba(15,23,42,0.45)] lg:sticky lg:top-24">
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
                    {selectedCategoryLabel}
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
                          selectedSubcategory === subcategory.toLowerCase()
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
                          selectedTag === tag.toLowerCase()
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

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_22px_50px_-40px_rgba(15,23,42,0.45)] sm:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Fresh Listings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Updated marketplace view based on your selected filters and
                  search context.
                </p>
              </div>
              <p className="rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
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
                    Category: {selectedCategoryLabel}
                  </span>
                ) : null}
                {selectedSubcategory ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                    Subcategory: {selectedSubcategoryLabel}
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
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 ? (
              <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No listings found with the selected filters.
              </p>
            ) : null}

            {hasNextPage && (
              <div
                ref={loaderRef}
                className="mt-12 flex h-20 items-center justify-center"
              >
                {isLoadingMore && (
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
