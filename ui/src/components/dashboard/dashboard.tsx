"use client";

import { use, useEffect, useRef, useState } from "react";

import CategoriesSection from "../category/CategoriesSection";
import ProductCard, { Product } from "../product/ProductCard";
import { getProducts } from "../../lib/api/product";

const PRODUCTS_PER_PAGE = 8

export default function Dashboard() {
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const visibleProducts = products.slice(0, visibleCount);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await getProducts();
        console.log(products);
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
          visibleCount < products.length
        ) {
          setIsLoading(true);

          // simulate API delay
          setTimeout(() => {
            setVisibleCount((prev) => prev + PRODUCTS_PER_PAGE);
            setIsLoading(false);
          }, 1000);
        }
      },
      { threshold: 1 },
    );

    observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [isLoading, visibleCount]);
  console.log(products);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <CategoriesSection />

        {/* Products */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Recent Listings</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Loader */}
          {visibleCount < products.length && (
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
