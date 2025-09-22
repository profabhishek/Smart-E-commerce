import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package, Truck, MapPin, Download, ChevronRight, MessageSquare, Gift, ReceiptText, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "../Home/Header";
import Footer from "../Home/Footer";


export default function OrderSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("user_token");
  const userId = localStorage.getItem("user_id");

  const orderId = useMemo(() => {
    return (
      params.get("orderId") || location?.state?.orderId || ""
    );
  }, [params, location]);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // trigger confetti only once
  const hasConfettied = useRef(false);

      useEffect(() => {
        if (order) {
        console.log("📦 Order API response:", order);
        }
    }, [order]);

    useEffect(() => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      if (!token) {
        navigate(
          "/email?next=" + encodeURIComponent(location.pathname + location.search)
        );
        return;
      }

      (async () => {
        try {
          setLoading(true);
          setError("");

          const res = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (res.status === 401) {
           navigate(
             "/email?next=" + encodeURIComponent(location.pathname + location.search)
           );
           return;
         }

          if (res.status === 403 || res.status === 404) {
            // 🚫 Not your order or doesn't exist → redirect to My Orders
            navigate("/my-orders");
            return;
          }

          
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Failed to load order");
          setOrder(data);
          if (!data || !data.id) {
            navigate("/my-orders");
            return;
          }
 setOrder(data);
          setOrder(data);
                  } catch (e) {
                    console.error(e);
                    setError("Could not fetch order details. You can still continue shopping.");
                  } finally {
                    setLoading(false);
                  }
                })();
          }, [orderId, token, navigate]);

  useEffect(() => {
    // light confetti after mount
    if (hasConfettied.current) return;
    hasConfettied.current = true;
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.3 } });
      setTimeout(() => confetti({ particleCount: 60, spread: 90, scalar: 0.8, origin: { y: 0.2 } }), 350);
    }).catch(() => {});
  }, []);

  const timeline = buildTimeline(order?.status);

    // paise → rupees with .00 formatting
    const currency = (paise) =>
    `₹${(Number(paise ?? 0) / 100).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

  const downloadInvoice = async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${orderId}/invoice`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Invoice not ready");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Invoice is not available yet. Please try again in a bit.");
    }
  };

  if (!token) {
  navigate("/email?next=" + encodeURIComponent(location.pathname + location.search));
  return null; // 🔒 don't render anything
}
  if (!loading && !order) {
  navigate("/my-orders");
  return null;
}

  return (
    <>
      <Header />

      <main className="min-h-[70vh] bg-gradient-to-b from-background to-muted/40">
        <div className="container max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left column */}
            <div className="flex-1 space-y-6">
              <HeroSuccess orderId={orderId} />

              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-600" /> Order confirmed
                  </CardTitle>
                  <CardDescription>
                    {orderId ? (
                      <>We've received your order <span className="font-medium">#{orderId}</span>. A confirmation has been sent to your email/WhatsApp.</>
                    ) : (
                      <>Your payment is successful. We're preparing your order.</>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Timeline */}
                  <ol className="relative border-s pl-6 my-4">
                    {timeline.map((step, idx) => (
                      <li key={idx} className="mb-6 ms-4">
                        <span className={`absolute -start-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ${step.done ? 'bg-green-600' : 'bg-muted-foreground/30'} ring-4 ring-background`} />
                        <h4 className={`text-sm font-medium ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</h4>
                        <p className="text-xs text-muted-foreground">{step.hint}</p>
                      </li>
                    ))}
                  </ol>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button asChild>
                    <Link to={orderId ? `/order-details?orderId=${orderId}` : "/my-orders"}>
                      Track order <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                    </Button>
                    <Button variant="outline" onClick={downloadInvoice} disabled={!orderId}>
                      <ReceiptText className="mr-2 h-4 w-4" /> Download invoice
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link to="/" className="">Continue shopping</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Items Glance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" /> Items in this order
                  </CardTitle>
                  <CardDescription>Here's a quick look at what you've purchased.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-20 w-20 rounded-xl" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : order?.items?.length ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {order.items.map((it) => (
                    <div key={it.id} className="flex gap-3 rounded-xl border p-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                        <img
                        src={
                            it.productPhoto || // cart API
                            it.product?.photo ||
                            it.product_photo || // if you later expand product details
                            "https://via.placeholder.com/150" // fallback
                        }
                        alt={it.productName}
                        className="h-full w-full object-cover"
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                        <div>
                            <div className="font-medium truncate" title={it.productName}>
                            {it.productName}
                            </div>
                            <div className="text-xs text-muted-foreground">Qty {it.quantity}</div>
                            <div className="text-sm font-semibold whitespace-nowrap">
                                {currency(
                                it.discountedTotal ?? 
                                it.totalPrice ?? 
                                it.discountedPrice ?? 
                                it.productPrice ?? 
                                it.price ??          // ✅ fix: handle backend `price`
                                0
                                )}
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No items to display.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="w-full lg:w-[360px] space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Order summary</CardTitle>
                  <CardDescription>Inclusive of all taxes.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      <RowSkeleton />
                      <RowSkeleton />
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Items ({order?.items?.length ?? 0})</span><span>{currency(order?.subtotal)}</span></div>
                      <div className="flex justify-between"><span>Shipping</span><span>{Number(order?.shippingFee) === 0 ? <Badge className="bg-green-600">Free</Badge> : currency(order?.shippingFee)}</span></div>
                      {Number(order?.codFee) > 0 && (
                        <div className="flex justify-between"><span>COD Fee</span><span>{currency(order?.codFee)}</span></div>
                      )}
                      {Number(order?.discount) > 0 && (
                        <div className="flex justify-between"><span>Discount</span><span className="text-green-600">−{currency(order?.discount)}</span></div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold text-base"><span>Total paid</span><span>{currency(order?.totalPayable)}</span></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" /> Delivery address
                  </CardTitle>
                  <CardDescription>We'll keep you posted with tracking updates.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <>
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-4 w-56 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </>
                  ) : order?.shippingAddress ? (
                    <div className="text-sm leading-relaxed">
                      <div className="font-medium">{order?.customerName}</div>
                      <div className="text-muted-foreground">
                        {[
                          order.shippingAddress?.houseNo,
                          order.shippingAddress?.area,
                          order.shippingAddress?.landmark,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      <div className="text-muted-foreground">
                        {[
                          order.shippingAddress?.city,
                          order.shippingAddress?.state,
                          order.shippingAddress?.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}{" "}
                        {order.shippingAddress?.pinCode
                          ? `- ${order.shippingAddress.pinCode}`
                          : ""}
                      </div>
                      {order?.phone ? (
                        <div className="text-xs text-muted-foreground mt-1">
                          📞 {order.phone}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Address will appear here once available.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2"><Gift className="h-5 w-5 text-green-600" /> Need help?</CardTitle>
                  <CardDescription>We're here for you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">Questions about delivery, returns, or invoice?</p>
                  <div className="flex gap-2">
                    <Button variant="secondary" asChild>
                      <a href="mailto:support@smartcommerce.example">
                        <MessageSquare className="mr-2 h-4 w-4" /> Email support
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/returns">Return policy</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {error ? (
                <p className="text-xs text-red-600">{error}</p>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function HeroSuccess({ orderId }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-emerald-600/10 via-emerald-500/10 to-emerald-400/10 p-6 md:p-8">
      <div className="absolute inset-0 -z-10 opacity-60 [background:radial-gradient(600px_circle_at_10%_10%,theme(colors.emerald.400/.25),transparent_40%),radial-gradient(600px_circle_at_90%_20%,theme(colors.emerald.500/.25),transparent_40%),radial-gradient(800px_circle_at_40%_120%,theme(colors.emerald.600/.2),transparent_40%)]" />

      <div className="flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Thank you! Your order is confirmed.</h1>
            <p className="text-sm text-muted-foreground">We're getting your items ready for dispatch.</p>
          </div>
        </div>

        <div className="md:ml-auto flex items-center gap-3">
          {orderId ? (
            <Badge variant="secondary" className="text-xs">Order ID: {orderId}</Badge>
          ) : null}
          <Badge className="bg-green-600">Paid</Badge>
        </div>
      </div>

      <div className="mt-5 grid sm:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2 rounded-2xl border bg-background/60 p-3">
          <Clock className="h-4 w-4 text-emerald-600" />
          <div>
            <div className="font-medium">Estimated dispatch</div>
            <div className="text-muted-foreground">24–48 hours</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border bg-background/60 p-3">
          <Truck className="h-4 w-4 text-emerald-600" />
          <div>
            <div className="font-medium">Delivery window</div>
            <div className="text-muted-foreground">3–6 business days</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border bg-background/60 p-3">
          <ReceiptText className="h-4 w-4 text-emerald-600" />
          <div>
            <div className="font-medium">GST invoice</div>
            <div className="text-muted-foreground">Download from your order page</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildTimeline(status) {
  // Map backend order statuses to a friendly 6-step timeline
  const steps = [
    { key: "PLACED", title: "Order placed", hint: "We've received your order.", done: true },
    { key: "PAID", title: "Payment received", hint: "Your payment was successful.", done: false },
    { key: "PROCESSING", title: "Packed", hint: "We're packing your items.", done: false },
    { key: "SHIPPED", title: "Shipped", hint: "Handed over to the courier.", done: false },
    { key: "OUT_FOR_DELIVERY", title: "Out for delivery", hint: "Arriving soon.", done: false },
    { key: "DELIVERED", title: "Delivered", hint: "Package received.", done: false },
  ];

  const order = ["PLACED","PAID","PROCESSING","SHIPPED","OUT_FOR_DELIVERY","DELIVERED"];
  const idx = Math.max(0, order.indexOf((status || "PAID").toUpperCase()));

  return steps.map((s, i) => ({ ...s, done: i <= idx }));
}

function RowSkeleton() {
  return (
    <div className="flex justify-between">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}
