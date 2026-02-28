"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProductById } from "../../../lib/api/product";
import type { Product } from "../../../type";
import { Button } from "../../../components/ui/button";
import { UserContext } from "../../../context/user-context";
import {
  isProductSaved,
  removeSavedProduct,
  saveProductForLater,
} from "../../../lib/saved-products";

type PageProps = {
  params: { id: string };
};

const formatPriceINR = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export default function ProductDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { user, accessToken } = useContext(UserContext);
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savedForLater, setSavedForLater] = useState(false);
  const [saving, setSaving] = useState(false);

  const id = params?.id;

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        if (isMounted) {
          setProduct(data);
        }
      } catch {
        if (isMounted) {
          setError("Unable to load product details.");
        }
      }
    };

    if (id) fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const images = useMemo(() => product?.images || [], [product]);
  const deliveryText = useMemo(() => {
    if (!product) return "None";
    if (product.deliveryPickup && product.deliveryShipping) {
      return "Pickup and Shipping";
    }
    if (product.deliveryPickup) {
      return "Pickup";
    }
    if (product.deliveryShipping) {
      return "Shipping";
    }
    return "None";
  }, [product]);

  useEffect(() => {
    const loadSavedState = async () => {
      if (!id || !accessToken) {
        setSavedForLater(false);
        return;
      }

      const saved = await isProductSaved(id, accessToken);
      setSavedForLater(saved);
    };

    void loadSavedState();
  }, [id, accessToken]);

  const handleMessageSeller = () => {
    if (!product) return;

    const target = `/messages?productId=${encodeURIComponent(
      product.id,
    )}&sellerId=${encodeURIComponent(product.userId)}`;

    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(target)}`);
      return;
    }

    router.push(target);
  };

  const handleSaveForLater = async () => {
    if (!id) return;

    if (!user?.id || !accessToken) {
      router.push(
        `/auth/login?redirect=${encodeURIComponent(`/product/${id}`)}`,
      );
      return;
    }

    try {
      setSaving(true);
      if (savedForLater) {
        await removeSavedProduct(id, accessToken);
        setSavedForLater(false);
      } else {
        await saveProductForLater(id, accessToken);
        setSavedForLater(true);
      }
    } catch {
      setError("Unable to update saved item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen max-w-6xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to listings
        </Link>
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-slate-700">{error}</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen max-w-6xl mx-auto px-4 py-12">
        <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="aspect-square animate-pulse rounded-3xl bg-slate-200" />
          <div className="space-y-4">
            <div className="h-10 w-4/5 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-6 w-1/2 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:text-slate-900"
        >
          ← Back to listings
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="aspect-square bg-slate-100">
                {images.length > 0 ? (
                  <img
                    src={images[activeImage] || images[0]}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    No image available
                  </div>
                )}
              </div>
            </div>

            {images.length > 1 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Photos
                </p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border ${
                      index === activeImage
                        ? "border-blue-600 ring-2 ring-blue-100"
                        : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                {product.category}
                {product.subcategory ? ` • ${product.subcategory}` : ""}
              </p>
              <h1 className="mt-2 text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
                {product.title}
              </h1>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {formatPriceINR(Number(product.price) || 0)}
                </p>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {product.condition}
                </span>
              </div>

              <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Location:</span>{" "}
                  {product.location}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Delivery:</span>{" "}
                  {deliveryText}
                </p>
              </div>

              {Array.isArray(product.tags) && product.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  onClick={handleMessageSeller}
                  disabled={user?.id === product.userId}
                  className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {user?.id === product.userId
                    ? "Your Listing"
                    : "Message Seller"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSaveForLater}
                  disabled={saving}
                  className="h-11 rounded-lg border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {savedForLater ? "Saved for Later" : "Save for Later"}
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Seller Contact
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>{product.email}</p>
                <p>{product.phone}</p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Description
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
            {product.description}
          </p>
        </section>
      </div>
    </main>
  );
}
