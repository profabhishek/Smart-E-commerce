import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { Edit, Trash2, Plus, Tag as TagIcon, Search, X, Upload } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

/**
 * ⚠️ IMPORTANT
 * Wire this to your real uploader that returns public URLs.
 * Expected response: string[] of uploaded file URLs.
 * Example backend (multipart): POST /api/admin/uploads
 */
async function uploadFiles(productId, files, VITE_API_BASE_URL) {
  try {
    const formData = new FormData();
    [...files].forEach((f) => formData.append("files", f));

    const res = await fetch(
      `${VITE_API_BASE_URL}/api/admin/products/${productId}/photos`,
      {
        method: "POST",
        body: formData,
        credentials: "include",
      }
    );

    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json(); // expect { urls: [...] }
    if (Array.isArray(data?.urls)) return data.urls;
    throw new Error("Unexpected upload response");
  } catch (e) {
    console.error(e);
    toast.error(e.message || "Upload error");
    return [];
  }
}

function initialForm() {
  return {
    id: null,
    sku: "",
    name: "",
    description: "",
    photos: [""], // array of URLs (strings)
    price: "",
    discountPrice: "",
    rating: "",
    stock: "",
    inStock: true,
    size: "",
    material: "",
    width: "",
    height: "",
    weight: "",
    tags: [], // array of strings (chips)
    categoryId: "",
  };
}

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState(initialForm());
  const [originalProduct, setOriginalProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Search + Filters
  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterMinRating, setFilterMinRating] = useState("");
  const [filterInStock, setFilterInStock] = useState(false);
  const [sortBy, setSortBy] = useState("newest"); // newest | priceAsc | priceDesc | ratingDesc

  // Tag input temp
  const [tagInput, setTagInput] = useState("");

  const navigate = useNavigate();
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const formRef = useRef(null);

  useEffect(() => {
    const role = localStorage.getItem("admin_role");
    if (role !== "ROLE_ADMIN") {
      navigate("/admin/login");
    } else {
      fetchProducts();
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

    const fetchProducts = async () => {
    setLoading(true);
    try {
        const res = await fetch(`${VITE_API_BASE_URL}/api/products`);
        const data = await res.json();

        const normalized = Array.isArray(data)
        ? data.map((p) => ({
            ...p,
            photos: (p.photos || []).map((ph) => ph.photo_url || ph), // ✅ extract URLs
            }))
        : [];

        setProducts(normalized);
    } catch (e) {
        console.error(e);
        toast.error("Failed to load products");
    } finally {
        setLoading(false);
    }
    };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${VITE_API_BASE_URL}/api/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load categories");
    }
  };

  const startCreate = () => {
    setIsEditing(false);
    setForm(initialForm());
    setOriginalProduct(null);
    setTagInput("");
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const normalized = (obj) => {
    // Normalize arrays & numeric strings for comparison
    const clone = JSON.parse(JSON.stringify(obj));
    clone.price = clone.price === "" ? "" : Number(clone.price);
    clone.discountPrice = clone.discountPrice === "" ? "" : Number(clone.discountPrice);
    clone.rating = clone.rating === "" ? "" : Number(clone.rating);
    clone.stock = clone.stock === "" ? "" : Number(clone.stock);
    clone.tags = (clone.tags || []).map((t) => t.trim()).filter(Boolean);
    clone.photos = (clone.photos || []).map((p) => (p || "").trim()).filter(Boolean);
    return clone;
  };

  const isFormFilled = form.name.trim() !== "" && form.categoryId !== "";
  const isFormChanged = useMemo(() => {
    if (!isEditing || !originalProduct) return false;
    return JSON.stringify(normalized(form)) !== JSON.stringify(normalized(originalProduct));
  }, [form, isEditing, originalProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.categoryId) {
      toast.error("Please select a category");
      return;
    }

    const url = isEditing
      ? `${VITE_API_BASE_URL}/api/admin/products/${form.id}?categoryId=${form.categoryId}`
      : `${VITE_API_BASE_URL}/api/admin/products?categoryId=${form.categoryId}`;
    const method = isEditing ? "PUT" : "POST";

    const {
      id,
      categoryId,
      // keep arrays in body: photos[], tags[]
      ...payload
    } = form;

    // Build body ensuring numeric types where relevant
    const body = {
      ...payload,
      price: form.price === "" ? undefined : Number(form.price),
      discountPrice: form.discountPrice === "" ? undefined : Number(form.discountPrice),
      rating: form.rating === "" ? undefined : Number(form.rating),
      stock: form.stock === "" ? undefined : Number(form.stock),
      photos: (form.photos || []).map((p) => p.trim()).filter(Boolean),
      tags: (form.tags || []).map((t) => t.trim()).filter(Boolean),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success(isEditing ? "Product updated!" : "Product created!");
      startCreate();
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save product");
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${VITE_API_BASE_URL}/api/admin/products/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");

      toast.success("Product deleted!");
      if (isEditing && form.id === deleteId) startCreate();
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete product");
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  // TAGS: add on comma or Enter
  const tryAddTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput("");
  };
  const onTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      tryAddTag();
    } else if (e.key === "Backspace" && !tagInput && form.tags.length) {
      // remove last tag on backspace when input empty
      setForm((f) => ({ ...f, tags: f.tags.slice(0, -1) }));
    }
  };
  const removeTag = (t) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }));
  };

// PHOTOS: add/remove URL inputs
const addPhotoField = () => {
  setForm((f) => ({ ...f, photos: [...f.photos, { id: null, url: "" }] }));
};

const setPhotoAt = (idx, val) => {
  setForm((f) => {
    const next = [...f.photos];
    next[idx] = { ...next[idx], url: val };
    return { ...f, photos: next };
  });
};

const removePhotoAt = (idx) => {
  setForm((f) => {
    const next = [...f.photos];
    next.splice(idx, 1);
    if (next.length === 0) next.push({ id: null, url: "" });
    return { ...f, photos: next };
  });
};

// Upload from local drive → get URLs → push to photos
const onLocalUpload = async (e) => {
  const files = e.target.files;
  if (!files || !files.length) return;

  // 🔑 Require a saved product first (editing mode)
  if (!form.id) {
    toast.error("Save product first before uploading photos");
    e.target.value = "";
    return;
  }

  const urls = await uploadFiles(form.id, files, VITE_API_BASE_URL);
  if (urls.length) {
    setForm((f) => ({
      ...f,
      photos: [
        ...(f.photos || []),
        ...urls.map((url) => ({ id: null, url })), // ✅ wrap as objects
      ],
    }));
    toast.success(`Uploaded ${urls.length} photo${urls.length > 1 ? "s" : ""}`);
  }
  e.target.value = "";
};

// Delete Photo
async function deletePhoto(productId, photoId, VITE_API_BASE_URL) {
  try {
    const res = await fetch(
      `${VITE_API_BASE_URL}/api/admin/products/${productId}/photos/${photoId}`,
      { method: "DELETE", credentials: "include" }
    );
    if (!res.ok) throw new Error("Delete failed");
    toast.success("Photo deleted");
    return true;
  } catch (e) {
    console.error(e);
    toast.error(e.message || "Delete error");
    return false;
  }
}

  // SEARCH + FILTERS + SORT
  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase();
    let list = [...products];

    // search
    if (query) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // category
    if (filterCategoryId) {
      list = list.filter((p) => String(p.category?.id || "") === String(filterCategoryId));
    }

    // price
    const min = filterMinPrice !== "" ? Number(filterMinPrice) : null;
    const max = filterMaxPrice !== "" ? Number(filterMaxPrice) : null;
    if (min !== null) list = list.filter((p) => Number(p.discountPrice || p.price || 0) >= min);
    if (max !== null) list = list.filter((p) => Number(p.discountPrice || p.price || 0) <= max);

    // rating
    const rmin = filterMinRating !== "" ? Number(filterMinRating) : null;
    if (rmin !== null) list = list.filter((p) => Number(p.rating || 0) >= rmin);

    // inStock
    if (filterInStock) {
      list = list.filter((p) => p.inStock === true || (p.stock ?? 0) > 0);
    }

    // sort
    list.sort((a, b) => {
      const pa = Number(a.discountPrice || a.price || 0);
      const pb = Number(b.discountPrice || b.price || 0);
      const ra = Number(a.rating || 0);
      const rb = Number(b.rating || 0);
      if (sortBy === "priceAsc") return pa - pb;
      if (sortBy === "priceDesc") return pb - pa;
      if (sortBy === "ratingDesc") return rb - ra;
      // newest last (assuming larger id = newer)
      return Number(b.id || 0) - Number(a.id || 0);
    });

    return list;
  }, [
    products,
    search,
    filterCategoryId,
    filterMinPrice,
    filterMaxPrice,
    filterMinRating,
    filterInStock,
    sortBy,
  ]);

  return (
    <AdminLayout>
      {/* Single toaster (top-center) */}
      <Toaster position="top-center" />

      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Manage Products</h2>

        {/* Product Form */}
        <div ref={formRef} className="bg-white p-6 rounded-xl shadow mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {isEditing ? "Edit Product" : "Create Product"}
            </h3>
            <button
              onClick={startCreate}
              className="text-sm px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer"
              title="Start a new product"
            >
              + New Product
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SKU */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                placeholder="e.g. MOT-018-24CAN"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Name */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                placeholder="e.g. Dream Bigger Poster"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Category */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="flex flex-col md:col-span-3">
              <label className="text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Short description about the product…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Photos (URL fields + uploader) */}
            <div className="md:col-span-3">
                <label className="text-sm font-medium text-gray-700">Photos</label>
                <p className="text-xs text-gray-500 mb-2">
                    Paste image URLs or upload multiple files. Uploaded files will be converted to URLs.
                </p>

                {/* Upload + Add URL */}
                <div className="flex items-center gap-3 mb-3">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer">
                    <Upload size={16} />
                    <span>Upload from device</span>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={onLocalUpload}
                        className="hidden"
                    />
                    </label>

                    <button
                    type="button"
                    onClick={addPhotoField}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
                    >
                    <Plus size={16} />
                    Add URL field
                    </button>
                </div>

                {/* Fields with preview + remove */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {form.photos.map((photo, idx) => (
                    <div key={photo.id || idx} className="flex items-center gap-2">
                        <input
                        type="text"
                        placeholder="https://cdn.example.com/image.jpg"
                        value={photo.url || ""}
                        onChange={(e) => {
                            const next = [...form.photos];
                            next[idx] = { ...photo, url: e.target.value };
                            setForm({ ...form, photos: next });
                        }}
                        className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500 flex-1"
                        />
                        {photo.url ? (
                        <img
                            src={photo.url}
                            onError={(e) => (e.currentTarget.style.display = "none")}
                            alt="preview"
                            className="w-12 h-12 rounded object-cover"
                        />
                        ) : (
                        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                            preview
                        </div>
                        )}
                        <button
                        type="button"
                        onClick={async () => {
                            if (form.id && photo.id) {
                            // backend delete
                            const ok = await deletePhoto(form.id, photo.id, VITE_API_BASE_URL);
                            if (ok) {
                                setForm((f) => ({
                                ...f,
                                photos: f.photos.filter((p) => p.id !== photo.id),
                                }));
                            }
                            } else {
                            // not saved yet → just remove locally
                            setForm((f) => {
                                const next = [...f.photos];
                                next.splice(idx, 1);
                                return { ...f, photos: next };
                            });
                            }
                        }}
                        className="p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
                        title="Remove"
                        >
                        <X size={16} />
                        </button>
                    </div>
                    ))}
                </div>
            </div>


            {/* Pricing & Stock */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                placeholder="e.g. 349"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Discount Price (₹)</label>
              <input
                type="number"
                placeholder="e.g. 319"
                value={form.discountPrice}
                onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input
                type="number"
                placeholder="e.g. 45"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Rating & InStock */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Rating</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                placeholder="e.g. 4.8"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">In Stock</label>
              <select
                value={form.inStock ? "true" : "false"}
                onChange={(e) => setForm({ ...form, inStock: e.target.value === "true" })}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Tags (chips) */}
            <div className="md:col-span-3">
              <label className="text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="border rounded-lg p-2 focus-within:ring-2 focus-within:ring-green-500">
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-xs text-gray-600"
                    >
                      <TagIcon size={12} />
                      {t}
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="ml-1 rounded-full hover:bg-gray-200 p-0.5 cursor-pointer"
                        title="Remove tag"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Type and press , or Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={onTagKeyDown}
                    onBlur={tryAddTag}
                    className="flex-1 min-w-[140px] outline-none px-1 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Example: anime, demonslayer, motivational
              </p>
            </div>

            {/* Optional attributes */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Size</label>
              <input
                type="text"
                placeholder="e.g. 18x24 inches"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Material</label>
              <input
                type="text"
                placeholder="e.g. Canvas Print"
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Width</label>
              <input
                type="number"
                placeholder="e.g. 18.0"
                value={form.width}
                onChange={(e) => setForm({ ...form, width: e.target.value })}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Height</label>
              <input
                type="number"
                placeholder="e.g. 24.0"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 0.29"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Actions */}
            <div className="col-span-full flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isEditing ? !isFormChanged : !isFormFilled}
                className={`${
                  isEditing ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
                } text-white px-4 py-2 rounded-lg ${
                  (isEditing ? !isFormChanged : !isFormFilled) &&
                  "opacity-50 cursor-not-allowed"
                } cursor-pointer`}
              >
                {isEditing ? "Save Changes" : "Create Product"}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Products List Panel */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">All Products</h3>

          {/* Search + Filters */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search */}
            <div className="relative md:col-span-4">
              <input
                type="text"
                placeholder="Search by name, description, or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            </div>

            {/* Category filter */}
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="md:col-span-2 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Price min/max */}
            <input
              type="number"
              placeholder="Min ₹"
              value={filterMinPrice}
              onChange={(e) => setFilterMinPrice(e.target.value)}
              className="md:col-span-2 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500"
            />
            <input
              type="number"
              placeholder="Max ₹"
              value={filterMaxPrice}
              onChange={(e) => setFilterMaxPrice(e.target.value)}
              className="md:col-span-2 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500"
            />

            {/* Rating min */}
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="Min ★"
              value={filterMinRating}
              onChange={(e) => setFilterMinRating(e.target.value)}
              className="md:col-span-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500"
            />

            {/* In stock toggle */}
            <label className="md:col-span-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filterInStock}
                onChange={(e) => setFilterInStock(e.target.checked)}
              />
              <span className="text-sm text-gray-700">In stock</span>
            </label>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="md:col-span-2 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500"
            >
              <option value="newest">Sort: Newest</option>
              <option value="priceAsc">Price: Low → High</option>
              <option value="priceDesc">Price: High → Low</option>
              <option value="ratingDesc">Rating: High → Low</option>
            </select>
          </div>

          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="border rounded-xl shadow-sm hover:shadow-lg transition bg-white flex flex-col"
                >
                  <img
                    src={p.photos?.[0] || "https://via.placeholder.com/400x300?text=No+Image"}
                    alt={p.name}
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
                  <div className="p-4 flex-1 flex flex-col">
                    <h4 className="font-bold text-lg text-gray-800 mb-1">{p.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{p.description}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {p.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600 flex items-center gap-1"
                        >
                          <TagIcon size={12} /> {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-green-600 font-bold">₹{p.discountPrice || p.price}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setForm({
                              id: p.id ?? null,
                              sku: p.sku ?? "",
                              name: p.name ?? "",
                              description: p.description ?? "",
                              photos: p.photos ?? [""],
                              price: p.price ?? "",
                              discountPrice: p.discountPrice ?? "",
                              rating: p.rating ?? "",
                              stock: p.stock ?? "",
                              inStock: p.inStock ?? true,
                              size: p.size ?? "",
                              material: p.material ?? "",
                              width: p.width ?? "",
                              height: p.height ?? "",
                              weight: p.weight ?? "",
                              tags: p.tags ?? [],
                              categoryId: p.category?.id ?? "",
                            });
                            setOriginalProduct({
                              id: p.id ?? null,
                              sku: p.sku ?? "",
                              name: p.name ?? "",
                              description: p.description ?? "",
                              photos: p.photos ?? [""],
                              price: p.price ?? "",
                              discountPrice: p.discountPrice ?? "",
                              rating: p.rating ?? "",
                              stock: p.stock ?? "",
                              inStock: p.inStock ?? true,
                              size: p.size ?? "",
                              material: p.material ?? "",
                              width: p.width ?? "",
                              height: p.height ?? "",
                              weight: p.weight ?? "",
                              tags: p.tags ?? [],
                              categoryId: p.category?.id ?? "",
                            });
                            setTagInput("");
                            if (formRef.current) {
                              formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          title="Edit product"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => confirmDelete(p.id)}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-6">
                  No matching products
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
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
