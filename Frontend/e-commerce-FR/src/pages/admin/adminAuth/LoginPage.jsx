import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!executeRecaptcha) {
      toast.error("Recaptcha not yet available ❌");
      return;
    }

    setLoading(true);

    try {
      const recaptchaToken = await executeRecaptcha("admin_login");

      const res = await fetch("http://localhost:8080/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          recaptchaToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Login failed ❌");
      } else {
        toast.success("Login successful 🚀");
        setTimeout(() => navigate("/admin"), 1000);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* 🔥 Styled toaster */}
  <Toaster
    position="top-center"
    toastOptions={{
      duration: 3000,
      style: {
        background: "#fff",          // light background
        color: "#111827",            // gray-900 text
        border: "1px solid #e5e7eb", // gray-200 border
        borderRadius: "0.75rem",     // rounded-xl
        padding: "12px 16px",
        fontSize: "14px",
        fontWeight: "500",
        boxShadow:
          "0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)", // subtle shadow
      },
      success: {
        iconTheme: {
          primary: "#16a34a", // green-600
          secondary: "#fff",
        },
      },
      error: {
        iconTheme: {
          primary: "#dc2626", // red-600
          secondary: "#fff",
        },
      },
    }}
  />

<form
  onSubmit={handleSubmit}
  className="w-full max-w-sm bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-4"
>
  <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200">
    Admin Login
  </h2>

  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input
      id="email"
      name="email"
      type="email"
      placeholder="Enter admin email"
      value={form.email}
      onChange={handleChange}
      required
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="password">Password</Label>
    <Input
      id="password"
      name="password"
      type="password"
      placeholder="Enter password"
      value={form.password}
      onChange={handleChange}
      required
    />

    {/* 🔹 Forgot password link */}
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => navigate("/admin/forgot-password")}
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
      >
        Forgot password?
      </button>
    </div>
  </div>

  <Button type="submit" className="w-full" disabled={loading}>
    {loading ? "Logging in..." : "Login"}
  </Button>
</form>

    </div>
  );
}
