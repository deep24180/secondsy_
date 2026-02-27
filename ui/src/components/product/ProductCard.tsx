import Link from "next/link";

export type Product = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  tags?: string[];
  sold?: boolean;
  status?: "Active" | "Sold" | "Expired" | string;
  price: number;
  condition: string;
  description: string;
  images: string[];
  email: string;
  phone: string;
  location: string;
  deliveryPickup: boolean;
  deliveryShipping: boolean;
  userId: string;
  createdAt: Date;
};
type ProductCardProps = {
  product: Product;
};

const formatPriceINR = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export default function ProductCard({ product }: ProductCardProps) {
  const image = product.images?.[0];

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] shadow-[0_18px_38px_-30px_rgba(15,23,42,0.6)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_28px_48px_-30px_rgba(15,23,42,0.7)]"
    >
      <div className="relative h-56 overflow-hidden bg-slate-100">
        {image ? (
          <img
            src={image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/55 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full border border-white/40 bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700 backdrop-blur">
          {product.category}
        </span>
        {product.subcategory ? (
          <span className="absolute right-3 top-3 rounded-full border border-blue-200/70 bg-blue-50/95 px-2.5 py-1 text-[11px] font-semibold capitalize tracking-wide text-blue-700">
            {product.subcategory}
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 sm:text-base">
            {product.title}
          </h3>
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-700 sm:text-base">
            {formatPriceINR(Number(product.price) || 0)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500 sm:text-sm">
          <p className="truncate rounded-full border border-slate-200 bg-white px-2.5 py-1">
            {product.location}
          </p>
          <p className="truncate rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-600">
            {product.condition}
          </p>
        </div>
        {Array.isArray(product.tags) && product.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={`${product.id}-${tag}`}
                className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
