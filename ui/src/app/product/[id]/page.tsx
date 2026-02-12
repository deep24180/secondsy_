"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProductById } from "../../../lib/api/product";
import type { Product } from "../../../components/product/ProductCard";
import { Button } from "../../../components/ui/button";
import { UserContext } from "../../../context/user-context";

type PageProps = {
  params: { id: string };
};

export default function ProductDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { user } = useContext(UserContext);
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
    return <main className="min-h-screen max-w-6xl mx-auto px-4 py-12" />;
  }

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to listings
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        {/* IMAGE SECTION */}
        <div className="space-y-5">
          <div className="aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-lg">
            <img
              src={images[activeImage] || images[0]}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`aspect-square overflow-hidden rounded-xl border transition-all ${
                    index === activeImage
                      ? "border-black ring-2 ring-black/30"
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
          )}
        </div>

        {/* PRODUCT DETAILS */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              {product.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500">{product.category}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-extrabold text-slate-900">
              ${product.price}
            </span>
            <span className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold text-emerald-700">
              {product.condition}
            </span>
          </div>

          <div className="grid gap-4 rounded-3xl border bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Location
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {product.location}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Delivery
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {product.deliveryPickup && "Pickup"}
                {product.deliveryPickup && product.deliveryShipping && " • "}
                {product.deliveryShipping && "Shipping"}
                {!product.deliveryPickup && !product.deliveryShipping && "None"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Description
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              {product.description}
            </p>
          </div>

          <div className="rounded-3xl border bg-slate-50 p-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Contact
            </p>
            <p className="text-sm text-slate-700">{product.email}</p>
            <p className="text-sm text-slate-700">{product.phone}</p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button
              onClick={handleMessageSeller}
              disabled={user?.id === product.userId}
              className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Message Seller
            </Button>

            <Button
              variant="outline"
              className="rounded-xl px-6 py-3 text-sm font-semibold hover:bg-slate-100"
            >
              Save for Later
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
