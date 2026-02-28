"use client";

import { createContext, useEffect, useRef, useState } from "react";
import { signOut, supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import { ToastContainer } from "react-toastify";
import {
  getCurrentUserProfile,
  syncCurrentUser,
} from "../lib/api/user";
import type { UserProfile } from "../type";
import "react-toastify/dist/ReactToastify.css";
import CompleteProfileModal from "../components/modal/CompleteProfileModal";

type UserContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  accessToken: string | null;
  profile: UserProfile | null;
  needsProfile: boolean;
};

export const UserContext = createContext<UserContextType>(
  {} as UserContextType,
);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const provisionedUserIdsRef = useRef<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const needsProfile = Boolean(
    user &&
      profile &&
      (!profile.firstName?.trim() || !profile.lastName?.trim()),
  );

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
        if (!session?.user) {
          setProfile(null);
          setFirstName("");
          setLastName("");
          setProfileError(null);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id || !accessToken) return;
    if (provisionedUserIdsRef.current.has(user.id)) return;

    let isCancelled = false;

    const ensureBackendUser = async () => {
      try {
        const synced = await syncCurrentUser(accessToken);
        if (!isCancelled) {
          setProfile(synced);
        }
        if (!isCancelled) {
          provisionedUserIdsRef.current.add(user.id);
        }
      } catch (error) {
        console.error("Failed to sync authenticated user:", error);
      }
    };

    void ensureBackendUser();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, accessToken]);

  useEffect(() => {
    if (!user?.id || !accessToken) return;

    let isCancelled = false;

    const hydrateProfile = async () => {
      try {
        const currentProfile = await getCurrentUserProfile(accessToken);
        if (!isCancelled && currentProfile) {
          setProfile(currentProfile);
        }
      } catch (error) {
        console.error("Failed to load current user profile:", error);
      }
    };

    void hydrateProfile();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, accessToken]);

  useEffect(() => {
    if (!needsProfile || !profile) return;
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
  }, [needsProfile, profile]);

  const submitProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken || !needsProfile) return;

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      setProfileError("First name and last name are required.");
      return;
    }

    setSavingProfile(true);
    setProfileError(null);

    try {
      const updated = await syncCurrentUser(accessToken, {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });
      setProfile(updated);
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Failed to save profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const logout = async () => {
    setLoading(true);

    await signOut();

    setUser(null);
    setAccessToken(null);
    setLoading(false);
  };

  return (
    <UserContext.Provider
      value={{ user, loading, logout, accessToken, profile, needsProfile }}
    >
      {children}
      <CompleteProfileModal
        isOpen={needsProfile}
        firstName={firstName}
        lastName={lastName}
        isSaving={savingProfile}
        error={profileError}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        onSubmit={submitProfile}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </UserContext.Provider>
  );
};
