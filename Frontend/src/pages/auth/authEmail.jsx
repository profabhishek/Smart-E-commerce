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
      // 1) Fast path: localStorage says user is logged in
      const role = localStorage.getItem("user_role");
      if (role === "ROLE_USER") {
        navigate("/", { replace: true });
        return;
      }

      // 2) Slow path: ask backend (uses httpOnly cookie `user_jwt`)
      try {
        const res = await fetch(`${VITE_API_BASE_URL}/api/user/profile`, {
          method: "GET",
          credentials: "include",
        });

        if (!cancelled && res.ok) {
          const user = await res.json();
          // Persist minimal session info for UI
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

      // Store for OTP step
      sessionStorage.setItem("pendingEmail", cleanEmail);
      navigate("/otp", { replace: true });
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    // small skeleton while we check server session
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
          <div className="h-10 w-full bg-gray-200 rounded mb-4" />
          <div className="h-10 w-full bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-center text-2xl font-semibold">Sign in</h1>

        <label className="mb-2 block text-sm font-medium text-gray-700">
          E-mail
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
          className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send OTP"}
        </button>
      </div>
    </div>
  );
}
