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
import "../App.css";
import RouterErrorBoundary from "@/components/utils/RouterErrorBoundary";
import CategoryProducts from "../pages/products/CategoryProducts";
import AppLayout from "../layout/AppLayout";
import CartPage from "../pages/cart/CartPage";
import ProductManagement from "../pages/admin/dashboard/ProductManagement";
import ProductPage from "../pages/products/ProductPage";
import UserManagement from "../pages/admin/dashboard/UserManagement";
import CheckoutPage from "../pages/checkout/CheckoutPage";
import OrderSuccessPage from "../pages/order/OrderSuccessPage";
import MyOrdersPage from "../pages/order/MyOrdersPage";
import OrderDetailsPage from "../pages/order/OrderDetailsPage";

const router = createBrowserRouter([
  {
    element: <AppLayout />, // 👈 wrapper
    errorElement: <RouterErrorBoundary />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/email", element: <AuthEmail /> },
      {
        path: "/otp",
        element: (
          <RequireOtpGate>
            <AuthOTP />
          </RequireOtpGate>
        ),
      },
      { path: "/profile", element: <Profile /> },
      { path: "/admin/login", element: <LoginPage /> },
      { path: "/admin/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/admin/reset-password", element: <ResetPasswordPage /> },
      { path: "/admin/dashboard", element: <AdminDashboard /> },
      { path: "/admin/categories", element: <CategoryManagement /> },
      { path: "/category/:id", element: <CategoryProducts /> },
      { path: "/admin/products", element: <ProductManagement /> },
      { path: "/products/:id", element: <ProductPage /> },
      { path: "/cart", element: <CartPage userId={localStorage.getItem("user_id")} />},
      { path: "/admin/users", element: <UserManagement /> },
      { path: "/checkout", element: <CheckoutPage /> },
      { path: "/cart", element: <CartPage /> },
      { path: "/order-details", element: <OrderSuccessPage /> },
      { path: "/my-orders", element: <MyOrdersPage /> },
      { path: "/orders/:id", element: <OrderDetailsPage /> },
      { path: "*", element: <RouterErrorBoundary /> },
    ],
  },
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
