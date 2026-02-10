import Link from "next/link";

export type Product = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
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

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group block bg-white rounded-xl border hover:shadow-xl overflow-hidden transition-shadow cursor-pointer"
    >
      <div className="relative aspect-square">
        <div className="relative w-full h-56 overflow-hidden rounded-t-xl bg-slate-100">
          <img
            src={product.images[0]}
            alt={product.title}
            className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform"
          />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium truncate">{product.title}</h3>
          <span className="font-bold">${product.price}</span>
        </div>
        <p className="text-sm text-slate-500 mt-1">{product.location}</p>
      </div>
    </Link>
  );
}
