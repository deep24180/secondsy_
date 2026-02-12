"use client";

type PageLoaderProps = {
  message?: string;
  fullScreen?: boolean;
};

export default function PageLoader({
  message = "Loading...",
  fullScreen = true,
}: PageLoaderProps) {
  return (
    <div
      className={
        fullScreen
          ? "min-h-screen bg-[#f6f7f8] flex items-center justify-center"
          : "flex items-center justify-center py-10"
      }
    >
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <span className="h-8 w-8 rounded-full border-4 border-slate-300 border-t-blue-600 animate-spin" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}

