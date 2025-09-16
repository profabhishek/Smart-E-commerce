import { Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 toggle state
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ✅ Auto-redirect if already logged in
  useEffect(() => {
    const role = localStorage.getItem("admin_role");
    if (role === "ROLE_ADMIN") {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

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
      const res = await fetch(`${VITE_API_BASE_URL}/api/admin/auth/login`, {
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
        if (res.status === 401 || res.status === 403) {
          toast.error("Invalid admin credentials ❌");
        } else {
          toast.error(data.message || "Login failed ❌");
        }
      } else {
          localStorage.setItem("admin_token", data.token);
          localStorage.setItem("admin_role", data.role);
          localStorage.setItem("admin_name", data.name || "Admin");
        toast.success("Login successful 🚀");
        setTimeout(() => navigate("/admin/dashboard"), 800);
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
      <Toaster position="top-center" />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200">
          Admin Login
        </h2>

        {/* Email field */}
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

        {/* Password field with interactive eye toggle */}
        <div className="space-y-2 relative">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-7.5 text-gray-500 hover:text-green-600 transition-transform transform hover:scale-110 active:scale-95 cursor-pointer"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>

          {/* 🔹 Forgot password link */}
          <div className="flex justify-end mt-1">
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
