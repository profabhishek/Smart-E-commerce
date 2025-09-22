import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "../Home/Header";
import Footer from "../Home/Footer";

export default function MyOrdersPage() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("user_token");
  const userId = localStorage.getItem("user_id");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // --- fetch orders ---
  useEffect(() => {
    if (!userId || !token) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/orders/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // ✅ sort latest first
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sorted);
      } catch (e) {
        console.error("Failed to fetch orders:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, token]);

  // ✅ pagination calculation
  const totalPages = Math.ceil(orders.length / pageSize);
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return orders.slice(start, start + pageSize);
  }, [orders, page]);

  return (
    <>
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-56 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[1, 2].map((j) => (
                      <div key={j} className="flex gap-3 p-2 border rounded-lg">
                        <Skeleton className="h-20 w-20 rounded" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-40 mb-2" />
                          <Skeleton className="h-4 w-16 mb-2" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="mt-3 flex gap-3">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p>
            You have no orders yet.{" "}
            <Link to="/" className="text-green-600">
              Start shopping
            </Link>
          </p>
        ) : (
          <div className="space-y-6">
            {paginatedOrders.map((order) => (
              <Card key={order.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Order #{order.id}</CardTitle>
                    <Badge
                      className={
                        order.status === "DELIVERED"
                          ? "bg-green-600"
                          : order.status === "CANCELLED"
                          ? "bg-red-600"
                          : "bg-yellow-600"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString()} — Total: ₹
                    {(order.totalPayable / 100).toFixed(2)}
                  </p>
                </CardHeader>

                <CardContent>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <p>Track status: {order.status}</p>
                  </div>

                  <div className="mt-3 flex gap-3">
                    <Button variant="outline" asChild>
                      <Link to={`/orders/${order.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* ✅ pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(p + 1, totalPages))
                  }
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
