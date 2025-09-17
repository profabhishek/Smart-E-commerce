import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthEmail from "../pages/auth/authEmail";
import AuthOTP from "../pages/auth/authOtp";
import RequireOtpGate from "./RequireOtpGate";
import Profile from "../pages/users/Profile";
import LoginPage from "../pages/admin/adminAuth/LoginPage";
import ForgotPasswordPage from "../pages/admin/adminAuth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/admin/adminAuth/ResetPasswordPage";
import AdminDashboard from "../pages/admin/dashboard/AdminDashboard";
import HomePage from "../pages/Home/HomePage";
import CategoryManagement from "../pages/admin/dashboard/CategoryManagement";
import { Toaster } from "react-hot-toast";
import "../App.css"
import RouterErrorBoundary from "@/components/utils/RouterErrorBoundary";

const router = createBrowserRouter([
  { path: "/", element: <HomePage />, errorElement: <RouterErrorBoundary /> },
  { path: "/email", element: <AuthEmail />, errorElement: <RouterErrorBoundary /> },
  { path: "/otp", element: (<RequireOtpGate><AuthOTP /></RequireOtpGate>), errorElement: <RouterErrorBoundary /> },
  { path: "/profile", element: <Profile />, errorElement: <RouterErrorBoundary /> },
  { path: "/admin/login", element: <LoginPage />, errorElement: <RouterErrorBoundary /> },
  { path: "/admin/forgot-password", element: <ForgotPasswordPage />, errorElement: <RouterErrorBoundary /> },
  { path: "/admin/reset-password", element: <ResetPasswordPage />, errorElement: <RouterErrorBoundary /> },
  { path: "/admin/dashboard", element: <AdminDashboard />, errorElement: <RouterErrorBoundary /> },
  { path: "/admin/categories", element: <CategoryManagement />, errorElement: <RouterErrorBoundary /> },
  { path: "*", element: <RouterErrorBoundary /> },
]);

export default function RoutesRoot() {
  return (
    <>
      <RouterProvider router={router} />
      {/* ✅ Global Toaster here */}

<Toaster
  position="top-center"
  toastOptions={{
    duration: 3000,
    className: "toast-animate",
    style: {
      background: "white",
      border: "1px solid #e5e7eb", // gray-200 border
      color: "#111827", // gray-900
      fontSize: "14px",
      padding: "12px 16px",
      borderRadius: "8px",
      boxShadow:
        "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
      fontWeight: 500,
    },
    success: {
      iconTheme: {
        primary: "#16a34a", // green-600
        secondary: "#ecfdf5", // green-50
      },
    },
    error: {
      iconTheme: {
        primary: "#dc2626", // red-600
        secondary: "#fef2f2", // red-50
      },
    },
    loading: {
      iconTheme: {
        primary: "#3b82f6", // blue-500
        secondary: "#eff6ff", // blue-50
      },
    },
  }}
/>

    </>
  );
}
