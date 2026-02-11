import { categories } from "../../data/categories";
import CategoryCard from "./CategoryCard";

export default function CategoriesSection() {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold mb-6">Explore Categories</h2>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} {...cat} />
        ))}
      </div>
    </section>
  );
}
