"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import PageLoader from "../../../components/ui/page-loader";
import { supabase } from "../../../lib/supabase";

function getSafeRedirectPath(redirect: string | null) {
  if (!redirect) return "/";
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return "/";
  return redirect;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = getSafeRedirectPath(searchParams.get("redirect"));

  useEffect(() => {
    const completeSignIn = async () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          toast.error(error.message);
          break;
        }

        if (session) {
          router.replace(redirectPath);
          return;
        }

        await wait(300);
      }

      toast.error("Login failed. Please try again.");
      router.replace(
        `/auth/login?redirect=${encodeURIComponent(redirectPath)}`,
      );
    };

    void completeSignIn();
  }, [redirectPath, router]);

  return <PageLoader message="Completing sign in..." />;
}
