"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getProductById } from "@/lib/api/product";
import type { Product } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: { id: string };
};

export default function ProductDetailPage({ params }: PageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const id = params?.id;

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        if (isMounted) {
          setProduct(data?.data || data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError("Unable to load product details.");
        }
      }
    };

    if (id) {
      fetchProduct();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const images = useMemo(() => product?.images || [], [product]);

  if (error) {
    return (
      <main className="min-h-screen max-w-5xl mx-auto w-full px-4 py-10">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          Back to listings
        </Link>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-slate-700">{error}</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen max-w-5xl mx-auto w-full px-4 py-10">
        <div className="h-10 w-40 rounded-md bg-slate-200 animate-pulse" />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="aspect-square w-full rounded-2xl bg-slate-200 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 rounded-md bg-slate-200 animate-pulse" />
            <div className="h-6 w-24 rounded-md bg-slate-200 animate-pulse" />
            <div className="h-20 w-full rounded-md bg-slate-200 animate-pulse" />
            <div className="h-12 w-40 rounded-md bg-slate-200 animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-5xl mx-auto w-full px-4 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
        Back to listings
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="aspect-square w-full overflow-hidden rounded-2xl border bg-slate-50">
            <img
              src={images[activeImage] || images[0]}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, index) => (
                <Button
                  key={`${img}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`aspect-square overflow-hidden rounded-lg border transition ${
                    index === activeImage
                      ? "border-slate-900 ring-2 ring-slate-900/20"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.title} ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {product.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500">{product.category}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">${product.price}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {product.condition}                                                             
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">
                Location
              </p>
              <p className="text-sm text-slate-700">{product.location}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">
                Delivery
              </p>
              <p className="text-sm text-slate-700">
                {product.deliveryPickup && "Pickup"}
                {product.deliveryPickup && product.deliveryShipping && " • "}
                {product.deliveryShipping && "Shipping"}
                {!product.deliveryPickup && !product.deliveryShipping && "None"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-slate-400">
              Description
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              {product.description}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-slate-400">
              contact
            </p>
            <div className="space-y-1 text-sm text-slate-700">
              <p>{product.email}</p>
              <p>{product.phone}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Message seller
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-400"
            >
              Save for later
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
