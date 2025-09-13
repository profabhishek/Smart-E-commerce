import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthFlow from "../pages/auth/authFlow";
import AuthEmail from "../pages/auth/authEmail";
import AuthOTP from "../pages/auth/authOtp";
import RequireOtpGate from "./RequireOtpGate";
import Profile from "../pages/users/Profile";
import LoginPage from "../pages/admin/adminAuth/LoginPage";
import ForgotPasswordPage from "../pages/admin/adminAuth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/admin/adminAuth/ResetPasswordPage";

const router = createBrowserRouter([
  { path: "/", element: <AuthFlow /> },
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
]);

export default function RoutesRoot() {
  return <RouterProvider router={router} />;
}
