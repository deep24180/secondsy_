"use client";

import { FormEvent, useContext, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Search, X } from "lucide-react";
import { Input } from "../ui/input";
import { UserContext } from "../../context/user-context";
import { SearchContext } from "../../context/search-context";
import secondsyLogo from "../../assets/images/secondsy.png";
import { getConversations } from "../../lib/api/message";
import {
  getUnreadConversationsCount,
  MESSAGE_READ_EVENT,
} from "../../lib/message-unread";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, accessToken } = useContext(UserContext);
  const isLoggedIn = Boolean(user);
  const { query, setQuery, clearQuery } = useContext(SearchContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
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

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = searchTerm.trim();

    if (!trimmed) {
      clearQuery();
      if (pathname !== "/") {
        router.push("/");
      }
      setIsMobileSearchOpen(false);
      return;
    }

    setQuery(trimmed);
    if (pathname !== "/") {
      router.push("/");
    }
    setIsMobileSearchOpen(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setQuery(value.trim());
  };

  const iconButtonClass =
    "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 md:h-10 md:w-10";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-gradient-to-b from-white to-slate-50/80 backdrop-">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:gap-4">
        <Link
          href="/"
          className="flex shrink-0 items-center  whitespace-nowrap text-[1.3rem] font-extrabold tracking-tight text-slate-900 transition-colors hover:text-slate-600"
        >
          <Image
            src={secondsyLogo}
            alt="Secondsy logo"
            width={50}
            height={50}
            className="h-7 w-7 rounded-md object-cover"
            priority
          />
          Secondsy
        </Link>

        <form
          onSubmit={handleSearchSubmit}
          className={`${isMobileSearchOpen ? "order-3 w-full" : "hidden"} md:order-2 md:block md:flex-1`}
        >
          <Input
            name="q"
            type="text"
            placeholder="Search for anything..."
            value={searchTerm}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="h-10 w-full rounded-lg border-slate-200 bg-white px-4 text-sm placeholder:text-slate-400 md:h-11"
          />
        </form>

        <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
          <button
            type="button"
            aria-label={isMobileSearchOpen ? "Close search" : "Open search"}
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
            className={`${iconButtonClass} md:hidden`}
          >
            {isMobileSearchOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </button>

          {isLoggedIn ? (
            <Link href="/messages" className={iconButtonClass} aria-label="Messages">
              <MessageCircle className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold leading-5 text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
          ) : null}

          {!isLoggedIn ? (
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(pathname || "/")}`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 md:h-10 md:px-4"
            >
              Login
            </Link>
          ) : (
            <Link
              href="/profile"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 md:h-10 md:px-4"
            >
              Profile
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
