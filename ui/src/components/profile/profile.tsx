"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

/* =======================
   TYPES
======================= */
type Status = "Active" | "Sold" | "Expired";

/* =======================
   COMPONENT
======================= */
export default function MyAdsPage() {
  const router = useRouter();

  /* =======================
     STATE
  ======================= */
  const [activeTab, setActiveTab] = useState<
    "All" | "Active" | "Sold" | "Expired"
  >("All");

  const [page, setPage] = useState(1);
  const PER_PAGE = 2;

  const [ads, setAds] = useState([
    {
      id: 1,
      title: "Vintage Leather Jacket",
      price: "$120.00",
      status: "Active" as Status,
      views: 245,
      likes: 12,
    },
    {
      id: 2,
      title: "Ergonomic Office Chair",
      price: "$75.00",
      status: "Sold" as Status,
    },
    {
      id: 3,
      title: "Acoustic Guitar",
      price: "$250.00",
      status: "Active" as Status,
      views: 112,
      likes: 4,
    },
    {
      id: 4,
      title: "Gaming Desk",
      price: "$180.00",
      status: "Expired" as Status,
    },
  ]);

  /* =======================
     BASE CLASSES
  ======================= */
  const card =
    "bg-white rounded-xl border shadow-sm hover:shadow-md transition";
  const softBtn =
    "bg-gray-100 hover:bg-gray-200 rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2";
  const dangerBtn =
    "w-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center";

  /* =======================
     HELPERS (NO JSX LOGIC)
  ======================= */
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

  const filteredAds =
    activeTab === "All" ? ads : ads.filter((ad) => ad.status === activeTab);

  const totalPages = Math.ceil(filteredAds.length / PER_PAGE);

  const paginatedAds = filteredAds.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );

  /* =======================
     ACTIONS
  ======================= */
  const markSold = (id: number) =>
    setAds((prev) =>
      prev.map((ad) => (ad.id === id ? { ...ad, status: "Sold" } : ad)),
    );

  const relist = (id: number) =>
    setAds((prev) =>
      prev.map((ad) => (ad.id === id ? { ...ad, status: "Active" } : ad)),
    );

  const remove = (id: number) =>
    setAds((prev) => prev.filter((ad) => ad.id !== id));

  const changeTab = (tab: "All" | "Active" | "Sold" | "Expired") => {
    setActiveTab(tab);
    setPage(1);
  };

  /* =======================
     UI
  ======================= */
  return (
    <div className="min-h-screen bg-[#f6f7f8] flex justify-center py-4 sm:py-6 lg:py-8">
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-6 lg:gap-8 px-4 sm:px-6">
        {/* SIDEBAR (DESKTOP ONLY) */}
        <aside className="hidden lg:block w-64 bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="w-12 h-12 rounded-full bg-gray-200" />
            <div>
              <p className="font-bold text-sm">John Doe</p>
              <p className="text-xs text-gray-500">Verified Seller</p>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {["My Ads", "Messages", "Profile", "Sign Out"].map((item) => (
              <div key={item} className={getNavClass(item)}>
                {item}
              </div>
            ))}
          </nav>
        </aside>

        {/* MAIN */}
        <main className="flex-1 space-y-6">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold">My Ads</h1>
              <p className="text-gray-500">
                Manage your listed items and track their performance.
              </p>
            </div>

            <button
              onClick={() => router.push("/sell")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow flex items-center gap-2 w-fit"
            >
              <Plus size={18} />
              Post New Ad
            </button>
          </div>

          {/* TABS */}
          <div className="flex gap-6 sm:gap-8 border-b overflow-x-auto">
            {["All", "Active", "Sold", "Expired"].map((tab) => (
              <button
                key={tab}
                onClick={() =>
                  changeTab(tab as "All" | "Active" | "Sold" | "Expired")
                }
                className={getTabClass(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ADS */}
          {paginatedAds.map((ad) => (
            <div key={ad.id} className={getCardClass(ad.status)}>
              <div className="w-full sm:w-48 h-40 sm:h-32 rounded-lg bg-gray-200" />

              <div className="flex-1 flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <div>
                    <span className={getBadgeClass(ad.status)}>
                      {ad.status}
                    </span>

                    <h3 className="text-lg font-bold mt-1">{ad.title}</h3>

                    <p className={getPriceClass(ad.status)}>{ad.price}</p>
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
                      <button className={`flex-1 ${softBtn}`}>
                        <Edit3 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => markSold(ad.id)}
                        className={`flex-1 ${softBtn}`}
                      >
                        <CheckCircle size={16} />
                        Sold
                      </button>
                    </>
                  )}

                  {ad.status === "Sold" && (
                    <button
                      onClick={() => relist(ad.id)}
                      className={`flex-1 ${softBtn}`}
                    >
                      <RotateCcw size={16} />
                      Relist
                    </button>
                  )}

                  <button onClick={() => remove(ad.id)} className={dangerBtn}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* PAGINATION */}
          <div className="flex justify-center gap-2 pt-4 flex-wrap">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-10 h-10 rounded-lg border flex items-center justify-center disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center">
              {page}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="w-10 h-10 rounded-lg border flex items-center justify-center disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
