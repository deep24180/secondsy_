"use client";

import { FormEvent, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, MessageCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { UserContext } from "../../context/user-context";
import { SearchContext } from "../../context/search-context";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useContext(UserContext);
  const isLoggedIn = Boolean(user);
  const { query, setQuery, clearQuery } = useContext(SearchContext);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  const handleSellClick = () => {
    if (!isLoggedIn) {
      const redirect = pathname || "/sell-item";
      router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    router.push("/sell-item");
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = searchTerm.trim();

    if (!trimmed) {
      clearQuery();
      if (pathname !== "/") {
        router.push("/");
      }
      return;
    }

    setQuery(trimmed);
    if (pathname !== "/") {
      router.push("/");
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setQuery(value.trim());
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-primary">
          Secondsy
        </Link>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="hidden md:block">
          <Input
            name="q"
            type="text"
            placeholder="Search for anything..."
            value={searchTerm}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="px-4 py-2 bg-slate-100 rounded-lg w-[400px]"
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/messages"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-slate-100"
              aria-label="Messages"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
          ) : null}

          {isLoggedIn ? (
            <Link
              href="/saved"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-slate-100"
              aria-label="Saved for later"
            >
              <Bookmark className="h-5 w-5" />
            </Link>
          ) : null}

          <Button
            variant="outline"
            onClick={handleSellClick}
            disabled={loading}
            className="px-4 py-2 rounded-lg border font-medium hover:bg-slate-100"
          >
            Sell Item
          </Button>

          {!isLoggedIn ? (
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(pathname || "/")}`}
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
