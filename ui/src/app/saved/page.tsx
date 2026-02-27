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
    <main className="min-h-screen bg-[linear-gradient(160deg,_#f8fafc_0%,_#eef2ff_50%,_#f8fafc_100%)] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-[linear-gradient(130deg,_#0f172a_0%,_#1e293b_42%,_#1d4ed8_100%)] p-6 text-white shadow-[0_35px_80px_-40px_rgba(15,23,42,0.75)] sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-blue-300/30 blur-3xl" />

          <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                <span className="material-symbols-outlined text-base leading-none">
                  bookmark_heart
                </span>
                Saved List
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Saved for Later
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-blue-100/90 sm:text-base">
                  Keep your shortlisted items in one place and jump back to them
                  whenever you&apos;re ready to buy.
                </p>
              </div>
            </div>

            <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100/90">
                  Total Saved
                </p>
                <p className="mt-1 text-2xl font-semibold">{savedItems.length}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100/90">
                  Status
                </p>
                <p className="mt-1 text-sm font-medium text-blue-50">
                  {savedItems.length > 0 ? "Shortlist ready" : "Start exploring"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {loadingSaved && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((key) => (
              <div
                key={key}
                className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur"
              >
                <div className="h-44 animate-pulse rounded-2xl bg-slate-200" />
                <div className="mt-4 h-5 w-4/5 animate-pulse rounded-lg bg-slate-200" />
                <div className="mt-2 h-4 w-3/5 animate-pulse rounded-lg bg-slate-200" />
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="h-9 animate-pulse rounded-xl bg-slate-200" />
                  <div className="h-9 animate-pulse rounded-xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingSaved && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <p className="font-semibold">Unable to load saved products</p>
            <p className="mt-1 text-red-700/90">{error}</p>
          </div>
        )}

        {!loadingSaved && !error && savedItems.length === 0 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-8 text-center shadow-[0_20px_45px_-35px_rgba(15,23,42,0.6)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <span className="material-symbols-outlined text-2xl leading-none">
                bookmark_add
              </span>
            </div>
            <p className="mt-4 text-base font-semibold text-slate-800">
              You have no saved products yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Start browsing listings and tap save to build your shortlist.
            </p>
            <div className="mt-5">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <span className="material-symbols-outlined text-base leading-none">
                  travel_explore
                </span>
                Browse products
              </Link>
            </div>
          </div>
        )}

        {!loadingSaved && !error && savedItems.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_45px_-30px_rgba(15,23,42,0.45)]"
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
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/85 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur">
                      <span className="material-symbols-outlined text-[15px] leading-none text-blue-700">
                        bookmark
                      </span>
                      Saved
                    </span>
                  </div>

                  <div className="space-y-2 p-4 pb-3">
                    <p className="line-clamp-2 min-h-[48px] text-base font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {item.location || "Unknown location"}
                    </p>
                    <p className="text-lg font-bold text-blue-700">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-4 pt-3">
                  <Button
                    onClick={() => router.push(`/product/${item.id}`)}
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <span className="material-symbols-outlined text-base leading-none">
                      open_in_new
                    </span>
                    View
                  </Button>
                  <Button
                    onClick={() => handleRemove(item.id)}
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <span className="material-symbols-outlined text-base leading-none">
                      delete
                    </span>
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
