import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthFlow from "../pages/auth/authFlow";
import AuthEmail from "../pages/auth/authEmail";
import AuthOTP from "../pages/auth/authOtp";
import RequireOtpGate from "./RequireOtpGate";
import Profile from "../pages/users/Profile";
import Header from "../pages/Home/Header";

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
]);

export default function RoutesRoot() {
  return <RouterProvider router={router} />;
}
