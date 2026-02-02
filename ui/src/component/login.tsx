"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Listen to auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Send OTP
  const sendOtp = async () => {
    if (!email) {
      alert("Please enter email");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);

    if (error) alert(error.message);
    else setStep("otp");
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (!otp) {
      alert("Enter OTP");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: "email",
    });
    setLoading(false);

    if (error) alert(error.message);
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStep("email");
    setEmail("");
    setOtp("");
  };

  return (
    <div style={{ padding: 30 }}>
      {!user ? (
        step === "email" ? (
          <>
            <h2>Email Login</h2>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <br />
            <br />
            <button onClick={sendOtp} disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            <h2>Enter OTP</h2>
            <input
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <br />
            <br />
            <button onClick={verifyOtp} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </>
        )
      ) : (
        <>
          <h2>Logged In</h2>
          <p>{user.email}</p>
          <button onClick={logout}>Logout</button>
        </>
      )}
    </div>
  );
}
