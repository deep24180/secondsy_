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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_#f8fafc_38%,_#ffffff_100%)] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                Wishlist
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Saved for Later
              </h1>
              <p className="text-sm text-slate-500">
                Products you bookmarked to review later.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                Total Saved
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {savedItems.length}
              </p>
            </div>
          </div>
        </section>

        {loadingSaved && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((key) => (
              <div
                key={key}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="h-44 animate-pulse rounded-xl bg-slate-200" />
                <div className="mt-4 h-5 w-4/5 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-4 w-3/5 animate-pulse rounded bg-slate-200" />
                <div className="mt-4 h-9 w-full animate-pulse rounded-lg bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {!loadingSaved && error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loadingSaved && !error && savedItems.length === 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-base font-medium text-slate-700">
              You have no saved products yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Start browsing listings and tap save to build your shortlist.
            </p>
            <div className="mt-5">
              <Link
                href="/"
                className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Browse products
              </Link>
            </div>
          </div>
        )}

        {!loadingSaved && !error && savedItems.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => router.push(`/product/${item.id}`)}
                  className="block w-full text-left"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    {item.images[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 p-4">
                    <p className="line-clamp-2 text-base font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.location || "Unknown location"}
                    </p>
                    <p className="text-lg font-bold text-blue-700">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </button>

                <div className="flex gap-2 border-t border-slate-100 p-4 pt-3">
                  <Button
                    onClick={() => router.push(`/product/${item.id}`)}
                    type="button"
                    variant="outline"
                    className="h-9 flex-1 rounded-lg border-slate-300"
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => handleRemove(item.id)}
                    type="button"
                    variant="ghost"
                    className="h-9 flex-1 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
