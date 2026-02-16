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
import { API_URL } from "../../lib/api/user";

type HeaderWsIncoming = {
  type?: string;
};

const toWsUrl = (baseUrl: string, token: string) => {
  const normalized = baseUrl.replace(/\/$/, "");
  const wsBase = normalized.startsWith("https://")
    ? normalized.replace("https://", "wss://")
    : normalized.replace("http://", "ws://");

  return `${wsBase}/ws?token=${encodeURIComponent(token)}`;
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, accessToken } = useContext(UserContext);
  const isLoggedIn = Boolean(user);
  const [unreadCount, setUnreadCount] = useState(0);
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

  useEffect(() => {
    if (!isLoggedIn || !accessToken || !user?.id) return;

    let mounted = true;
    let socket: WebSocket | null = null;

    const loadUnreadCount = async () => {
      try {
        const conversations = await getConversations(accessToken);
        if (!mounted) return;

        setUnreadCount(getUnreadConversationsCount(conversations, user.id));
      } catch {
        if (mounted) setUnreadCount(0);
      }
    };

    void loadUnreadCount();

    const handleUnreadChange = () => {
      void loadUnreadCount();
    };

    window.addEventListener(MESSAGE_READ_EVENT, handleUnreadChange);
    window.addEventListener("storage", handleUnreadChange);

    socket = new WebSocket(toWsUrl(API_URL, accessToken));
    socket.onmessage = (event) => {
      let incoming: HeaderWsIncoming;

      try {
        incoming = JSON.parse(event.data) as HeaderWsIncoming;
      } catch {
        return;
      }

      if (incoming.type === "new_message") {
        void loadUnreadCount();
      }
    };

    return () => {
      mounted = false;
      window.removeEventListener(MESSAGE_READ_EVENT, handleUnreadChange);
      window.removeEventListener("storage", handleUnreadChange);
      socket?.close();
    };
  }, [isLoggedIn, accessToken, user?.id]);

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
        <h1 className="text-xl font-bold text-primary">Secondsy</h1>

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
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none text-white">
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
