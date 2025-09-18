import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import * as yup from "yup";

/* ---------- Yup schema ---------- */
const otpSchema = yup.object({
  code: yup
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .matches(/^\d{6}$/, "OTP must contain only numbers"),
});

export default function AuthOTP({ onVerify }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const email = location.state?.email || sessionStorage.getItem("pendingEmail");

  useEffect(() => {
    if (!email && window.location.pathname === "/otp") {
      navigate("/email", { replace: true });
    } else {
      inputs.current[0]?.focus();
    }
  }, [email, navigate]);

  const fullCode = useMemo(() => otp.join(""), [otp]);

  const submitCode = useCallback(
    async (code) => {
      if (submitting) return;
      setSubmitting(true);

      try {
        await otpSchema.validate({ code });

        const res = await fetch(`${VITE_API_BASE_URL}/api/auth/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
          credentials: "include",
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Invalid OTP");
        }

        const data = await res.json();
        localStorage.setItem("user_id", data.userId);
        localStorage.setItem("user_email", email);
        localStorage.setItem("user_role", "ROLE_USER");
        if (data.name) localStorage.setItem("user_name", data.name);
        if (data.token) localStorage.setItem("user_token", data.token);

        sessionStorage.removeItem("pendingEmail");
        onVerify?.(data);
        navigate("/", { replace: true });
        window.location.reload();
      } catch (e) {
        toast.error(e.message || "Network error. Please try again.");
        setSubmitting(false);
      }
    },
    [submitting, email, onVerify, navigate]
  );

  const handleChange = (i, val) => {
    if (val.length > 1) val = val[0];
    const newOtp = [...otp];
    newOtp[i] = val;
    setOtp(newOtp);
    if (val && i < 5) inputs.current[i + 1].focus();
    const code = newOtp.join("");
    if (code.length === 6) submitCode(code);
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputs.current[i - 1].focus();
    }
  };

  useEffect(() => {
    const onPaste = (e) => {
      const pasted = e.clipboardData.getData("text")?.trim();
      if (!/^\d{6}$/.test(pasted)) return;
      e.preventDefault();
      const newOtp = pasted.split("");
      setOtp(newOtp);
      inputs.current[5].focus();
      submitCode(pasted);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [submitting, submitCode]);

  if (!email) return null;

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          {/* Heading */}
          <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">
            Verify OTP
          </h1>
          <p className="mb-8 text-center text-sm text-gray-500">
            We’ve sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>
          </p>

          {/* OTP inputs */}
          <div className="mb-6 flex justify-between gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKey(i, e)}
                disabled={submitting}
                className="h-14 w-12 rounded-lg border border-gray-300 bg-gray-50 text-center text-xl font-semibold 
                           text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 
                           focus:outline-none transition disabled:opacity-50"
              />
            ))}
          </div>

          {/* Verify button */}
          <button
            onClick={() => submitCode(fullCode)}
            disabled={submitting || fullCode.length !== 6}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 py-3 
                       text-white font-semibold shadow-md hover:from-indigo-700 hover:to-blue-700 
                       focus:ring-2 focus:ring-indigo-500 focus:outline-none transition 
                       disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Verifying…" : "Verify Code"}
          </button>

          {/* Resend link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Didn’t receive the code?{" "}
            <button
              type="button"
              className="text-indigo-600 font-medium hover:underline"
              onClick={() => toast("Resend OTP functionality here")}
            >
              Resend
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
