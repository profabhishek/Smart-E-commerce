import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthEmail() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // 🔐 Auto-redirect if already logged in as USER
  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const role = localStorage.getItem("user_role");
      if (role === "ROLE_USER") {
        navigate("/", { replace: true });
        return;
      }

      try {
        const res = await fetch(`${VITE_API_BASE_URL}/api/user/profile`, {
          method: "GET",
          credentials: "include",
        });

        if (!cancelled && res.ok) {
          const user = await res.json();
          localStorage.setItem("user_role", "ROLE_USER");
          if (user?.name && user.name.trim()) {
            localStorage.setItem("user_name", user.name);
          } else if (user?.email) {
            localStorage.setItem("user_name", user.email.split("@")[0]);
          } else {
            localStorage.setItem("user_name", "User");
          }
          navigate("/", { replace: true });
          return;
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    };

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSend = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      alert("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${VITE_API_BASE_URL}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
        credentials: "include",
      });

      if (!res.ok) {
        let errMsg = "Failed to send OTP";
        try {
          const err = await res.json();
          errMsg = err.message || errMsg;
        } catch {}
        alert(errMsg);
        return;
      }

      sessionStorage.setItem("pendingEmail", cleanEmail);
      navigate("/otp", { replace: true });
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
          <div className="h-10 w-full bg-gray-200 rounded mb-4" />
          <div className="h-10 w-full bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {/* Brand / Heading */}
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">
          Poster Pataka
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          Sign in to Poster Pataka with your email
        </p>

        {/* Input */}
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Please Enter your Email"
          disabled={loading}
          className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 shadow-sm 
                     focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
        />

        {/* Button */}
        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 
                     text-white font-semibold shadow-md hover:from-indigo-700 hover:to-blue-700 
                     focus:ring-2 focus:ring-indigo-500 focus:outline-none transition disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Sending…" : "Send OTP"}
        </button>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-gray-400">
          By continuing, you agree to our{" "}
            Terms of Service{" "}and{" "}Privacy Policy
          .
        </p>
      </div>
    </div>
  );
}
