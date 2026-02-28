import Link from "next/link";
import type { Product } from "../../type";
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
  const price = Number(product.price) || 0;
  const tags = Array.isArray(product.tags) ? product.tags.slice(0, 2) : [];

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block cursor-pointer rounded-xl border border-slate-300 bg-white p-2.5 transition-shadow duration-200 hover:shadow-md"
    >
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        {image ? (
          <img
            src={image}
            alt={product.title}
            className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-64 w-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300" />
        )}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          {product.category}
        </span>
      </div>

      <div className="space-y-1.5 pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-extrabold leading-none tracking-tight text-slate-900 sm:text-xl">
            {formatPriceINR(price)}
          </p>
          <div className="flex min-w-0 items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={`${product.id}-${tag}`}
                className="truncate rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <h3 className="line-clamp-1 text-sm font-medium leading-tight text-slate-900 group-hover:text-slate-700 sm:text-base">
          {product.title}
        </h3>
        <div className="flex items-center justify-between gap-3">
          <p className="line-clamp-1 text-xs font-medium text-slate-500 sm:text-sm">
            {product.location}
          </p>
          <span className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 transition-colors group-hover:border-slate-500 group-hover:text-slate-900">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}
