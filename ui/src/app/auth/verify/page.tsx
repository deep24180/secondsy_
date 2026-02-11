"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { createUser } from "../../../lib/api/user";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(59);
  const inputsRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("otp_email");
    if (!savedEmail) {
      router.push("/");
      return;
    }
    setEmail(savedEmail);
  }, [router]);

  useEffect(() => {
    if (seconds === 0) return;
    const timer = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

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

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await createUser({
        supabaseId: user.id,
        email: user.email!,
      });
    }

    setLoading(false);
    localStorage.removeItem("otp_email");
    router.push("/ ");
  };

  const resendOtp = async () => {
    if (!email || seconds > 0) return;
    await supabase.auth.signInWithOtp({ email });
    setSeconds(59);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f7f8] px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex">
        <div className="hidden md:flex w-1/2 bg-blue-50 items-center justify-center p-10">
          <div className="text-center">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2gb1rsQlS-psBvphskG-RcFJwQzxDV6arGizuEKXKNpZxIXfQ7k512DmuKDbbGq_22O2jGrUz1h-y9wa4actsdMTT5orXeF5X6pMm2URj9AnHMWFNpoi8YgwdiT89Eh_2NVl446bWFxodMN4aYpZpq0TI1WCP1PQvfYjmF_72wY3LnsEDpadP2IwtM01OBOSp-WxilrbZr05J3uqfTjkj9tATwVtUrFYgpfL41iPonsE7Wi1yi0DR94kkhhaIMyDdhpZOv-HpfGw"
              alt="Secure verification"
              className="max-w-xs rounded-xl mb-6 mx-auto"
            />
            <h2 className="text-2xl font-bold text-slate-900">
              Secure Verification
            </h2>
            <p className="text-slate-500 mt-2">
              Keeping our Secondsy safe for everyone.
            </p>  
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Verify your account
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            We’ve sent a 6-digit code to your email
          </p>

          <div className="flex justify-center gap-3 my-8">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  if (el) inputsRef.current[index] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="h-14 w-12 rounded-full bg-slate-100 text-center text-xl font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>

          <Button
            onClick={verifyOtp}
            disabled={loading}
            className="w-full h-12 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify & Proceed"}
          </Button>

          <div className="mt-6 text-center text-sm text-slate-500">
            Resend code in{" "}
            <span className="text-blue-600 font-bold">
              00:{seconds.toString().padStart(2, "0")}
            </span>
          </div>

          <Button
            onClick={resendOtp}
            disabled={seconds > 0}
            variant="outline"
            className="mt-3 text-sm font-semibold text-blue-600 disabled:text-slate-400"
          >
            Resend Code
          </Button>

          <Button
            onClick={() => router.push("/auth/login")}
            variant="outline"
            className="mt-8 text-sm text-slate-500 hover:text-blue-600 flex items-center justify-center gap-2"
          >
            ← Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
