import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { Edit, Trash2, Plus, Info } from "lucide-react";
import toast from "react-hot-toast";

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ id: null, name: "", description: "", icon: "" });
  const [originalCategory, setOriginalCategory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const navigate = useNavigate();
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const role = localStorage.getItem("admin_role");
    if (role !== "ROLE_ADMIN") {
      navigate("/admin/login");
    } else {
      fetchCategories();
    }
  }, [navigate]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${VITE_API_BASE_URL}/api/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setIsEditing(false);
    setForm({ id: null, name: "", description: "", icon: "" });
    setOriginalCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing
      ? `${VITE_API_BASE_URL}/api/admin/categories/${form.id}`
      : `${VITE_API_BASE_URL}/api/admin/categories`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          icon: form.icon,
        }),
      });
      if (!res.ok) throw new Error("Save failed");

      if (isEditing) {
        toast.success("Category updated successfully!");
      } else {
        toast.success("Category created successfully!");
      }

      startCreate();
      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save category");
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      // 🔍 Check if category has products
      const productRes = await fetch(`${VITE_API_BASE_URL}/api/products?categoryId=${deleteId}`);
      if (!productRes.ok) throw new Error("Failed to check products");
      const products = await productRes.json();

      if (products.length > 0) {
        toast.error(
          `Cannot delete: This category has ${products.length} product(s) linked. Remove/move products first.`
        );
        setShowDeleteModal(false);
        return;
      }

      // ✅ No products → safe to delete
      const res = await fetch(`${VITE_API_BASE_URL}/api/admin/categories/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Category deleted successfully!");
      if (isEditing && form.id === deleteId) startCreate();
      fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      toast.error("Failed to delete category");
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  // ✅ Validation logic
  const isFormFilled = form.name.trim() !== "";
  const isFormChanged =
    isEditing &&
    originalCategory &&
    (form.name !== originalCategory.name ||
      form.description !== originalCategory.description ||
      form.icon !== originalCategory.icon);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Manage Categories</h2>

        {/* Info banner in Edit mode */}
        {isEditing && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-start gap-3">
            <Info size={18} className="mt-[2px]" />
            <div>
              <span className="inline-flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white">
                  Editing
                </span>
                <span className="font-medium">
                  #{form.id} — {form.name || "Untitled"}
                </span>
              </span>
              <div className="mt-1">
                You’re updating an existing category. To add a new one, click{" "}
                <b>New Category</b>.
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Form */}
        <div className="bg-white p-6 rounded-xl shadow mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Plus size={18} />
              {isEditing ? "Edit Category" : "Create Category"}
            </h3>

            {isEditing && (
              <button
                onClick={startCreate}
                className="text-sm px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer"
              >
                + New Category
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Category Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <input
              type="url"
              placeholder="Icon URL"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
            />

            <div className="col-span-full flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                disabled={isEditing ? !isFormChanged : !isFormFilled}
                className={`${
                  isEditing
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                } text-white px-4 py-2 rounded-lg ${
                  (isEditing ? !isFormChanged : !isFormFilled) &&
                  "opacity-50 cursor-not-allowed"
                }`}
              >
                {isEditing ? "Save Changes" : "Create Category"}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer"
                >
                  New Category
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">All Categories</h3>

          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col style={{ width: "7rem" }} />
                  <col style={{ width: "6rem" }} />
                  <col style={{ width: "18rem" }} />
                  <col />
                  <col style={{ width: "8rem" }} />
                </colgroup>

                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600 uppercase text-xs tracking-wide">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Icon</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{cat.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <img
                            src={cat.icon}
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/32x32?text=🖼️";
                            }}
                            alt={cat.name}
                            className="w-8 h-8 rounded object-cover mr-7"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">{cat.name}</td>
                      <td className="py-3 px-4">
                        <div className="truncate" title={cat.description}>
                          {cat.description}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setForm({
                                id: cat.id,
                                name: cat.name || "",
                                description: cat.description || "",
                                icon: cat.icon || "",
                              });
                              setOriginalCategory({
                                name: cat.name || "",
                                description: cat.description || "",
                                icon: cat.icon || "",
                              });
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => confirmDelete(cat.id)}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">
                        No categories found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[rgba(173,216,230,0.4)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this category? This action cannot be undone.
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
    </AdminLayout>
  );
}
