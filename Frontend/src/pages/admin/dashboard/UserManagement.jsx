import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { Edit, Trash2, Info } from "lucide-react";
import toast from "react-hot-toast";
import AddressManager from "./AddressManager";

export default function UserManagement() {
  const formRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    id: null,
    email: "",
    name: "",
    phone: "",
    role: "USER",
    verified: false,
  });
  const [originalUser, setOriginalUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterVerified, setFilterVerified] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Address Manager state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const navigate = useNavigate();
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const role = localStorage.getItem("admin_role");
    if (role !== "ROLE_ADMIN") {
      navigate("/admin/login");
    } else {
      fetchUsers();
    }
  }, [navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${VITE_API_BASE_URL}/api/admin/users`, {
        credentials: "include",
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setIsEditing(false);
    setForm({ id: null, email: "", name: "", phone: "", role: "USER", verified: false });
    setOriginalUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing
      ? `${VITE_API_BASE_URL}/api/admin/users/${form.id}`
      : `${VITE_API_BASE_URL}/api/admin/users`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");

      toast.success(isEditing ? "User updated successfully!" : "User created successfully!");
      startCreate();
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save user");
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${VITE_API_BASE_URL}/api/admin/users/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");

      toast.success("User deleted successfully!");
      if (isEditing && form.id === deleteId) startCreate();
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("Failed to delete user");
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  // ✅ Filtering + search
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (!q || u.email.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q)) &&
      (!filterRole || u.role === filterRole) &&
      (!filterVerified ||
        (filterVerified === "true" ? u.verified : !u.verified))
    );
  });

  const isFormFilled = form.email.trim() !== "" && form.role.trim() !== "";
  const isFormChanged =
    isEditing &&
    originalUser &&
    (form.email !== originalUser.email ||
      form.name !== originalUser.name ||
      form.phone !== originalUser.phone ||
      form.role !== originalUser.role ||
      form.verified !== originalUser.verified);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Manage Users</h2>

        {/* Info banner */}
        {isEditing && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-start gap-3">
            <Info size={18} className="mt-[2px]" />
            <div>
              <span className="inline-flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white">
                  Editing
                </span>
                <span className="font-medium">
                  #{form.id} — {form.email}
                </span>
              </span>
              <div className="mt-1">You’re updating an existing user.</div>
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        <div ref={formRef} className="bg-white p-6 rounded-xl shadow mb-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select
              value={form.verified}
              onChange={(e) => setForm({ ...form, verified: e.target.value === "true" })}
              className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="false">Not Verified</option>
              <option value="true">Verified</option>
            </select>

            <div className="col-span-full flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isEditing ? !isFormChanged : !isFormFilled}
                className={`${
                  isEditing ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700 cursor-pointer"
                } text-white px-4 py-2 rounded-lg ${
                  (isEditing ? !isFormChanged : !isFormFilled) &&
                  "opacity-50 cursor-not-allowed"
                }`}
              >
                {isEditing ? "Save Changes" : "Create User"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer"
                >
                  New User
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded-lg flex-1 min-w-[200px]"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border p-2 rounded-lg"
          >
            <option value="">All Roles</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <select
            value={filterVerified}
            onChange={(e) => setFilterVerified(e.target.value)}
            className="border p-2 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="true">Verified</option>
            <option value="false">Not Verified</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow p-6">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wide">
                    <th className="py-3 px-4 text-left">ID</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Phone</th>
                    <th className="py-3 px-4 text-left">Role</th>
                    <th className="py-3 px-4 text-left">Verified</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{u.id}</td>
                      <td className="py-3 px-4 font-semibold">{u.email}</td>
                      <td className="py-3 px-4">{u.name}</td>
                      <td className="py-3 px-4">{u.phone}</td>
                      <td className="py-3 px-4">{u.role}</td>
                      <td className="py-3 px-4">
                        {u.verified ? (
                          <span className="text-green-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-red-600 font-medium">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => {
                                    setIsEditing(true);
                                    setForm({ ...u });
                                    setOriginalUser({ ...u });
                                    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                                className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                >
                                <Edit size={18} />
                            </button>

                            <button
                                onClick={() => confirmDelete(u.id)}
                                className="text-red-600 hover:text-red-800 cursor-pointer"
                            >
                                <Trash2 size={18} />
                            </button>

                            <button
                                onClick={() => {
                                setSelectedUser(u);
                                setShowAddressModal(true);
                                }}
                                className="text-green-600 hover:text-green-800 cursor-pointer"
                            >
                                Manage Addresses
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w/full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Modal */}
      {showAddressModal && (
        <AddressManager
          user={selectedUser}
          onClose={() => setShowAddressModal(false)}
          VITE_API_BASE_URL={VITE_API_BASE_URL}
        />
      )}
    </AdminLayout>
  );
}
