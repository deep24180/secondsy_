"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { signOut, supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

type UserContextType = {
  user: User;
  loading: boolean;
  logout: () => Promise<void>;
  accessToken: string | null;
};

export const UserContext = createContext<UserContextType>(
  {} as UserContextType,
);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      console.log(data);
      setUser(data.session?.user ?? null);
      setAccessToken(data.session?.access_token ?? null);

      setLoading(false);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);

    await signOut();

    setUser(null);
    setLoading(false);
  };

  return (
    <UserContext.Provider value={{ user, loading, logout, accessToken }}>
      {children}
    </UserContext.Provider>
  );
};
