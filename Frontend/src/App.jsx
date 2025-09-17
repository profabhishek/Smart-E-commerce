import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import RouterErrorBoundary from "./components/utils/RouterErrorBoundary";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Login */}
        <Route
          path="/admin/login"
          element={<AdminLogin />}
          errorElement={<RouterErrorBoundary />}
        />

        {/* Protected Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
          errorElement={<RouterErrorBoundary />}
        />

        {/* Default route (optional) */}
        <Route
          path="*"
          element={<AdminLogin />}
          errorElement={<RouterErrorBoundary />}
        />
      </Routes>

      {/* ✅ Global Toaster mounted once */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#333",
            fontSize: "14px",
          },
          success: {
            style: {
              border: "1px solid #16a34a",
              padding: "12px",
            },
          },
          error: {
            style: {
              border: "1px solid #dc2626",
              padding: "12px",
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
