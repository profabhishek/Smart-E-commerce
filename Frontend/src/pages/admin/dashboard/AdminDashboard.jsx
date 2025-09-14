import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  BarChart3,
  LogOut,
  Settings,
  DollarSign,
  Package,
  IndianRupee,
} from "lucide-react";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // ✅ Auto-redirect if not logged in as admin
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ROLE_ADMIN") {
      navigate("/admin/login");
    }
  }, [navigate]);

  // ✅ Logout function (calls backend API)
    const handleLogout = async () => {
    try {
        await fetch("http://localhost:8080/api/admin/auth/logout", {
        method: "POST",
        credentials: "include",
        });
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("name"); // ✅ fixed
        navigate("/admin/login", { replace: true }); // ✅ ensures redirect without refresh
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
            className="text-gray-600 hover:text-green-700"
          >
            ☰
          </button>
        </div>
        <nav className="mt-4 space-y-2">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-green-100"
          >
            <LayoutDashboard size={20} />
            {sidebarOpen && "Dashboard"}
          </Link>
          <Link
            to="/admin/products"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-green-100"
          >
            <ShoppingBag size={20} />
            {sidebarOpen && "Products"}
          </Link>
          <Link
            to="/admin/orders"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-green-100"
          >
            <BarChart3 size={20} />
            {sidebarOpen && "Orders"}
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-green-100"
          >
            <Users size={20} />
            {sidebarOpen && "Users"}
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-green-100"
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
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Welcome, {localStorage.getItem("name") || "Admin"} 👋
          </h2>
          <div className="flex items-center gap-4">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">
              Add Product
            </button>
            <button className="bg-gray-100 px-4 py-2 rounded-lg shadow hover:bg-gray-200">
              Manage Store
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md">
            <h3 className="text-gray-500 text-sm">Total Revenue</h3>
            <p className="text-2xl font-bold flex items-center gap-1">
              <IndianRupee size={18} /> 1,25,000
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md">
            <h3 className="text-gray-500 text-sm">Orders</h3>
            <p className="text-2xl font-bold">342</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md">
            <h3 className="text-gray-500 text-sm">Active Products</h3>
            <p className="text-2xl font-bold flex items-center gap-1">
              <Package size={18} /> 128
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md">
            <h3 className="text-gray-500 text-sm">Customers</h3>
            <p className="text-2xl font-bold">85</p>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="py-2 px-3">Order ID</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">#1001</td>
                <td className="py-2 px-3">Abhishek Jha</td>
                <td className="py-2 px-3">₹499</td>
                <td className="py-2 px-3 text-green-600 font-semibold">Paid</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">#1002</td>
                <td className="py-2 px-3">Rituraj Mahapatra</td>
                <td className="py-2 px-3">₹799</td>
                <td className="py-2 px-3 text-yellow-600 font-semibold">Pending</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-2 px-3">#1003</td>
                <td className="py-2 px-3">Virat Kohli</td>
                <td className="py-2 px-3">₹999</td>
                <td className="py-2 px-3 text-red-600 font-semibold">Cancelled</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
