import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../Home/Header";
import Footer from "../Home/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Truck,
  Package,
  Clock,
  MapPin,
  ShieldCheck,
  CreditCard,
  Download,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  Copy,
  XCircle,
  AlertTriangle,
  Undo2,
  PhoneCall,
  HelpCircle,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ------------------------------ helpers ------------------------------
const currency = (paise) => `₹${(Number(paise ?? 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_STEPS = [
  "DRAFT",
  "PAYMENT_PENDING",
  "PAID",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];
const statusIndex = (s) => Math.max(STATUS_STEPS.indexOf(s || ""), 0);

const stepLabel = (s) => ({
  DRAFT: "Placed",
  PAYMENT_PENDING: "Payment Pending",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  REFUND_INITIATED: "Refund Initiated",
  REFUNDED: "Refunded",
}[s] || s || "Status");

const pillClass = (s) => {
  if (s === "DELIVERED") return "bg-green-600";
  if (s === "CANCELLED") return "bg-red-600";
  if (s === "RETURNED") return "bg-rose-600";
  if (s === "REFUND_INITIATED") return "bg-yellow-600";
  if (s === "REFUNDED") return "bg-emerald-600";
  if (["PAID","CONFIRMED","PACKED","SHIPPED","OUT_FOR_DELIVERY"].includes(s)) return "bg-emerald-700";
  return "bg-yellow-600";
};

const copyToClipboard = async (text) => {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
};

// Normalizers for common backend naming variations (based on your refs)
const getItemPhoto = (it) => it?.productPhoto || it?.product?.photo || it?.photo?.url || it?.product_photo || it?.image || "/placeholder.svg";
const getItemName = (it) => it?.productName || it?.name || it?.product?.name || "Item";
const getItemQty = (it) => it?.quantity ?? 1;
const getItemTotal = (it) => it?.discountedTotal ?? it?.totalPrice ?? it?.discountedPrice ?? it?.productPrice ?? it?.price ?? 0;

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("user_token");
  const userId = localStorage.getItem("user_id");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // shipping & tracking
  const [shipments, setShipments] = useState([]);
  const [tracking, setTracking] = useState({}); // key -> data
  const [trackingBusy, setTrackingBusy] = useState(false);

  // poll status every 30s (until terminal)
  const pollRef = useRef(null);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // ------------------------------ fetch order ------------------------------
  const fetchOrder = useCallback(async () => {
    if (!token || !userId || !id) return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${id}`, { headers: authHeaders });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      if (data?.userId && String(data.userId) !== String(userId)) throw new Error("You do not have access to this order.");

      setOrder(data);
      setShipments(Array.isArray(data?.shipments) ? data.shipments : []);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, id, token, userId, authHeaders]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // ------------------------------ lightweight status polling ------------------------------
  const stopPolling = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  useEffect(() => {
    if (!order) return;
    const terminal = ["DELIVERED","CANCELLED","RETURNED"];
    if (terminal.includes(order.status)) { stopPolling(); return; }
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/orders/${id}/status`, { headers: authHeaders });
        if (!res.ok) return;
        const statusText = await res.text();
        setOrder((prev) => prev ? { ...prev, status: statusText || prev.status } : prev);
      } catch {}
    }, 30000);
    return stopPolling;
  }, [order, BASE_URL, id, authHeaders]);

  // ------------------------------ tracking (BlueDart or generic) ------------------------------
  const refreshTracking = useCallback(async () => {
    if (!shipments?.length) return;
    setTrackingBusy(true);
    const entries = await Promise.all(
      shipments.map(async (s) => {
        const key = `${s.carrier}:${s.awb}`;
        try {
          let trk = null;
          if (s.carrier?.toLowerCase() === "bluedart") {
            const r = await fetch(`${BASE_URL}/api/track/bluedart?awb=${encodeURIComponent(s.awb)}`, { headers: authHeaders });
            if (r.ok) trk = await r.json();
          } else if (s.trackingUrl) {
            const r = await fetch(`${BASE_URL}/api/track/generic?url=${encodeURIComponent(s.trackingUrl)}`, { headers: authHeaders });
            if (r.ok) trk = await r.json();
          }
          if (!trk) trk = { awb: s.awb, status: s.status || order?.status, checkpoints: s.checkpoints || [], eta: s.eta || null };
          // sort checkpoints desc by time if not already
          const cps = Array.isArray(trk.checkpoints) ? [...trk.checkpoints] : [];
          cps.sort((a,b) => new Date(b.time) - new Date(a.time));
          trk.checkpoints = cps;
          return [key, trk];
        } catch (e) {
          console.warn("Tracking failed", e);
          return [key, { awb: s.awb, status: s.status || "UNKNOWN", checkpoints: s.checkpoints || [] }];
        }
      })
    );
    setTracking(Object.fromEntries(entries));
    setTrackingBusy(false);
  }, [shipments, BASE_URL, authHeaders, order?.status]);
  useEffect(() => { if (shipments?.length) refreshTracking(); }, [shipments, refreshTracking]);

  // ------------------------------ actions ------------------------------
  const cancelOrder = async () => {
    if (!order) return;
    setProcessing(true);
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${order.id}/cancel`, { method: "DELETE", headers: authHeaders });
      if (!res.ok) throw new Error(await res.text());
      setOrder((prev) => prev ? { ...prev, status: "CANCELLED" } : prev);
      setCancelOpen(false);
    } catch (e) { alert(e.message || "Cancel failed"); }
    finally { setProcessing(false); }
  };

  const requestReturn = async (reason) => {
    if (!order) return;
    setProcessing(true);
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${order.id}/return`, { method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
      if (!res.ok) throw new Error(await res.text());
      setReturnOpen(false);
      fetchOrder();
    } catch (e) { alert(e.message || "Return request failed"); }
    finally { setProcessing(false); }
  };

  const downloadInvoice = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${id}/invoice`, { headers: authHeaders });
      if (!res.ok) throw new Error("Invoice not available");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `Invoice_${id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { alert(e.message || "Could not download invoice"); }
  };

  // ------------------------------ UI pieces ------------------------------
  const SummarySkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-5 w-80" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1,2,3].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-28 w-full"/></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-4 space-y-3"><Skeleton className="h-6 w-40"/><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-3/5"/></CardContent></Card>
    </div>
  );

  const StatusStepper = ({ status }) => {
    const terminal = ["CANCELLED", "RETURNED", "REFUND_INITIATED", "REFUNDED"];
    const upper = (status || "").toUpperCase();

    if (terminal.includes(upper)) {
      return (
        <div className="flex items-center gap-2">
          {/* <Badge className={pillClass(upper)}>{stepLabel(upper)}</Badge>
          <span className="text-xs text-muted-foreground">({stepLabel(upper)})</span> */}
        </div>
      );
    }

    const active = statusIndex(status);
    const steps = STATUS_STEPS.map((s, idx) => ({
      key: s,
      label: stepLabel(s),
      active: idx <= active
    }));

    return (
      <div className="relative">
        <div className="hidden md:grid grid-cols-8 gap-2">
          {steps.map((st) => (
            <div key={st.key} className="flex flex-col items-center">
              <motion.div
                layout
                className={`h-2 w-full rounded ${st.active ? "bg-emerald-500" : "bg-muted"}`}
              />
              <div className="mt-2 text-xs text-muted-foreground">{st.label}</div>
            </div>
          ))}
        </div>
        <div className="md:hidden flex items-center gap-2">
          <Badge className={pillClass(status)}>{stepLabel(status)}</Badge>
          <span className="text-xs text-muted-foreground">
            ({active + 1}/{STATUS_STEPS.length})
          </span>
        </div>
      </div>
    );
  };

  const TrackingTimeline = ({ checkpoints }) => (
    <div className="max-h-64 overflow-auto rounded-lg border">
      <ul className="divide-y">
        {checkpoints?.length ? checkpoints.map((c, i) => (
          <li key={i} className="p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">{c.description}</div>
              <div className="text-xs text-muted-foreground">{new Date(c.time).toLocaleString()}</div>
            </div>
            <div className="text-xs text-muted-foreground">{c.location}</div>
          </li>
        )) : (
          <li className="p-3 text-sm text-muted-foreground">No tracking events yet.</li>
        )}
      </ul>
    </div>
  );

  const ShipmentCard = ({ s }) => {
    const key = `${s.carrier}:${s.awb}`;
    const t = tracking[key] || {};
    const checkpoints = t.checkpoints || [];
    const last = checkpoints[0];
    return (
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            <CardTitle className="text-base">Shipment • {s.carrier?.toUpperCase()}</CardTitle>
          </div>
          <Badge variant="secondary">{t.status || s.status || "Fetching..."}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center flex-wrap gap-3 text-sm">
            <span className="font-medium">AWB:</span>
            <span className="px-2 py-1 rounded bg-muted">{s.awb}</span>
            <Button variant="outline" size="sm" onClick={async () => { const ok = await copyToClipboard(s.awb); if (!ok) alert("Copy failed"); }}>
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
            {s.trackingUrl && (
              <Button asChild variant="ghost" size="sm">
                <a href={s.trackingUrl} target="_blank" rel="noreferrer">
                  Open Tracking <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </Button>
            )}
          </div>

          {t.eta && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> ETA: {new Date(t.eta).toLocaleString()}
            </div>
          )}

          {last && (
            <div className="rounded-lg border p-3 bg-card">
              <div className="text-sm font-medium">{last.description}</div>
              <div className="text-xs text-muted-foreground">{last.location ? `${last.location} • ` : ""}{new Date(last.time).toLocaleString()}</div>
            </div>
          )}

          <TrackingTimeline checkpoints={checkpoints} />
        </CardContent>
      </Card>
    );
  };

  // ------------------------------ render ------------------------------
  return (
    <>
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-semibold">Order Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchOrder}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={downloadInvoice}>
              <Download className="h-4 w-4 mr-1" /> Invoice
            </Button>
          </div>
        </div>

        {loading ? (
          <SummarySkeleton />
        ) : err ? (
          <Card className="border-red-300">
            <CardContent className="p-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <div className="font-semibold text-red-700">Couldn’t load order</div>
                <div className="text-sm text-muted-foreground">{err}</div>
              </div>
            </CardContent>
          </Card>
        ) : (
          order && (
            <div className="space-y-8">
              {/* Summary header */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">Order #{order.id}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Placed on {new Date(order.createdAt).toLocaleString()} • {order.items?.length || 0} item{(order.items?.length||0) > 1 ? "s" : ""}
                    </div>
                  </div>
                  <Badge className={pillClass(order.status)}>{stepLabel(order.status)}</Badge>
                </CardHeader>
                <CardContent className="space-y-5">
                  <StatusStepper status={order.status} />
                  <div className="grid gap-4 md:grid-cols-3">

                    {/* Shipping address */}
                    <Card className="shadow-sm border rounded-2xl overflow-hidden gap-0">
                        <CardHeader className="pb-2 border-b bg-muted/40">
                            <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-indigo-600" />
                            <CardTitle className="text-base font-semibold">Shipping Address</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-2 text-sm">
                            {/* Recipient Name */}
                            <div className="font-semibold text-foreground text-base">
                            {order?.customerName || order?.shippingAddress?.name}
                            </div>

                            {/* Address Lines */}
                            <div className="space-y-1 text-muted-foreground">
                            <div>
                                {[order.shippingAddress?.houseNo, order.shippingAddress?.area, order.shippingAddress?.landmark]
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                            <div>
                                {[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.country]
                                .filter(Boolean)
                                .join(", ")}{" "}
                                {order.shippingAddress?.pinCode ? `- ${order.shippingAddress.pinCode}` : ""}
                            </div>
                            </div>

                            {/* Phone */}
                            {order?.phone && (
                            <div className="flex items-center gap-2 pt-4 border-t">
                                <PhoneCall className="h-4 w-4 text-indigo-600" />
                                <span className="font-medium">{order.phone}</span>
                            </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment */}
                    <Card className="shadow-sm border rounded-2xl overflow-hidden gap-0">
                        <CardHeader className="pb-2 border-b bg-muted/40">
                            <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-emerald-600" />
                            <CardTitle className="text-base font-semibold">Payment Summary</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            {/* Method */}
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ShieldCheck className="h-4 w-4" />
                                <span>Method</span>
                            </div>
                            <span className="font-semibold tracking-wide">
                                {(order.payment?.method || order.paymentMethod || "—").toUpperCase()}
                            </span>
                            </div>

                            {/* Status */}
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Status</span>
                            </div>
                            <Badge
                                className={
                                order.status === "PAID"
                                    ? "bg-emerald-600 text-white"
                                    : order.status === "DELIVERED"
                                    ? "bg-green-700 text-white"
                                    : order.status === "CANCELLED"
                                    ? "bg-red-600 text-white"
                                    : "bg-yellow-600 text-white"
                                }
                            >
                                {order.status || "—"}
                            </Badge>
                            </div>

                            <Separator />

                            {/* Total */}
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Package className="h-4 w-4" />
                                <span>Total</span>
                            </div>
                            <span className="text-lg font-bold text-foreground">
                                {currency(order.totalPayable)}
                            </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card className="shadow-sm border rounded-2xl overflow-hidden gap-0">
                    <CardHeader className="pb-2 border-b bg-muted/40">
                        <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-purple-600" />
                        <CardTitle className="text-base font-semibold">Order Actions</CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="p-3 py-2 grid gap-4 sm:grid-cols-2">
                        {/* Download Invoice */}
                        <button
                        onClick={downloadInvoice}
                        className="group flex items-center gap-3 rounded-xl border p-3 bg-card/50
                                    transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-purple-600/10 text-purple-600 ring-1 ring-purple-600/20">
                            <FileText className="h-4 w-4" />
                        </span>
                        <span className="font-medium leading-none group-hover:none cursor-pointer">Download Invoice</span>
                        </button>

                        {/* Need Help */}
                        <Link
                        to="/help"
                        className="group flex items-center gap-3 rounded-xl border p-3 bg-card/50
                                    transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600/10 text-indigo-600 ring-1 ring-indigo-600/20">
                            <HelpCircle className="h-4 w-4" />
                        </span>
                        <span className="font-medium leading-none group-hover:none cursor-pointer">Need Help?</span>
                        </Link>

                        {/* Cancel Order */}
                        {["DRAFT","PAYMENT_PENDING","PAID","CONFIRMED","PACKED"].includes(order.status) && (
                        <button
                            onClick={() => setCancelOpen(true)}
                            className="group flex items-center gap-3 rounded-xl border p-3
                                    transition hover:-translate-y-0.5 hover:shadow-md
                                    bg-rose-50/50 ring-1 ring-rose-600/10"
                        >
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-600/15 text-rose-600 ring-1 ring-rose-600/20">
                            <XCircle className="h-4 w-4" />
                            </span>
                            <span className="font-medium leading-none text-rose-700 group-hover:none cursor-pointer">Cancel Order</span>
                        </button>
                        )}

                        {/* Request Return */}
                        {order.status === "DELIVERED" && (
                        <button
                            onClick={() => setReturnOpen(true)}
                            className="group flex items-center gap-3 rounded-xl border p-3
                                    transition hover:-translate-y-0.5 hover:shadow-md
                                    bg-emerald-50/50 ring-1 ring-emerald-600/10"
                        >
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-600/15 text-emerald-700 ring-1 ring-emerald-600/20">
                            <Undo2 className="h-4 w-4" />
                            </span>
                            <span className="font-medium leading-none text-emerald-700 group-hover:none cursor-pointer">Request Return</span>
                        </button>
                        )}
                    </CardContent>
                    </Card>

                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    <CardTitle className="text-base">Items</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.items?.map((it) => (
                    <motion.div key={it.id} layout className="flex gap-3 items-start p-3 rounded-lg border">
                      <img src={getItemPhoto(it)} alt={getItemName(it)} className="h-20 w-20 object-cover rounded" loading="lazy" />
                      <div className="flex-1">
                        <div className="font-medium">{getItemName(it)}</div>
                        <div className="mt-1 text-sm">Qty: <span className="font-medium">{getItemQty(it)}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{currency(getItemTotal(it))}</div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Shipments & Tracking */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Truck className="h-5 w-5" /> Tracking</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={refreshTracking} disabled={trackingBusy}><RefreshCw className="h-4 w-4 mr-1" /> {trackingBusy ? "Refreshing..." : "Refresh Tracking"}</Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {shipments?.length ? shipments.map((s, i) => (
                  <ShipmentCard key={`${s.carrier}:${s.awb}:${i}`} s={s} />
                )) : (
                  <Card><CardContent className="p-4 text-sm text-muted-foreground">No shipments yet.</CardContent></Card>
                )}
              </div>

              {/* Support */}
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-5 w-5" />
                    <CardTitle className="text-base">Support</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  For delivery issues, provide the AWB and Order ID when contacting support. You can also share the latest checkpoint screenshot.
                </CardContent>
              </Card>
            </div>
          )
        )}
      </main>
      <Footer />

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel Order</DialogTitle></DialogHeader>
          <p>Are you sure you want to cancel Order #{order?.id}? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep Order</Button>
            <Button variant="destructive" onClick={cancelOrder} disabled={processing}>{processing ? "Cancelling..." : "Yes, Cancel"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return dialog */}
      <ReturnDialog open={returnOpen} onOpenChange={setReturnOpen} onSubmit={requestReturn} loading={processing} />
    </>
  );
}

function ReturnDialog({ open, onOpenChange, onSubmit, loading }) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Request Return</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Select a reason and submit your request. Return window: 7 days from delivery (customize policy).</div>
          <Input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => onSubmit(reason)} disabled={loading}>{loading ? "Submitting..." : "Submit Return"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
