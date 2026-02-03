"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    localStorage.setItem("otp_email", email);
    router.push("/auth/verify");
  };

  const signInWithGoogle = async () => {
    if (loading) return;

    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setLoading(false);

    if (error) alert(error.message);
  };

  return (
    <div className="min-h-screen flex bg-[#f6f7f8]">
      {/* LEFT IMAGE SECTION */}
      <div className="hidden lg:flex w-[40%] items-center justify-center bg-blue-50">
        <div className="text-center px-10">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXb3dOic5cMdl5xW5lIVTVvpeuJkC-7PeqGKt2SFkBOowiZl3RwX7BNrvOoXLCuaye4-wJ1OQyvThi9AbaztONe0GUwpeDzoUbi63De9QxFxBVOWsYOdbqrnI9ZILBOV1G8qI3mssVCw5p4FnYCix4uRfgUSqvVccK6KjhWKHj0cObo9iKWewMLB90OGPkH3jUe5LnuO80tuYao0u-AENvGJpP3Ft3Y6-0lb_2v71A_vOxHmY_6YD6apnfNSt4ML3BG0nwnm3NcBw"
            alt="Marketplace"
            className="rounded-xl mb-6 max-w-xs mx-auto"
          />
          <h2 className="text-2xl font-bold text-slate-900">
            Join our community
          </h2>
          <p className="text-slate-500 mt-2">
            The easiest way to buy and sell items near you.
          </p>
        </div>
      </div>

      {/* RIGHT FORM SECTION */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Sign in to Secondcy
          </h1>
          <p className="text-slate-500 mt-1">
            Enter your details below to access your account
          </p>

          {/* EMAIL FORM */}
          <form onSubmit={sendOtp} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 rounded-xl bg-slate-100 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Continue"}
            </button>
          </form>

          {/* OR */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-semibold">OR</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* GOOGLE BUTTON */}
          <button
            onClick={signInWithGoogle}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-full border border-slate-200 text-sm font-semibold hover:bg-slate-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don’t have an account?{" "}
            <span className="text-blue-600 font-semibold cursor-pointer">
              Create an account
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
