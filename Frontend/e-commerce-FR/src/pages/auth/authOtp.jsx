import { useState, useRef, useEffect } from "react";

export default function AuthOTP({ email, onVerify }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef([]);

  useEffect(() => inputs.current[0]?.focus(), []);

  const handleChange = (i, val) => {
    if (val.length > 1) val = val[0];
    const newOtp = [...otp];
    newOtp[i] = val;
    setOtp(newOtp);

    if (val && i < 5) inputs.current[i + 1].focus();
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputs.current[i - 1].focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    await fetch("/api/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
    onVerify();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 className="mb-2 text-center text-2xl font-semibold">Enter OTP</h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          We sent a code to {email}
        </p>

        <div className="mb-4 flex justify-between gap-2">
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
              className="h-12 w-12 rounded-lg border border-gray-300 text-center text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700">
          Verify
        </button>
      </div>
    </div>
  );
}
