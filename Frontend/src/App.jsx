import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import RouterErrorBoundary from "./components/utils/RouterErrorBoundary";

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
    </BrowserRouter>
  );
}

export default App;
