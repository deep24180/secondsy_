import Image from "next/image";

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
  console.log(product)
  return (
    <div className="bg-white rounded-xl border hover:shadow-xl overflow-hidden cursor-pointer">
      <div className="relative aspect-square">
        <div className="relative w-full h-56 overflow-hidden rounded-t-xl">
          <img
            src={product.images[0]}
            alt={product.title}
            className="object-cover"
          />
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between">
          <h3 className="font-medium truncate">{product.title}</h3>
          <span className="font-bold">{product.price}</span>
        </div>
        <p className="text-sm text-slate-500">{product.location}</p>
      </div>
    </div>
  );
}
