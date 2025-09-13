import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthFlow from "../pages/auth/authFlow";
import AuthEmail from "../pages/auth/authEmail";
import AuthOTP from "../pages/auth/authOtp";
import RequireOtpGate from "./RequireOtpGate";
import Profile from "../pages/users/Profile";

const router = createBrowserRouter([
  { path: "/", element: <Header /> },
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
