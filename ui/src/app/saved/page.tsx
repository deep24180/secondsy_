"use client";

import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import PageLoader from "../../components/ui/page-loader";
import { UserContext } from "../../context/user-context";
import {
  getSavedProducts,
  removeSavedProduct,
  SavedProduct,
  SAVED_PRODUCTS_UPDATED_EVENT,
} from "../../lib/saved-products";

type SavedItem = Pick<
  SavedProduct,
  "id" | "title" | "price" | "images" | "location"
> & {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: string;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export default function SavedPage() {
  const router = useRouter();
  const { user, loading, accessToken } = useContext(UserContext);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapSavedItems = (savedProducts: SavedProduct[]) => {
    return savedProducts.map((product) => ({
      id: product.id,
      title: product.title,
      price: Number(product.price) || 0,
      images: Array.isArray(product.images) ? product.images : [],
      location: product.location || "",
    }));
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent("/saved")}`);
    }
  }, [loading, user, router]);

  useEffect(() => {
    const loadSavedItems = async () => {
      if (!user?.id || !accessToken) {
        setSavedItems([]);
        setLoadingSaved(false);
        return;
      }

      setLoadingSaved(true);
      setError(null);

      try {
        const savedProducts = await getSavedProducts(accessToken);
        setSavedItems(mapSavedItems(savedProducts));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load saved items.",
        );
      } finally {
        setLoadingSaved(false);
      }
    };

    void loadSavedItems();
  }, [user?.id, accessToken]);

  useEffect(() => {
    if (!user?.id || !accessToken) return;

    const syncSavedItems = async () => {
      try {
        const savedProducts = await getSavedProducts(accessToken);
        setSavedItems(mapSavedItems(savedProducts));
      } catch {
        setSavedItems([]);
      }
    };

    window.addEventListener(SAVED_PRODUCTS_UPDATED_EVENT, syncSavedItems);
    return () => {
      window.removeEventListener(SAVED_PRODUCTS_UPDATED_EVENT, syncSavedItems);
    };
  }, [user?.id, accessToken]);

  const handleRemove = async (id: string) => {
    if (!accessToken) return;
    await removeSavedProduct(id, accessToken);
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (loading || !user) {
    return <PageLoader message="Checking account..." />;
  }

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-4 py-8 sm:py-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold">Saved for Later</h1>
        <p className="text-sm text-slate-500">
          Products you bookmarked to review later.
        </p>
      </div>

      {loadingSaved && (
        <div className="mt-6 rounded-xl border bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading saved items...
        </div>
      )}

      {!loadingSaved && error && (
        <div className="mt-6 rounded-xl border bg-white p-6 text-sm text-red-600 shadow-sm">
          {error}
        </div>
      )}

      {!loadingSaved && !error && savedItems.length === 0 && (
        <div className="mt-6 rounded-xl border bg-white p-6 text-sm text-slate-500 shadow-sm">
          No saved items yet. Browse listings and use Save for Later.
          <div className="mt-4">
            <Link href="/" className="text-sm font-semibold text-blue-600">
              Browse products
            </Link>
          </div>
        </div>
      )}

      {!loadingSaved && !error && savedItems.length > 0 && (
        <div className="mt-6 grid gap-3">
          {savedItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-md bg-gray-200 overflow-hidden shrink-0">
                  {item.images[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.location || "Unknown location"} 
                  </p>
                  <p className="text-sm font-bold text-blue-600">
                    {formatPrice(item.price)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => router.push(`/product/${item.id}`)}
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                >
                  View
                </Button>
                <Button
                  onClick={() => handleRemove(item.id)}
                  type="button"
                  variant="ghost"
                  className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
