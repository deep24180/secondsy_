"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  deleteProduct,
  getProducts,
  updateProductStatus,
} from "../../lib/api/product";
import { UserContext } from "../../context/user-context";
import PageLoader from "../ui/page-loader";
import DeleteModal from "../modal/DeleteModal";

type Status = "Active" | "Sold" | "Expired";
type Ad = {
  id: string;
  title: string;
  price: number;
  status: Status;
  images: string[];
  location: string;
  createdAt: string;
  userId: string;
};

type ProductApiItem = {
  id: string;
  title: string;
  price: number | string;
  status: Status;
  images: string[];
  location: string;
  createdAt: string;
  userId: string;
};

export default function MyAdsPage() {
  const router = useRouter();
  const { user, logout, accessToken, loading } = useContext(UserContext);

  const [activeTab, setActiveTab] = useState<
    "All" | "Active" | "Sold" | "Expired"
  >("All");
  const [page, setPage] = useState(1);
  const PER_PAGE = 3;

  const [ads, setAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adToDelete, setAdToDelete] = useState<Ad | null>(null);
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null);

  useEffect(() => {
    const loadAds = async () => {
      if (!user?.id) {
        setAds([]);
        setLoadingAds(false);
        return;
      }

      setLoadingAds(true);
      setError(null);

      try {
        const response = await getProducts();
        const products = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
        const typedProducts = products as ProductApiItem[];

        const mappedAds = typedProducts
          .filter((product) => product.userId === user.id)
          .map((product) => ({
            id: product.id,
            title: product.title,
            price: Number(product.price) || 0,
            status: (product.status as Status) || "Active",
            images: Array.isArray(product.images) ? product.images : [],
            location: product.location || "",
            createdAt: product.createdAt || "",
            userId: product.userId,
          }));

        setAds(mappedAds);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load products.",
        );
      } finally {
        setLoadingAds(false);
      }
    };

    loadAds();
  }, [user?.id]);

  const filteredAds = useMemo(
    () =>
      activeTab === "All" ? ads : ads.filter((ad) => ad.status === activeTab),
    [activeTab, ads],
  );

  const totalPages = Math.max(1, Math.ceil(filteredAds.length / PER_PAGE));
  const paginatedAds = filteredAds.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );

  const markSold = async (id: string) => {
    if (!accessToken) return;
    await updateProductStatus(id, "Sold", accessToken);
    setAds((prev) =>
      prev.map((ad) => (ad.id === id ? { ...ad, status: "Sold" } : ad)),
    );
  };

  const relist = async (id: string) => {
    if (!accessToken) return;
    await updateProductStatus(id, "Active", accessToken);
    setAds((prev) =>
      prev.map((ad) => (ad.id === id ? { ...ad, status: "Active" } : ad)),
    );
  };

  const requestRemove = (ad: Ad) => {
    setAdToDelete(ad);
  };

  const closeDeleteModal = () => {
    if (deletingAdId) return;
    setAdToDelete(null);
  };

  const confirmRemove = async () => {
    if (!accessToken || !adToDelete) return;

    setDeletingAdId(adToDelete.id);

    try {
      await deleteProduct(adToDelete.id, accessToken);
      setAds((prev) => prev.filter((ad) => ad.id !== adToDelete.id));
      setAdToDelete(null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete product.",
      );
    } finally {
      setDeletingAdId(null);
    }
  };

  const changeTab = (tab: "All" | "Active" | "Sold" | "Expired") => {
    setActiveTab(tab);
    setPage(1);
  };

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const formatDate = (value: string) => {
    if (!value) return "Unknown date";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Unknown date";
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getBadgeClass = (status: Status) =>
    `inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
      status === "Sold"
        ? "bg-slate-200 text-slate-700"
        : status === "Expired"
          ? "bg-amber-100 text-amber-700"
          : "bg-emerald-100 text-emerald-700"
    }`;

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <PageLoader message="Checking account..." />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_#f8fafc_35%,_#ffffff_100%)] py-5 sm:py-8">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:gap-8">
        <aside className="hidden w-72 self-start rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] lg:sticky lg:top-6 lg:block">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-700">
              {(user?.email ?? "G").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user?.email ?? "Guest"}
              </p>
              <p className="text-xs text-slate-500">Seller dashboard</p>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
              My Ads
            </div>
            <Link
              href="/messages"
              className="flex items-center rounded-xl px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              Messages
            </Link>

            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              className="flex w-full items-center justify-start rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Sign Out
            </Button>
          </div>
        </aside>
    
        <div className="flex-1 space-y-5">
          <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Profile Dashboard
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  My Ads
                </h1>
                <p className="mt-1 text-sm text-slate-500 sm:text-base">
                  Manage your listings and keep them fresh for buyers.
                </p>
              </div>
              <Button
                onClick={() => router.push("/sell-item")}
                type="button"
                className="h-11 rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={18} />
                Post New Ad
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                {ads.length} total
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                {ads.filter((ad) => ad.status === "Active").length} active
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-sm">
            <div className="flex gap-2 overflow-x-auto">
              {["All", "Active", "Sold", "Expired"].map((tab) => (
                <Button
                  key={tab}
                  onClick={() =>
                    changeTab(tab as "All" | "Active" | "Sold" | "Expired")
                  }
                  type="button"
                  variant="ghost"
                  className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                    activeTab === tab
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab}
                </Button>
              ))}
            </div>
          </section>

          {loadingAds && (
            <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 text-sm text-slate-500 shadow-sm">
              Loading your ads...
            </div>
          )}

          {!loadingAds && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          )}

          {!loadingAds && !error && paginatedAds.length === 0 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 text-sm text-slate-500 shadow-sm">
              No ads yet. Create your first listing.
            </div>
          )}

          {!loadingAds &&
            !error &&
            paginatedAds.map((ad) => (
              <article
                key={ad.id}
                className={`rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5 ${
                  ad.status === "Sold" ? "opacity-80" : ""
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                  <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-100 sm:h-36 sm:w-52">
                    {ad.images[0] ? (
                      <Image
                        src={ad.images[0]}
                        alt={ad.title}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, 208px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                      <div>
                        <span className={getBadgeClass(ad.status)}>
                          {ad.status}
                        </span>
                        <h3 className="mt-2 text-lg font-bold text-slate-900">
                          {ad.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {(ad.location || "Unknown location") + " | "}
                          {formatDate(ad.createdAt)}
                        </p>
                        <p
                          className={`mt-2 text-xl font-extrabold ${
                            ad.status === "Sold"
                              ? "text-slate-400"
                              : "text-blue-700"
                          }`}
                        >
                          {formatPrice(ad.price)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {ad.status === "Active" && (
                        <>
                          <Button
                            onClick={() =>
                              router.push(`/sell-item?edit=${ad.id}`)
                            }
                            type="button"
                            variant="ghost"
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Edit3 size={16} />
                            Edit
                          </Button>
                          <Button
                            onClick={() => markSold(ad.id)}
                            type="button"
                            variant="ghost"
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <CheckCircle size={16} />
                            Sold
                          </Button>
                        </>
                      )}

                      {ad.status === "Sold" && (
                        <Button
                          onClick={() => relist(ad.id)}
                          type="button"
                          variant="ghost"
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <RotateCcw size={16} />
                          Relist
                        </Button>
                      )}

                      <Button
                        onClick={() => requestRemove(ad)}
                        type="button"
                        variant="ghost"
                        className="h-10 w-10 rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                        disabled={deletingAdId === ad.id}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button
              title="Previous page"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              type="button"
              variant="outline"
              className="h-10 w-10 rounded-xl border-slate-200 bg-white/90 text-slate-600 shadow-sm disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </Button>
            <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-bold text-white shadow-sm">
              {page}
            </span>
            <Button
              title="Next page"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              type="button"
              variant="outline"
              className="h-10 w-10 rounded-xl border-slate-200 bg-white/90 text-slate-600 shadow-sm disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>

      <DeleteModal
        isOpen={Boolean(adToDelete)}
        title={
          adToDelete
            ? `Delete "${adToDelete.title}"?`
            : "Delete this ad permanently?"
        }
        description="This ad will be removed permanently and cannot be recovered."
        isLoading={Boolean(deletingAdId)}
        onCancel={closeDeleteModal}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
