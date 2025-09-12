import { Navigate } from "react-router-dom";

export default function RequireOtpGate({ children }) {
  const pendingEmail = sessionStorage.getItem("pendingEmail");
  if (!pendingEmail) return <Navigate to="/email" replace />;
  return children;
}
