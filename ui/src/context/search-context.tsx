"use client";

import { createContext, useMemo, useState } from "react";

type SearchContextType = {
  query: string;
  setQuery: (value: string) => void;
  clearQuery: () => void;
};

export const SearchContext = createContext<SearchContextType>(
  {} as SearchContextType,
);

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [query, setQuery] = useState("");

  const value = useMemo(
    () => ({
      query,
      setQuery,
      clearQuery: () => setQuery(""),
    }),
    [query],
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};
