import { Button } from "../ui/button";

export default function CategoryCard({
  name,
  icon,
  isActive,
  onClick,
}: {
  name: string;
  icon: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={`group relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200 ${
        isActive
          ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-300"
          : "border-slate-200 bg-white/95 text-slate-700 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white hover:shadow-md"
      }`}
      aria-pressed={isActive}
    >
      <span
        className={`material-symbols-outlined text-2xl transition-transform ${
          isActive ? "text-white" : "text-slate-500 group-hover:scale-110"
        }`}
      >
        {icon}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide sm:text-sm">
        {name}
      </span>
    </Button>
  );
}
