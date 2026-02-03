"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<HTMLInputElement[]>([]);

  // Load email from login step
  useEffect(() => {
    const savedEmail = localStorage.getItem("otp_email");
    if (!savedEmail) {
      router.push("/login");
      return;
    }
    setEmail(savedEmail);
  }, [router]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    const token = otp.join("");

    if (token.length !== 6) {
      alert("Enter 6-digit OTP");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email: email!,
      token,
      type: "email",
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    localStorage.removeItem("otp_email");
    router.push("/dashboard");
  };

  // Resend OTP
  const resendOtp = async () => {
    if (!email) return;

    await supabase.auth.signInWithOtp({ email });
    alert("OTP resent");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f7f8] px-4">
      <div className="w-full max-w-[480px] bg-white rounded-xl shadow-lg border border-slate-200 p-8 md:p-12">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-blue-600 text-3xl">
              mark_email_unread
            </span>
          </div>

          <h2 className="text-slate-900 text-2xl font-bold text-center">
            OTP Verification
          </h2>
          <p className="text-slate-500 text-base mt-3 text-center">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2 sm:gap-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  if (el) inputsRef.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="h-14 w-10 sm:w-12 text-center text-xl font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <button
            onClick={verifyOtp}
            disabled={loading}
            className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-base font-bold shadow-md transition disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Didn&apos;t receive the code?
            <button
              onClick={resendOtp}
              className="text-blue-600 font-bold ml-1 hover:underline"
            >
              Resend code
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-center gap-2 text-slate-400 text-xs">
          <span className="material-symbols-outlined text-sm">lock</span>
          <span>Secure verification by C2C Shield</span>
        </div>
      </div>
    </div>
  );
}
