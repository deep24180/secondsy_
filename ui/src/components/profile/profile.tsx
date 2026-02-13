"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Eye,
  Heart,
  Trash2,
  Edit3,
  CheckCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../ui/button";
import { getProducts, updateProductStatus } from "../../lib/api/product";
import { UserContext } from "../../context/user-context";
import PageLoader from "../ui/page-loader";

type Status = "Active" | "Sold" | "Expired";
type Ad = {
  id: string;
  title: string;
  price: number;
  status: Status;
  views: number;
  likes: number;
  images: string[];
  location: string;
  createdAt: string;
  userId: string;
};

type ProductApiItem = {
  id: string;
  title: string;
  price: number | string;
  status?: Status;
  images?: string[];
  location?: string;
  createdAt?: string;
  userId: string;
};

export default function MyAdsPage() {
  const router = useRouter();
  const { user, logout, accessToken, loading } = useContext(UserContext);

  const [activeTab, setActiveTab] = useState<
    "All" | "Active" | "Sold" | "Expired"
  >("All");

  const [page, setPage] = useState(1);
  const PER_PAGE = 2;

  const [ads, setAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            views: 0,
            likes: 0,
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

  const card =
    "bg-white rounded-xl border shadow-sm hover:shadow-md transition";
  const softBtn =
    "bg-gray-100 hover:bg-gray-200 rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2";
  const dangerBtn =
    "w-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center";

  const getNavClass = (item: string) =>
    `px-4 py-3 rounded-lg cursor-pointer ${
      item === "My Ads"
        ? "bg-blue-50 text-blue-600 font-semibold"
        : "text-gray-500 hover:bg-gray-100"
    }`;

  const getTabClass = (tab: string) =>
    `pb-3 font-semibold whitespace-nowrap ${
      activeTab === tab
        ? "border-b-4 border-blue-600 text-blue-600"
        : "text-gray-500 hover:text-blue-600"
    }`;

  const getCardClass = (status: Status) =>
    `${card} p-4 flex flex-col sm:flex-row gap-4 ${
      status === "Sold" ? "opacity-70" : ""
    }`;

  const getBadgeClass = (status: Status) =>
    `text-xs font-bold uppercase px-2 py-0.5 rounded ${
      status === "Sold"
        ? "bg-gray-200 text-gray-600"
        : status === "Expired"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-green-100 text-green-700"
    }`;

  const getPriceClass = (status: Status) =>
    `text-xl font-extrabold ${
      status === "Sold" ? "text-gray-400" : "text-blue-600"
    }`;

  const canShowStats = (status: Status) => status === "Active";

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

  const remove = (id: string) =>
    setAds((prev) => prev.filter((ad) => ad.id !== id));

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
    <div className="min-h-screen bg-[#f6f7f8] flex justify-center py-4 sm:py-6 lg:py-8">
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-6 lg:gap-8 px-4 sm:px-6">
        {/* SIDEBAR (DESKTOP ONLY) */}
        <aside className="hidden lg:block w-64 bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="w-12 h-12 rounded-full bg-gray-200" />
            <div>
              <p className="font-bold text-sm">{user?.email ?? "Guest"}</p>
              <p className="text-xs text-gray-500">Status: Active</p>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            <div className={getNavClass("My Ads")}>My Ads</div>
            <Link href="/messages" className={getNavClass("Messages")}>
              Messages
            </Link>
            <Link href="/saved" className={getNavClass("Saved")}>
              Saved
            </Link>
            <div className={getNavClass("Profile")}>Profile</div>
            <button
              type="button"
              onClick={handleLogout}
              className={getNavClass("Sign Out")}
            >
              Sign Out
            </button>
          </nav>
        </aside>

        <main className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold">My Ads</h1>
              <p className="text-gray-500">
                Manage your listed items and track their performance.
              </p>
            </div>

            <Button
              onClick={() => router.push("/sell-item")}
              type="button"
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow flex items-center gap-2 w-fit"
            >
              <Plus size={18} />
              Post New Ad
            </Button>
          </div>

          <div className="flex gap-6 sm:gap-8 border-b overflow-x-auto">
            {["All", "Active", "Sold", "Expired"].map((tab) => (
              <Button
                key={tab}
                onClick={() =>
                  changeTab(tab as "All" | "Active" | "Sold" | "Expired")
                }
                type="button"
                variant="ghost"
                className={getTabClass(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>

          {loadingAds && (
            <div className="bg-white rounded-xl border shadow-sm p-6 text-sm text-gray-500">
              Loading your ads...
            </div>
          )}

          {!loadingAds && error && (
            <div className="bg-white rounded-xl border shadow-sm p-6 text-sm text-red-600">
              {error}
            </div>
          )}

          {!loadingAds && !error && paginatedAds.length === 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-6 text-sm text-gray-500">
              No ads yet. Create your first listing.
            </div>
          )}

          {!loadingAds &&
            !error &&
            paginatedAds.map((ad) => (
              <div key={ad.id} className={getCardClass(ad.status)}>
                <div className="w-full sm:w-48 h-40 sm:h-32 rounded-lg bg-gray-200" />

                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    <div>
                      <span className={getBadgeClass(ad.status)}>
                        {ad.status}
                      </span>

                      <h3 className="text-lg font-bold mt-1">{ad.title}</h3>

                      <p className="text-xs text-gray-500">
                        {(ad.location || "Unknown location") + " • "}
                        {formatDate(ad.createdAt)}
                      </p>

                      <p className={getPriceClass(ad.status)}>
                        {formatPrice(ad.price)}
                      </p>
                    </div>

                    {canShowStats(ad.status) && (
                      <div className="text-sm text-gray-500 flex gap-4 items-center">
                        <span className="flex items-center gap-1">
                          <Eye size={16} /> {ad.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={16} /> {ad.likes}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {ad.status === "Active" && (
                      <>
                        <Button
                          onClick={() =>
                            router.push(`/sell-item?edit=${ad.id}`)
                          }
                          type="button"
                          variant="ghost"
                          className={`flex-1 ${softBtn}`}
                        >
                          <Edit3 size={16} />
                          Edit
                        </Button>
                        <Button
                          onClick={() => markSold(ad.id)}
                          type="button"
                          variant="ghost"
                          className={`flex-1 ${softBtn}`}
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
                        className={`flex-1 ${softBtn}`}
                      >
                        <RotateCcw size={16} />
                        Relist
                      </Button>
                    )}

                    <Button
                      onClick={() => remove(ad.id)}
                      type="button"
                      variant="ghost"
                      className={dangerBtn}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

          <div className="flex justify-center gap-2 pt-4 flex-wrap">
            <Button
              title="Previous page"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              type="button"
              variant="outline"
              className="w-10 h-10 rounded-lg border flex items-center justify-center disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </Button>

            <span className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center">
              {page}
            </span>

            <Button
              title="Next page"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              type="button"
              variant="outline"
              className="w-10 h-10 rounded-lg border flex items-center justify-center disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
