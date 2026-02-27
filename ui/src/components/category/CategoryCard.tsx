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
      className={`group relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border p-4 text-center transition-all duration-200 ${
        isActive
          ? "border-blue-500 bg-[linear-gradient(145deg,_#1d4ed8_0%,_#0f172a_100%)] text-white shadow-[0_20px_40px_-30px_rgba(29,78,216,0.9)] hover:border-blue-500 hover:bg-[linear-gradient(145deg,_#1d4ed8_0%,_#0f172a_100%)] hover:text-white"
          : "border-slate-200/80 bg-[linear-gradient(160deg,_#ffffff_0%,_#f8fafc_100%)] text-slate-700 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_16px_32px_-26px_rgba(15,23,42,0.6)]"
      }`}
      aria-pressed={isActive}
    >
      <span
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${
          isActive ? "bg-blue-200/80" : "bg-transparent group-hover:bg-blue-200/70"
        }`}
      />
      <span
        className={`material-symbols-outlined text-2xl transition-transform duration-200 ${
          isActive
            ? "text-white"
            : "text-slate-500 group-hover:scale-110 group-hover:text-blue-700"
        }`}
      >
        {icon}
      </span>
      <span className="text-xs font-semibold uppercase tracking-[0.08em] sm:text-sm">
        {name}
      </span>
    </Button>
  );
}
