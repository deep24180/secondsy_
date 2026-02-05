import Image from "next/image";

type Props = {
  title: string;
  price: string;
  location: string;
  image: string;
};

export default function ProductCard({ title, price, location, image }: Props) {
  return (
    <div className="bg-white rounded-xl border hover:shadow-xl overflow-hidden cursor-pointer">
      <div className="relative aspect-square">
        <div className="relative w-full h-56 overflow-hidden rounded-t-xl">
          <img src={image} alt={title} className="object-cover" />
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between">
          <h3 className="font-medium truncate">{title}</h3>
          <span className="font-bold">{price}</span>
        </div>
        <p className="text-sm text-slate-500">{location}</p>
      </div>
    </div>
  );
}
