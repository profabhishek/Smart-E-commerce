import { useState } from "react";

export default function AuthEmail({ onSent }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

const handleSend = async () => {
  if (!email) return;
  setLoading(true);

  try {
    const res = await fetch("http://localhost:8080/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.message || "Failed to send OTP");
      return;
    }

    onSent(email);
  } catch (error) {
    alert("Network error. Please try again.");
  } finally {
    setLoading(false);
  }
};

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
          className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-60">
          {loading ? "Sending…" : "Send OTP"}
        </button>
      </div>
    </div>
  );
}
