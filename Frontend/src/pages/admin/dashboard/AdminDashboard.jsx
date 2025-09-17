import AdminLayout from "./AdminLayout";
import { IndianRupee, Package } from "lucide-react";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          Welcome, {localStorage.getItem("admin_name") || "Admin"} 👋
        </h2>
        <div className="flex items-center gap-4">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 cursor-pointer">
            Add Product
          </button>
          <button
            onClick={() => (window.location.href = "/admin/categories")}
            className="bg-gray-300 px-4 py-2 rounded-lg shadow hover:bg-gray-600 hover:text-white cursor-pointer"
          >
            Create Category
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
    </AdminLayout>
  );
}
