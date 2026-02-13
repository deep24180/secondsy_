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
      className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border p-4 transition ${
        isActive
          ? "border-primary bg-primary/5 shadow-md"
          : "bg-white hover:shadow-md"
      }`}
      aria-pressed={isActive}
    >
      {/* <span className="material-symbols-outlined text-primary text-3xl">
        {icon}
      </span> */}
      <span className="text-sm font-medium">{name}</span>
    </Button>
  );
}
