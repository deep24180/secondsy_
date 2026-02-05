// src/components/Header.tsx
import Link from "next/link";

export default function Header() {
  const isLoggedIn = true; //  later replace with real auth state

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-xl font-bold text-primary">Secondsy</h1>

        {/* Search */}
        <input
          type="text"
          placeholder="Search for anything..."
          className="hidden md:block px-4 py-2 bg-slate-100 rounded-lg w-[400px]"
        />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg border font-medium hover:bg-slate-100">
            Sell Item
          </button>

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
