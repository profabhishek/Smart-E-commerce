import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"; // ✅ shadcn/ui dialog
import Header from "../Home/Header";
import Footer from "../Home/Footer";

export default function MyOrdersPage() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("user_token");
  const userId = localStorage.getItem("user_id");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [processing, setProcessing] = useState(false);

  // --- fetch orders ---
  useEffect(() => {
    if (!userId || !token) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/orders/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setOrders(data);
      } catch (e) {
        console.error("Failed to fetch orders:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, token]);

  // --- cancel order ---
  const cancelOrder = async (orderId) => {
    setProcessing(true);
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${orderId}/cancel`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Cancel failed");
      }

      const result = await res.json();

      // ✅ Optimistic state update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: result.status || result.orderStatus || "CANCELLED" }
            : o
        )
      );
    } catch (e) {
      console.error(e);
      alert("Could not cancel order: " + e.message);
    } finally {
      setProcessing(false);
      setConfirmOpen(false);
      setSelectedOrderId(null);
    }
  };

  return (
    <>
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>

        {loading ? (
          // Skeleton loader (same as before) ...
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
            {orders.map((order) => {
              const canCancel = [
                "DRAFT",
                "PAYMENT_PENDING",
                "PAID",
                "CONFIRMED",
                "PACKED",
              ].includes(order.status);

              return (
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
                      Placed on {new Date(order.createdAt).toLocaleDateString()} — Total: ₹
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

                      {canCancel && (
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setConfirmOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Cancel Order
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      {/* ✅ Confirmation Modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to cancel this order?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              No, go back
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelOrder(selectedOrderId)}
              disabled={processing}
            >
              {processing ? "Cancelling..." : "Yes, Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
