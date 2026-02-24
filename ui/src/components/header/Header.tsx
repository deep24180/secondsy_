"use client";

import { FormEvent, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, MessageCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { UserContext } from "../../context/user-context";
import { SearchContext } from "../../context/search-context";
import { getConversations } from "../../lib/api/message";
import {
  getUnreadConversationsCount,
  MESSAGE_READ_EVENT,
} from "../../lib/message-unread";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, accessToken } = useContext(UserContext);
  const isLoggedIn = Boolean(user);
  const { query, setQuery, clearQuery } = useContext(SearchContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  useEffect(() => {
    if (!user?.id || !accessToken) {
      setUnreadCount(0);
      return;
    }

    let active = true;

    const refreshUnreadCount = async () => {
      try {
        const conversations = await getConversations(accessToken);
        if (!active) return;

        setUnreadCount(getUnreadConversationsCount(conversations, user.id));
      } catch {
        if (active) {
          setUnreadCount(0);
        }
      }
    };

    void refreshUnreadCount();

    const handleReadEvent = () => {
      void refreshUnreadCount();
    };

    window.addEventListener(MESSAGE_READ_EVENT, handleReadEvent);
    const intervalId = window.setInterval(() => {
      void refreshUnreadCount();
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener(MESSAGE_READ_EVENT, handleReadEvent);
    };
  }, [user?.id, accessToken]);

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
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold leading-5 text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
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
