"use client";

import { createContext, useEffect, useState } from "react";
import { signOut, supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type UserContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  accessToken: string | null;
};

export const UserContext = createContext<UserContextType>(
  {} as UserContextType,
);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setAccessToken(data.session?.access_token ?? null);
      setLoading(false);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setAccessToken(session?.access_token ?? null);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);

    await signOut();

    setUser(null);
    setAccessToken(null);
    setLoading(false);
  };

  return (
    <UserContext.Provider value={{ user, loading, logout, accessToken }}>
      {children}
      <ToastContainer position="top-right" autoClose={3000} />
    </UserContext.Provider>
  );
};
