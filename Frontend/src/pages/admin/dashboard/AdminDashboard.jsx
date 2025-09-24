import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { IndianRupee, Package, Users, ShoppingCart, ArrowUpRight, ArrowDownRight} from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, AreaChart, Area} from "recharts";
import { subDays, startOfDay, addDays, startOfMonth, addMonths, startOfYear, addYears} from "date-fns";

// shadcn Select for the interactive chart
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

/* =========================
   Helpers (LOCAL-DAY SAFE)
   ========================= */

function buildStatusSeriesByRange(orders, range) {
  const now = new Date();
  let start;

  switch (range) {
    case "7d": {
      start = new Date(now); start.setDate(start.getDate() - 7);
      break;
    }
    case "14d": {
      start = new Date(now); start.setDate(start.getDate() - 14);
      break;
    }
    case "30d": {
      start = new Date(now); start.setDate(start.getDate() - 30);
      break;
    }
    case "90d": {
      start = new Date(now); start.setDate(start.getDate() - 90);
      break;
    }
    case "1y": {
      start = new Date(now); start.setFullYear(start.getFullYear() - 1);
      break;
    }
    case "5y": {
      start = new Date(now); start.setFullYear(start.getFullYear() - 5);
      break;
    }
    default: {
      start = new Date(now); start.setDate(start.getDate() - 14);
    }
  }

  // Filter orders in range
  const filtered = orders.filter(o => new Date(o.createdAt) >= start && new Date(o.createdAt) <= now);

  // Count statuses
  const statusCount = filtered.reduce((acc, o) => {
    const key = o.status || "UNKNOWN";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
}


// ===== Orders series builders =====

// Sum item quantities per order
const orderQty = (o) => (o.items || []).reduce((a, i) => a + (i.quantity || 0), 0);

// Daily orders for last N days (zero-filled)
function buildDailyOrdersSeries(orders, days) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today); start.setDate(start.getDate() - (days - 1));

  const tallies = new Map(); // yyyy-mm-dd -> qty
  for (const o of orders) {
    const d = new Date(o.createdAt);
    if (d < start || d > now) continue;
    const key = d.toLocaleDateString("en-CA"); // yyyy-mm-dd
    tallies.set(key, (tallies.get(key) || 0) + orderQty(o));
  }

  const series = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i);
    const key = d.toLocaleDateString("en-CA");
    const label = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
    series.push({ label, orders: tallies.get(key) || 0 });
  }
  return series;
}

// Monthly orders for last N months (zero-filled)
function buildMonthlyOrdersSeries(orders, months) {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = new Date(thisMonth); start.setMonth(start.getMonth() - (months - 1));

  const buckets = new Map(); // yyyy-m -> qty
  for (const o of orders) {
    const d = new Date(o.createdAt);
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
    if (mStart < start || mStart > thisMonth) continue;
    const key = `${mStart.getFullYear()}-${mStart.getMonth() + 1}`;
    buckets.set(key, (buckets.get(key) || 0) + orderQty(o));
  }

  const series = [];
  for (let i = 0; i < months; i++) {
    const m = new Date(start); m.setMonth(m.getMonth() + i);
    const key = `${m.getFullYear()}-${m.getMonth() + 1}`;
    const label = m.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    series.push({ label, orders: buckets.get(key) || 0 });
  }
  return series;
}

// Yearly orders for last N years (zero-filled)
function buildYearlyOrdersSeries(orders, years) {
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), 0, 1);
  const start = new Date(thisYear); start.setFullYear(start.getFullYear() - (years - 1));

  const buckets = new Map(); // yyyy -> qty
  for (const o of orders) {
    const d = new Date(o.createdAt);
    const yStart = new Date(d.getFullYear(), 0, 1);
    if (yStart < start || yStart > thisYear) continue;
    const key = `${yStart.getFullYear()}`;
    buckets.set(key, (buckets.get(key) || 0) + orderQty(o));
  }

  const series = [];
  for (let i = 0; i < years; i++) {
    const y = new Date(start); y.setFullYear(y.getFullYear() + i);
    const key = `${y.getFullYear()}`;
    series.push({ label: key, orders: buckets.get(key) || 0 });
  }
  return series;
}

function buildOrdersSeriesByRange(orders, range) {
  switch (range) {
    case "7d":  return buildDailyOrdersSeries(orders, 7);
    case "30d": return buildDailyOrdersSeries(orders, 30);
    case "90d": return buildDailyOrdersSeries(orders, 90);
    case "1y":  return buildMonthlyOrdersSeries(orders, 12);
    case "5y":  return buildYearlyOrdersSeries(orders, 5);
    default:    return buildDailyOrdersSeries(orders, 14); // fallback
  }
}

function pctChange(current, previous) {
  if (previous === 0 && current > 0) return 100;
  if (previous === 0 && current === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function localDayKey(d) {
  return d.toLocaleDateString("en-CA"); // yyyy-mm-dd in local tz
}

function localStartOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function inRangeLocal(date, startIncl, endExcl) {
  const t = new Date(date).getTime();
  return t >= startIncl.getTime() && t < endExcl.getTime();
}

function computeMetrics(list) {
  const revenue = list.reduce((a, o) => a + (o.totalPayable || 0), 0);
  const orders = list.length;
  const products = list.reduce((a, o) => a + (o.items?.length || 0), 0);
  const customers = new Set(list.map((o) => o.customerName)).size;
  return { revenue, orders, products, customers };
}

function getStatsWithFallback(orders) {
  const now = new Date();
  const todayStart = localStartOfDay(now);

  // Primary: 7d vs prev 7d
  const last7Start = subDays(todayStart, 7);
  const prev14Start = subDays(todayStart, 14);

  const recent7 = orders.filter((o) =>
    inRangeLocal(o.createdAt, last7Start, addDays(todayStart, 1))
  );
  const prev7 = orders.filter((o) =>
    inRangeLocal(o.createdAt, prev14Start, last7Start)
  );

  let current = computeMetrics(recent7);
  let previous = computeMetrics(prev7);
  let window = "7d";

  const prev7Empty =
    previous.revenue === 0 &&
    previous.orders === 0 &&
    previous.products === 0 &&
    previous.customers === 0;

  if (prev7Empty) {
    // Fallback: 30d vs prev 30d
    const last30Start = subDays(todayStart, 30);
    const prev60Start = subDays(todayStart, 60);

    const recent30 = orders.filter((o) =>
      inRangeLocal(o.createdAt, last30Start, addDays(todayStart, 1))
    );
    const prev30 = orders.filter((o) =>
      inRangeLocal(o.createdAt, prev60Start, last30Start)
    );

    current = computeMetrics(recent30);
    previous = computeMetrics(prev30);
    window = "30d";
  }

  return {
    revenue: {
      current: current.revenue,
      previous: previous.revenue,
      change: pctChange(current.revenue, previous.revenue),
    },
    orders: {
      current: current.orders,
      previous: previous.orders,
      change: pctChange(current.orders, previous.orders),
    },
    products: {
      current: current.products,
      previous: previous.products,
      change: pctChange(current.products, previous.products),
    },
    customers: {
      current: current.customers,
      previous: previous.customors,
      change: pctChange(current.customers, previous.customers),
    },
    window,
  };
}

/* ---------- series builders ---------- */

// Orders – continuous last N local days, zero-filled
function buildOrdersByDaySeries(orders, days = 14) {
  const now = new Date();
  const todayStart = localStartOfDay(now);
  const start = subDays(todayStart, days - 1);

  const tallies = new Map();
  for (const o of orders) {
    const d = new Date(o.createdAt);
    if (!inRangeLocal(d, start, addDays(todayStart, 1))) continue;
    const key = localDayKey(d);
    const qty = (o.items || []).reduce((a, i) => a + (i.quantity || 0), 0);
    tallies.set(key, (tallies.get(key) || 0) + qty);
  }

  const series = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    const key = localDayKey(d);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
    series.push({ label, orders: tallies.get(key) || 0 });
  }
  return series;
}

// Revenue – daily ₹ series for last N days
function buildDailyRevenueSeries(orders, days) {
  const now = new Date();
  const todayStart = localStartOfDay(now);
  const start = subDays(todayStart, days - 1);

  const amounts = new Map();

  for (const o of orders) {
    const d = new Date(o.createdAt);
    if (!inRangeLocal(d, start, addDays(todayStart, 1))) continue;
    const key = localDayKey(d);
    const paise = o.totalPayable || 0;
    amounts.set(key, (amounts.get(key) || 0) + paise);
  }

  const series = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    const key = localDayKey(d);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
    const paise = amounts.get(key) || 0;
    series.push({ label, revenue: paise / 100 });
  }
  return series;
}

// Revenue – monthly ₹ series for last N months, zero-filled
function buildMonthlyRevenueSeries(orders, months) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const start = startOfMonth(addMonths(thisMonthStart, -(months - 1)));

  const buckets = new Map(); // key: yyyy-mm
  for (const o of orders) {
    const d = new Date(o.createdAt);
    if (!inRangeLocal(d, start, addMonths(thisMonthStart, 1))) continue;

    const monthStart = startOfMonth(d);
    const key = `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`;
    buckets.set(key, (buckets.get(key) || 0) + (o.totalPayable || 0));
  }

  const series = [];
  for (let i = 0; i < months; i++) {
    const m = addMonths(start, i);
    const key = `${m.getFullYear()}-${m.getMonth() + 1}`;
    const label = m.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const paise = buckets.get(key) || 0;
    series.push({ label, revenue: paise / 100 });
  }
  return series;
}

// Revenue – yearly ₹ series for last N years, zero-filled
function buildYearlyRevenueSeries(orders, years) {
  const now = new Date();
  const thisYearStart = startOfYear(now);
  const start = startOfYear(addYears(thisYearStart, -(years - 1)));

  const buckets = new Map(); // key: yyyy
  for (const o of orders) {
    const d = new Date(o.createdAt);
    if (!inRangeLocal(d, start, addYears(thisYearStart, 1))) continue;

    const yearStart = startOfYear(d);
    const key = `${yearStart.getFullYear()}`;
    buckets.set(key, (buckets.get(key) || 0) + (o.totalPayable || 0));
  }

  const series = [];
  for (let i = 0; i < years; i++) {
    const y = addYears(start, i);
    const key = `${y.getFullYear()}`;
    const label = y.getFullYear().toString();
    const paise = buckets.get(key) || 0;
    series.push({ label, revenue: paise / 100 });
  }
  return series;
}

// Pick the right series for the interactive chart
function buildRevenueSeriesByRange(orders, range) {
  switch (range) {
    case "7d":
      return buildDailyRevenueSeries(orders, 7);
    case "30d":
      return buildDailyRevenueSeries(orders, 30);
    case "90d":
      return buildDailyRevenueSeries(orders, 90);
    case "1y":
      return buildMonthlyRevenueSeries(orders, 12);
    case "5y":
      return buildYearlyRevenueSeries(orders, 5);
    default:
      return buildDailyRevenueSeries(orders, 30);
  }
}

/* =========================
   Component
   ========================= */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d"); // 7d / 30d / 90d / 1y / 5y
  const [ordersRange, setOrdersRange] = useState("14d"); // "7d" | "14d" | "30d" | "90d" | "1y" | "5y"
  const [statusRange, setStatusRange] = useState("14d");

  useEffect(() => {
    const role = localStorage.getItem("admin_role");
    if (role !== "ROLE_ADMIN") {
      navigate("/admin/login");
      return;
    }

    const token = localStorage.getItem("admin_token");
    fetch(import.meta.env.VITE_API_BASE_URL+"/api/admin/orders", {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setOrders(Array.isArray(data?.content) ? data.content : []))
      .catch((err) => {
        console.error("Error:", err);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  const stats = getStatsWithFallback(orders);

  // Orders series (based on dropdown)
  const ordersData = ordersRange === "14d" ? buildDailyOrdersSeries(orders, 14) : buildOrdersSeriesByRange(orders, ordersRange);

  // Status pie
  const statusCount = orders.reduce((acc, o) => {
    const k = o.status || "UNKNOWN";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const statusData = buildStatusSeriesByRange(orders, statusRange);
  const STATUS_COLORS = {
    PAID: "#22c55e",
    CONFIRMED: "#3b82f6",
    SHIPPED: "#2563eb",
    DELIVERED: "#1d4ed8",
    REFUND_PENDING: "#eab308",
    PAYMENT_PENDING: "#f59e0b",
    REFUNDED: "#7c3aed",
    CANCELLED: "#ef4444",
    FAILED: "#dc2626",
    DRAFT: "#6b7280",
    UNKNOWN: "#6b7280",
  };

  // Interactive revenue series (labels include year for 1y/5y)
  const revenueSeries = buildRevenueSeriesByRange(orders, timeRange);

  return (
    <AdminLayout>
      {/* top bar */}
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

      {/* stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          title={`Total Revenue (${stats.window})`}
          value={`₹${(stats.revenue.current / 100).toLocaleString()}`}
          icon={<IndianRupee />}
          change={stats.revenue.change}
        />
        <StatCard
          title={`Orders (${stats.window})`}
          value={stats.orders.current}
          icon={<ShoppingCart />}
          change={stats.orders.change}
        />
        <StatCard
          title={`Active Products (${stats.window})`}
          value={stats.products.current}
          icon={<Package />}
          change={stats.products.change}
        />
        <StatCard
          title={`Customers (${stats.window})`}
          value={stats.customers.current}
          icon={<Users />}
          change={stats.customers.change}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Interactive Revenue Area (full width) */}
        <div className="md:col-span-2">
          <ChartCard
            title={
              <div className="flex items-center justify-between">
                <span>Revenue Trend (Interactive)</span>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 3 months</SelectItem>
                    <SelectItem value="1y">Last 1 year</SelectItem>
                    <SelectItem value="5y">Last 5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                {/* We prepared readable labels already (MMM dd / MMM yyyy / YYYY) */}
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue (₹)"
                  stroke="#22c55e"
                  fill="url(#fillRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        {/* Orders Bar (last 14 days) */}
        <ChartCard
          title={
            <div className="flex items-center justify-between">
              <span>Orders (interactive)</span>
              <Select value={ordersRange} onValueChange={setOrdersRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="14d">Last 14 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="1y">Last 1 year</SelectItem>
                  <SelectItem value="5y">Last 5 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" name="Orders" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Order Status Breakdown (Pie) */}
        <ChartCard
          title={
            <div className="flex items-center justify-between">
              <span>Order Status Breakdown</span>
              <Select value={statusRange} onValueChange={setStatusRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="14d">Last 14 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="1y">Last 1 year</SelectItem>
                  <SelectItem value="5y">Last 5 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                {statusData.map((entry, i) => {
                  const color =
                    STATUS_COLORS[entry.name] ??
                    Object.values(STATUS_COLORS)[i % Object.values(STATUS_COLORS).length];
                  return <Cell key={i} fill={color} />;
                })}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* recent orders */}
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
            {orders.slice(0, 5).map((o) => (
              <OrderRow
                key={o.id}
                id={`#${o.id}`}
                name={o.customerName}
                amount={`₹${((o.totalPayable || 0) / 100).toLocaleString()}`}
                status={o.status}
              />
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

/* =========================
   UI helpers
   ========================= */

function StatCard({ title, value, icon, change }) {
  const isPositive = Number(change) >= 0;
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-md flex flex-col">
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <div className="flex items-center justify-between mt-2">
        <p className="text-2xl font-bold flex items-center gap-2">
          {icon} {value}
        </p>
        <span
          className={`flex items-center text-sm font-medium ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {Math.abs(Number(change)).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-md">
      {typeof title === "string" ? (
        <h3 className="text-gray-600 text-sm font-semibold mb-3">{title}</h3>
      ) : (
        <div className="mb-3">{title}</div>
      )}
      {children}
    </div>
  );
}

function OrderRow({ id, name, amount, status }) {
  const statusColors = {
    PAID: "text-green-600",
    CONFIRMED: "text-blue-600",
    SHIPPED: "text-blue-500",
    DELIVERED: "text-blue-700",
    REFUND_PENDING: "text-yellow-600",
    PAYMENT_PENDING: "text-yellow-500",
    REFUNDED: "text-purple-600",
    CANCELLED: "text-red-600",
    FAILED: "text-red-500",
    DRAFT: "text-gray-500",
    UNKNOWN: "text-gray-500",
  };
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-2 px-3">{id}</td>
      <td className="py-2 px-3">{name}</td>
      <td className="py-2 px-3">{amount}</td>
      <td className={`py-2 px-3 font-semibold ${statusColors[status] || "text-gray-600"}`}>
        {status}
      </td>
    </tr>
  );
}