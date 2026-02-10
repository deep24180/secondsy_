"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function Header() {
  const router = useRouter();

  const isLoggedIn = true; // 🔁 later replace with real auth state

  const handleSellClick = () => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }

    router.push("/sell-item");
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-xl font-bold text-primary">Secondsy</h1>

        {/* Search */}
        <Input
          type="text"
          placeholder="Search for anything..."
          className="hidden md:block px-4 py-2 bg-slate-100 rounded-lg w-[400px]"
        />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSellClick}
            className="px-4 py-2 rounded-lg border font-medium hover:bg-slate-100"
          >
            Sell Item
          </Button>

          {!isLoggedIn ? (
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-lg border font-medium hover:bg-slate-100"
            >
              Login
            </Link>
          ) : (
            <Link
              href="/profile"
              className="px-4 py-2 rounded-lg border font-medium hover:bg-slate-100"
            >
              Profile
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
