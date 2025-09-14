import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing reset link ❌");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters ❌");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to reset password ❌");
      } else {
        toast.success("Password reset successful ✅");
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Toaster position="top-center" />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200">
          Reset Password
        </h2>

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
    </div>
  );
}
