import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import {
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Filter,
  Calendar,
  User,
  Phone,
  Download,
  Info,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

// ---- helpers ----
const STATUSES = [
  "DRAFT",
  "PAYMENT_PENDING",
  "PAID",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
  "REFUND_PENDING",
  "REFUNDED",
];

const toISOorNull = (val) => {
  if (!val) return null;
  try {
    const d = new Date(val); // input is datetime-local
    return d.toISOString();
  } catch {
    return null;
  }
};

const currency = (paisa) => {
  if (paisa == null) return "-";
  const rupees = (Number(paisa) / 100).toFixed(2);
  return `₹${rupees}`;
};

export default function OrdersManagement() {
  const navigate = useNavigate();
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // auth gate
  useEffect(() => {
    const role = localStorage.getItem("admin_role");
    if (role !== "ROLE_ADMIN") {
      navigate("/admin/login");
    }
  }, [navigate]);

  // filters + pagination
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState("");
  const [start, setStart] = useState(""); // datetime-local
  const [end, setEnd] = useState(""); // datetime-local
  const [q, setQ] = useState(""); // local search (name/phone/razorpay)

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sort, setSort] = useState("createdAt,DESC");

  const [orderId, setOrderId] = useState("");

  // data
  const [loading, setLoading] = useState(true);
  const [ordersPage, setOrdersPage] = useState({
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 20,
  });

  // view / edit / delete modals
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteHard, setDeleteHard] = useState(false);

  const [lookupId, setLookupId] = useState("");

  // edit form
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState(null);

  // searched inline card
  const [searchedOrder, setSearchedOrder] = useState(null);

  // fetch list
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("size", size);
      if (sort) params.set("sort", sort);
      if (status) params.set("status", status);
      if (userId) params.set("userId", userId);
      if (orderId && !isNaN(Number(orderId))) {
  params.set("orderId", Number(orderId));
}
      const _start = toISOorNull(start);
      const _end = toISOorNull(end);
      if (_start) params.set("start", _start);
      if (_end) params.set("end", _end);

      const url = `${VITE_API_BASE_URL}/api/admin/orders?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrdersPage(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load orders");
      setOrdersPage((p) => ({ ...p, content: [], totalPages: 0, totalElements: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userId, orderId, start, end, page, size, sort]);

  const resetFilters = () => {
    setStatus("");
    setUserId("");
    setStart("");
    setOrderId("");
    setEnd("");
    setQ("");
    setPage(0);

    setSort("createdAt,DESC");
  };

  const filteredContent = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return ordersPage.content || [];
    return (ordersPage.content || []).filter((o) => {
      return (
        (o.customerName || "").toLowerCase().includes(term) ||
        (o.phone || "").toLowerCase().includes(term) ||
        (o.razorpayOrderId || "").toLowerCase().includes(term) ||
        String(o.id).includes(term)
      );
    });
  }, [q, ordersPage]);

  const openView = async (order) => {
    try {
      const res = await fetch(`${VITE_API_BASE_URL}/api/admin/orders/${order.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch order");
      const full = await res.json();
      setSelectedOrder(full);
      setViewOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to open order");
    }
  };

  const openEdit = async (order) => {
    try {
      const res = await fetch(`${VITE_API_BASE_URL}/api/admin/orders/${order.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch order");
      const full = await res.json();
      setSelectedOrder(full);
      setEditForm(JSON.parse(JSON.stringify(full)));
      setEditOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to open editor");
    }
  };

    const saveEdit = async () => {
    if (!editForm || !selectedOrder) return;

    // Detect "status-only" change
    const onlyStatusChanged =
        editForm.status &&
        editForm.status !== selectedOrder.status &&
        editForm.customerName === selectedOrder.customerName &&
        editForm.phone === selectedOrder.phone &&
        JSON.stringify(editForm.shippingAddress || {}) === JSON.stringify(selectedOrder.shippingAddress || {}) &&
        editForm.subtotal === selectedOrder.subtotal &&
        editForm.shippingFee === selectedOrder.shippingFee &&
        editForm.codFee === selectedOrder.codFee &&
        editForm.discount === selectedOrder.discount &&
        editForm.totalPayable === selectedOrder.totalPayable &&
        (JSON.stringify(editForm.items || []) === JSON.stringify(selectedOrder.items || [])) &&
        (editForm.razorpayOrderId === selectedOrder.razorpayOrderId);

    setSaving(true);
    try {
        if (onlyStatusChanged) {
        // ✅ call existing endpoint
        const res = await fetch(
            `${VITE_API_BASE_URL}/api/admin/orders/${editForm.id}/status?status=${encodeURIComponent(editForm.status)}`,
            { method: "PUT", credentials: "include" }
        );
        if (!res.ok) throw new Error("Status update failed");
        toast.success("Status updated");
        setEditOpen(false);
        setEditForm(null);
        await fetchOrders();
        if (searchedOrder && searchedOrder.id === editForm.id) {
            setSearchedOrder({ ...searchedOrder, status: editForm.status });
        }
        return;
        }

        // ❌ if you don’t have PUT /{id} yet, this will fail; leave message:
        const res = await fetch(`${VITE_API_BASE_URL}/api/admin/orders/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
        });
        if (!res.ok) {
        throw new Error(
            "Save failed. Backend is missing PUT /api/admin/orders/{id}. Implement it or only change status."
        );
        }

        toast.success("Order updated");
        setEditOpen(false);
        setEditForm(null);
        await fetchOrders();
        if (searchedOrder && searchedOrder.id === editForm.id) {
        setSearchedOrder(editForm);
        }
    } catch (e) {
        console.error(e);
        toast.error(e.message || "Failed to save");
    } finally {
        setSaving(false);
    }
    };

  const quickStatusChange = async (orderId, newStatus) => {
    setChangingStatusId(orderId);
    try {
      const res = await fetch(
        `${VITE_API_BASE_URL}/api/admin/orders/${orderId}/status?status=${encodeURIComponent(
          newStatus
        )}`,
        { method: "PUT", credentials: "include" }
      );
      if (!res.ok) throw new Error("Status update failed");
      toast.success(`Status → ${newStatus}`);
      fetchOrders();
      if (searchedOrder && searchedOrder.id === orderId) {
        setSearchedOrder({ ...searchedOrder, status: newStatus });
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    } finally {
      setChangingStatusId(null);
    }
  };

  const confirmDelete = (order) => {
    setSelectedOrder(order);
    setDeleteHard(false);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!selectedOrder) return;
    try {
      const url = `${VITE_API_BASE_URL}/api/admin/orders/${selectedOrder.id}?hard=${deleteHard}`;
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(deleteHard ? "Order permanently deleted" : "Order cancelled (soft delete)");
      setDeleteOpen(false);
      if (searchedOrder && searchedOrder.id === selectedOrder.id) {
        setSearchedOrder(null);
      }
      setSelectedOrder(null);
      fetchOrders();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete");
    }
  };

  // 🔧 FIX: search by ID now shows inline details (does NOT auto-open drawer)
  const lookupOrder = async (e) => {
    e.preventDefault();
    const id = String(lookupId || "").trim();
    if (!id) return;
    try {
      const res = await fetch(`${VITE_API_BASE_URL}/api/admin/orders/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Not found");
      const full = await res.json();
      setSearchedOrder(full); // show inline result card
      setLookupId("");
      // optional: scroll to card
      // setTimeout(() => document.getElementById("searched-order-card")?.scrollIntoView({ behavior: "smooth" }), 0);
    } catch (e) {
      toast.error("Order not found");
    }
  };

  const exportCsv = () => {
    const rows = [
      [
        "id",
        "userId",
        "customerName",
        "phone",
        "status",
        "subtotal",
        "shippingFee",
        "codFee",
        "discount",
        "totalPayable",
        "razorpayOrderId",
        "createdAt",
        "updatedAt",
      ],
      ...filteredContent.map((o) => [
        o.id,
        o.userId,
        safe(o.customerName),
        safe(o.phone),
        o.status,
        o.subtotal,
        o.shippingFee,
        o.codFee,
        o.discount,
        o.totalPayable,
        safe(o.razorpayOrderId),
        o.createdAt,
        o.updatedAt,
      ]),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_page${ordersPage.number + 1}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const safe = (v) => (v == null ? "" : String(v));
  const csvEscape = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Manage Orders</h2>

        {/* Info banner */}
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-start gap-3">
          <Info size={18} className="mt-[2px]" />
          <div>
            <div className="font-medium">Admin Orders Panel</div>
            <div className="mt-1">
              Filter by <b>Status</b>, <b>User ID</b>, or <b>Date Range</b>. Use quick status
              change, full edit, soft/hard delete, and export CSV.
            </div>
          </div>
        </div>

        {/* 🔍 Inline Searched Order Card (appears after searching by ID) */}
        {searchedOrder && (
          <div id="searched-order-card" className="bg-white rounded-xl shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-3">Searched Order #{searchedOrder.id}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p>
                  <b>Customer:</b> {searchedOrder.customerName}
                </p>
                <p>
                  <b>Phone:</b> {searchedOrder.phone}
                </p>
                <p>
                  <b>Status:</b> {searchedOrder.status}
                </p>
              </div>
              <div>
                <p>
                  <b>Total:</b> ₹{(searchedOrder.totalPayable / 100).toFixed(2)}
                </p>
                <p>
                  <b>Created:</b> {new Date(searchedOrder.createdAt).toLocaleString()}
                </p>
                <p>
                  <b>Updated:</b> {new Date(searchedOrder.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setSelectedOrder(searchedOrder);
                  setViewOpen(true);
                }}
                className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
              >
                View
              </button>
              <button
                onClick={() => {
                  setSelectedOrder(searchedOrder);
                  setEditForm(JSON.parse(JSON.stringify(searchedOrder)));
                  setEditOpen(true);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => confirmDelete(searchedOrder)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Cancel Order
              </button>
              <button
                onClick={() => setSearchedOrder(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter size={18} /> Filters
            </h3>

            <div className="flex gap-2">
              <button
                onClick={fetchOrders}
                className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center gap-2"
              >
                <RefreshCw size={16} /> Refresh
              </button>
              <button
                onClick={resetFilters}
                className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Reset
              </button>
              <button
                onClick={exportCsv}
                className="px-3 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900 flex items-center gap-2"
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
                className="border p-2 rounded-lg w-full"
              >
                <option value="">All</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">User ID</label>
              <input
                type="number"
                min="1"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setPage(0);
                }}
                className="border p-2 rounded-lg w-full"
                placeholder="e.g. 2"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Calendar size={14} /> Start
              </label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  setPage(0);
                }}
                className="border p-2 rounded-lg w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Calendar size={14} /> End
              </label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setPage(0);
                }}
                className="border p-2 rounded-lg w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Quick Search</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5" size={16} />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="name / phone id"
                    className="border pl-8 p-2 rounded-lg w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Order ID</label>
              <input
                type="number"
                min="1"
                value={orderId}
                onChange={(e) => {
                  setOrderId(e.target.value);
                  setPage(0);
                }}
                className="border p-2 rounded-lg w-full"
                placeholder="e.g. 30001"
              />
            </div>
          </div>

          {/* Single order quick lookup */}
          <form onSubmit={lookupOrder} className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Open Order by ID</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="e.g. 30001"
                  className="border p-2 rounded-lg w-full"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Open
                </button>
              </div>
            </div>

            {/* Pagination controls */}
            <div className="md:col-span-4 flex items-end justify-end gap-2">
              <select
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
                className="border p-2 rounded-lg"
                title="Page size"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page <= 0}
                className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                title="Prev"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-2 text-sm">
                Page <b>{ordersPage.number + 1}</b> / {Math.max(1, ordersPage.totalPages)}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (ordersPage.totalPages && page + 1 < ordersPage.totalPages) {
                    setPage((p) => p + 1);
                  }
                }}
                disabled={!ordersPage.totalPages || page + 1 >= ordersPage.totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* Orders table */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">All Orders</h3>

            {/* Sort control */}
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(0);
              }}
              className="border p-2 rounded-lg"
              title="Sort"
            >
              <option value="createdAt,DESC">Newest first</option>
              <option value="createdAt,ASC">Oldest first</option>
              <option value="totalPayable,DESC">Amount high → low</option>
              <option value="totalPayable,ASC">Amount low → high</option>
            </select>
          </div>

          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <colgroup>
                  <col style={{ width: "6rem" }} />
                  <col style={{ width: "12rem" }} />
                  <col style={{ width: "9rem" }} />
                  <col />
                  <col style={{ width: "9rem" }} />
                  <col style={{ width: "12rem" }} />
                  <col style={{ width: "10rem" }} />
                </colgroup>
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wide">
                    <th className="py-3 px-4 text-left">ID</th>
                    <th className="py-3 px-4 text-left">Customer</th>
                    <th className="py-3 px-4 text-left">Phone</th>
                    <th className="py-3 px-4 text-left">Address</th>
                    <th className="py-3 px-4 text-left">Amount</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContent.map((o) => (
                    <tr key={o.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">{o.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          <User size={14} />
                          <span className="truncate max-w-[180px]" title={o.customerName}>
                            {o.customerName || "—"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">User #{o.userId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Phone size={14} />
                          <span className="truncate max-w-[140px]">{o.phone || "—"}</span>
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[140px]">
                          {o.razorpayOrderId || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <div className="truncate max-w-[260px]">
                          {[
                            o?.shippingAddress?.houseNo,
                            o?.shippingAddress?.area,
                            o?.shippingAddress?.landmark,
                            o?.shippingAddress?.city,
                            o?.shippingAddress?.state,
                            o?.shippingAddress?.pinCode,
                          ]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold">{currency(o.totalPayable)}</div>
                        <div className="text-xs text-gray-500">
                          Sub {currency(o.subtotal)} · Ship {currency(o.shippingFee)} · Disc{" "}
                          {currency(o.discount)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {o.status === "DELIVERED" ? (
                            <CheckCircle2 size={16} className="text-green-600" />
                          ) : o.status === "CANCELLED" ? (
                            <XCircle size={16} className="text-red-600" />
                          ) : (
                            <Truck size={16} className="text-gray-600" />
                          )}
                          <select
                            disabled={changingStatusId === o.id}
                            value={o.status}
                            onChange={(e) => quickStatusChange(o.id, e.target.value)}
                            className="border p-1 rounded"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(o.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openView(o)}
                            className="text-gray-700 hover:text-gray-900"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => openEdit(o)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => confirmDelete(o)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredContent.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ----- View Drawer (always mounted for animation) ----- */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
          viewOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!viewOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30"
          onClick={() => setViewOpen(false)}
        />
        {/* Panel */}
        <div
          className={`relative bg-white w-full max-w-2xl h-full p-6 overflow-y-auto transform transition-transform duration-300 ${
            viewOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {selectedOrder && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package size={18} />
                  Order #{selectedOrder.id}
                </h3>
                <button
                  onClick={() => setViewOpen(false)}
                  className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="font-semibold mb-2">Customer</div>
                  <div className="text-sm">Name: {selectedOrder.customerName || "—"}</div>
                  <div className="text-sm">Phone: {selectedOrder.phone || "—"}</div>
                  <div className="text-sm">User ID: {selectedOrder.userId}</div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="font-semibold mb-2">Status & Payment</div>
                  <div className="text-sm">Status: {selectedOrder.status}</div>
                  <div className="text-sm">
                    Razorpay: {selectedOrder.razorpayOrderId || "—"}
                  </div>
                  <div className="text-sm">
                    Created: {new Date(selectedOrder.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm">
                    Updated: {new Date(selectedOrder.updatedAt).toLocaleString()}
                  </div>
                </div>

                <div className="rounded-lg border p-4 md:col-span-2">
                  <div className="font-semibold mb-2">Shipping Address</div>
                  <div className="text-sm">
                    {[
                      selectedOrder?.shippingAddress?.houseNo,
                      selectedOrder?.shippingAddress?.area,
                      selectedOrder?.shippingAddress?.landmark,
                      selectedOrder?.shippingAddress?.city,
                      selectedOrder?.shippingAddress?.state,
                      selectedOrder?.shippingAddress?.pinCode,
                      selectedOrder?.shippingAddress?.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="font-semibold mb-2">Amounts</div>
                  <div className="text-sm">Subtotal: {currency(selectedOrder.subtotal)}</div>
                  <div className="text-sm">Shipping: {currency(selectedOrder.shippingFee)}</div>
                  <div className="text-sm">COD Fee: {currency(selectedOrder.codFee)}</div>
                  <div className="text-sm">Discount: {currency(selectedOrder.discount)}</div>
                  <div className="text-sm font-semibold">
                    Total Payable: {currency(selectedOrder.totalPayable)}
                  </div>
                </div>

                <div className="rounded-lg border p-4 md:col-span-2">
                  <div className="font-semibold mb-2">Items</div>
                  <div className="space-y-2">
                    {(selectedOrder.items || []).map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="truncate pr-2">
                          {it.productName} <span className="text-gray-500">#{it.productId}</span>
                        </div>
                        <div className="text-gray-600">x {it.quantity}</div>
                        <div className="font-medium">{currency(it.price)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => {
                    setEditForm(JSON.parse(JSON.stringify(selectedOrder)));
                    setEditOpen(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirmDelete(selectedOrder)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ----- Edit Drawer (always mounted for animation) ----- */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
          editOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!editOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30"
          onClick={() => setEditOpen(false)}
        />
        {/* Panel */}
        <div
          className={`relative bg-white w-full max-w-2xl h-full p-6 overflow-y-auto transform transition-transform duration-300 ${
            editOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {editForm && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Order #{editForm.id}</h3>
                <button
                  onClick={() => setEditOpen(false)}
                  className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                >
                  Close
                </button>
              </div>

              {/* Basic fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="font-semibold mb-2">Core</div>
                  <label className="block text-xs text-gray-500 mb-1">Customer Name</label>
                  <input
                    className="border p-2 rounded w-full mb-3"
                    value={editForm.customerName || ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, customerName: e.target.value }))
                    }
                  />
                  <label className="block text-xs text-gray-500 mb-1">Phone</label>
                  <input
                    className="border p-2 rounded w-full mb-3"
                    value={editForm.phone || ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                  <label className="block text-xs text-gray-500 mb-1">Razorpay Order Id</label>
                  <input
                    className="border p-2 rounded w-full"
                    value={editForm.razorpayOrderId || ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, razorpayOrderId: e.target.value }))
                    }
                  />
                </div>

                <div className="rounded-lg border p-4">
                  <div className="font-semibold mb-2">Status</div>
                  <select
                    className="border p-2 rounded w-full"
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <div className="font-semibold mt-4 mb-2">Amounts</div>
                  <label className="block text-xs text-gray-500 mb-1">Subtotal (paise)</label>
                  <input
                    type="number"
                    className="border p-2 rounded w-full mb-2"
                    value={editForm.subtotal ?? 0}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, subtotal: Number(e.target.value) }))
                    }
                  />
                  <label className="block text-xs text-gray-500 mb-1">Shipping Fee (paise)</label>
                  <input
                    type="number"
                    className="border p-2 rounded w-full mb-2"
                    value={editForm.shippingFee ?? 0}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, shippingFee: Number(e.target.value) }))
                    }
                  />
                  <label className="block text-xs text-gray-500 mb-1">COD Fee (paise)</label>
                  <input
                    type="number"
                    className="border p-2 rounded w-full mb-2"
                    value={editForm.codFee ?? 0}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, codFee: Number(e.target.value) }))
                    }
                  />
                  <label className="block text-xs text-gray-500 mb-1">Discount (paise)</label>
                  <input
                    type="number"
                    className="border p-2 rounded w-full mb-2"
                    value={editForm.discount ?? 0}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, discount: Number(e.target.value) }))
                    }
                  />
                  <label className="block text-xs text-gray-500 mb-1">Total Payable (paise)</label>
                  <input
                    type="number"
                    className="border p-2 rounded w-full"
                    value={editForm.totalPayable ?? 0}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, totalPayable: Number(e.target.value) }))
                    }
                  />
                </div>

                <div className="rounded-lg border p-4 md:col-span-2">
                  <div className="font-semibold mb-2">Shipping Address</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      ["houseNo", "House No"],
                      ["area", "Area"],
                      ["landmark", "Landmark"],
                      ["city", "City"],
                      ["state", "State"],
                      ["pinCode", "PIN Code"],
                      ["country", "Country"],
                      ["type", "Type"],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-500 mb-1">{label}</label>
                        <input
                          className="border p-2 rounded w-full"
                          value={editForm.shippingAddress?.[key] || ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              shippingAddress: {
                                ...(f.shippingAddress || {}),
                                [key]: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border p-4 md:col-span-2">
                  <div className="font-semibold mb-2">Items</div>
                  <div className="space-y-3">
                    {(editForm.items || []).map((it, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border rounded p-3"
                      >
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Product ID</label>
                          <input
                            type="number"
                            className="border p-2 rounded w-full"
                            value={it.productId ?? ""}
                            onChange={(e) =>
                              setEditForm((f) => {
                                const items = [...(f.items || [])];
                                items[idx] = { ...items[idx], productId: Number(e.target.value) };
                                return { ...f, items };
                              })
                            }
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Product Name</label>
                          <input
                            className="border p-2 rounded w-full"
                            value={it.productName || ""}
                            onChange={(e) =>
                              setEditForm((f) => {
                                const items = [...(f.items || [])];
                                items[idx] = { ...items[idx], productName: e.target.value };
                                return { ...f, items };
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Price (paise)</label>
                          <input
                            type="number"
                            className="border p-2 rounded w-full"
                            value={it.price ?? 0}
                            onChange={(e) =>
                              setEditForm((f) => {
                                const items = [...(f.items || [])];
                                items[idx] = { ...items[idx], price: Number(e.target.value) };
                                return { ...f, items };
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Qty</label>
                          <input
                            type="number"
                            min="1"
                            className="border p-2 rounded w-full"
                            value={it.quantity ?? 1}
                            onChange={(e) =>
                              setEditForm((f) => {
                                const items = [...(f.items || [])];
                                items[idx] = { ...items[idx], quantity: Number(e.target.value) };
                                return { ...f, items };
                              })
                            }
                          />
                        </div>

                        <div className="md:col-span-5 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((f) => {
                                const items = [...(f.items || [])];
                                items.splice(idx, 1);
                                return { ...f, items };
                              })
                            }
                            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((f) => ({
                          ...f,
                          items: [
                            ...(f.items || []),
                            { productId: null, productName: "", price: 0, quantity: 1 },
                          ],
                        }))
                      }
                      className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg text-white ${
                    saving ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ----- Delete Modal ----- */}
      {deleteOpen && selectedOrder && (
        <div className="fixed inset-0 bg-[rgba(173,216,230,0.4)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-4">
              {deleteHard
                ? "This will permanently remove the order record."
                : "This will cancel the order and keep history."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={doDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
