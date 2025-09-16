import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // ✅ new state for persistent info

  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(""); // clear previous message

    try {
      const res = await fetch(
        `${VITE_API_BASE_URL}/api/admin/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to send reset link ❌");
      } else {
        toast.success("Password reset link sent 📧");
        setMessage(
          "✅ Please check your email inbox (and spam folder) for the reset link."
        );
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      toast.error("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* ✅ increased toast stay time */}
      <Toaster position="top-center" toastOptions={{ duration: 6000 }} />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200">
          Forgot Password
        </h2>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@site.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>

        {/* ✅ Persistent success message */}
        {message && (
          <p className="text-sm text-green-600 text-center mt-2">{message}</p>
        )}

        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
          Remembered?{" "}
          <a
            href="/admin/login"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Back to Login
          </a>
        </p>
      </form>
    </div>
  );
}
