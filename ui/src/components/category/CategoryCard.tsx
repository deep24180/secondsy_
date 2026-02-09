export default function CategoryCard({
  name,
  icon,
}: {
  name: string;
  icon: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border bg-white hover:shadow-md transition cursor-pointer">
      <span className="material-symbols-outlined text-primary text-3xl">
        {icon}
      </span>
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}
