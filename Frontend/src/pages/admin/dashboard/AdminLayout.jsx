import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  BarChart3,
  LogOut,
  Settings,
  Package,
} from "lucide-react";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ✅ Logout function
  const handleLogout = async () => {
    try {
      await fetch(`${VITE_API_BASE_URL}/api/admin/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_role");
      localStorage.removeItem("admin_name");
      navigate("/admin/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white shadow-lg transition-all duration-300`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h1
            className={`text-2xl font-extrabold text-green-700 ${
              !sidebarOpen && "hidden"
            }`}
          >
            Poster Pataka
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-green-700 cursor-pointer"
          >
            ☰
          </button>
        </div>
        <nav className="mt-4 space-y-2">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-green-100 cursor-pointer"
          >
            <LayoutDashboard size={20} />
            {sidebarOpen && "Dashboard"}
          </Link>
          <Link
            to="/admin/products"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-green-100 cursor-pointer"
          >
            <ShoppingBag size={20} />
            {sidebarOpen && "Products"}
          </Link>
          <Link
            to="/admin/categories"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-green-100 cursor-pointer"
          >
            <Package size={20} />
            {sidebarOpen && "Categories"}
          </Link>
          <Link
            to="/admin/orders"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-green-100 cursor-pointer"
          >
            <BarChart3 size={20} />
            {sidebarOpen && "Orders"}
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-green-100 cursor-pointer"
          >
            <Users size={20} />
            {sidebarOpen && "Users"}
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-green-100 cursor-pointer"
          >
            <Settings size={20} />
            {sidebarOpen && "Settings"}
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-100 cursor-pointer"
          >
            <LogOut size={20} />
            {sidebarOpen && "Logout"}
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
