// src/pages/cart/CartPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../Home/Header";
import Footer from "../Home/Footer";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "./CartContext";
import { getCartOwnerId } from "../../utils/auth";
import toast from "react-hot-toast";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// icons
import {
  Trash2,
  ShieldCheck,
  Truck,
  RefreshCw,
  Lock,
  ArrowRight,
  Sparkles,
  Star,
  Plus,
  Minus,
  CreditCard,
} from "lucide-react";

/* --------------------------------- utils --------------------------------- */
const INR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1609525311189-2209786b29a1?q=80&w=1200&auto=format&fit=crop";

/* ------------------------------ free shipping ----------------------------- */
const FREE_SHIPPING_THRESHOLD = 399;

/* ================================ Component =============================== */
export default function CartPage() {
  const navigate = useNavigate();
  const userId = getCartOwnerId();

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8082";
  const token = localStorage.getItem("user_token");

  // cart context
  const { fetchCartCount, removeFromCart } = useCart();

  // local state
  const [cartSummary, setCartSummary] = useState(null);
  const [optimisticQty, setOptimisticQty] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  // recommendations
  const [reco, setReco] = useState({ fbt: [], related: [] });
  const [loadingReco, setLoadingReco] = useState(true);

  const hasShownToast = useRef(false);

  /* ------------------------------ fetch helpers ------------------------------ */
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Add-to-cart from cards (FBT/Trending) with **instant** reflect in cart UI
  const addRecoToCart = async (p) => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/cart/${userId}/add?productId=${p.id}&quantity=1`,
        { method: "POST", headers: authHeaders }
      );
      if (!res.ok) throw new Error("Unable to add");
      const added = await res.json().catch(() => null);

      // update header badge immediately
      fetchCartCount();

      // ✅ Optimistic cart update so it shows instantly
      setCartSummary((prev) => {
        if (!prev) return prev; // only runs once cartSummary is known

        const items = [...prev.items];
        const idx = items.findIndex((i) => i.productId === p.id);

        const unitPrice = added?.productPrice ?? p.price ?? 0;
        const unitDiscounted = added?.discountedPrice ?? p.discountPrice ?? unitPrice;

        if (idx >= 0) {
          const curr = items[idx];
          const nextQty = (curr.quantity || 0) + 1;
          items[idx] = {
            ...curr,
            quantity: nextQty,
            totalPrice: unitPrice * nextQty,
            discountedTotal: unitDiscounted * nextQty,
          };
        } else {
          items.unshift({
            id: added?.id ?? Math.random().toString(36).slice(2),
            productId: p.id,
            productName: p.name,
            productPrice: unitPrice,
            quantity: 1,
            totalPrice: unitPrice,
            productPhoto: p?.photos?.[0]?.url || PLACEHOLDER_IMG,
            discount:
              added?.discount ??
              (p.discountPrice && p.discountPrice < p.price
                ? 100 - Math.round((p.discountPrice / p.price) * 100)
                : 0),
            discountedPrice: unitDiscounted,
            discountedTotal: unitDiscounted,
          });
        }

        // bump totals
        const next = {
          ...prev,
          items,
          totalItems: (prev.totalItems ?? 0) + 1,
          originalTotalAmount: (prev.originalTotalAmount ?? 0) + unitPrice,
          totalAmount: (prev.totalAmount ?? 0) + unitDiscounted,
          totalSavings: (prev.totalSavings ?? 0) + (unitPrice - unitDiscounted),
        };

        // also keep optimistic qty map in sync
        setOptimisticQty((q) => ({
          ...q,
          [p.id]: (q[p.id] ?? (idx >= 0 ? items[idx].quantity : 0)) || 1,
        }));

        return next;
      });

      toast.success("Added to cart");
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Unable to add");
    }
  };

  const fetchCart = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/cart/${userId}`, { headers: authHeaders });
      const data = await res.json();
      setCartSummary(data);

      // reflect qty in optimistic map
      const next = {};
      data?.items?.forEach((it) => (next[it.productId] = it.quantity));
      setOptimisticQty(next);

      setIsUpdating(false);
      fetchCartCount(); // sync header badge
    } catch (err) {
      console.error("Cart fetch failed:", err);
      setIsUpdating(false);
    }
  };

  // fetch recommendations (always set loading flag so skeletons render reliably)
  const fetchRecommendations = async () => {
    setLoadingReco(true);
    try {
      const res = await fetch(`${BASE_URL}/api/products`);
      if (!res.ok) {
        setReco({ fbt: [], related: [] });
        return;
      }
      const all = await res.json();
      const sorted = [...all].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      setReco({
        fbt: sorted.slice(0, 4),
        related: sorted.slice(4, 12),
      });
    } catch (e) {
      console.error("fetchRecommendations failed:", e);
      setReco({ fbt: [], related: [] });
    } finally {
      setLoadingReco(false); // ✅ ensures skeletons disappear only after we tried
    }
  };

  /* --------------------------------- effects -------------------------------- */
  useEffect(() => {
    const t = localStorage.getItem("user_token");
    if (!t && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.error("Please login to view your cart");
      navigate("/email");
      return;
    }
    fetchCart();
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /* ------------------------------- qty updates ------------------------------- */
  const updateQuantity = async (productId, newQuantity) => {
    if (!cartSummary) return;
    setOptimisticQty((prev) => ({ ...prev, [productId]: newQuantity }));
    setIsUpdating(true);

    try {
      await fetch(
        `${BASE_URL}/api/cart/${userId}/update?productId=${productId}&quantity=${newQuantity}`,
        { method: "PUT", headers: authHeaders }
      );
      await fetchCart();
    } catch (err) {
      console.error("Failed to update cart:", err);
      await fetchCart();
    }
  };

  const removeItem = async (productId) => {
    // Optimistic removal + toast instantly
    setCartSummary((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.productId !== productId),
      totalItems: Math.max((prev.totalItems ?? 1) - 1, 0),
    }));

    removeFromCart(productId);
    fetchCartCount();
    toast.success("Removed from cart");

    try {
      await fetch(`${BASE_URL}/api/cart/${userId}/remove?productId=${productId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      await fetchCart();
    } catch (err) {
      console.error("Failed to remove item:", err);
      await fetchCart();
    }
  };

  /* --------------------------------- totals --------------------------------- */
  const totals = useMemo(() => {
    if (!cartSummary) return null;
    const original = cartSummary.originalTotalAmount ?? 0;
    const youSaved = cartSummary.totalSavings ?? 0;
    const final = cartSummary.totalAmount ?? 0; // backend discounted subtotal
    const toFreeShip = Math.max(FREE_SHIPPING_THRESHOLD - final, 0);

    return {
      original,
      youSaved,
      final,
      toFreeShip,
      progress: Math.min((final / FREE_SHIPPING_THRESHOLD) * 100, 100),
    };
  }, [cartSummary]);

  /* ------------------------------- skeleton UI ------------------------------- */
  if (!cartSummary) {
    return (
      <>
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* cart item skeletons */}
            <div className="lg:col-span-2 space-y-4">
              {[1, 2].map((k) => (
                <div key={k} className="flex gap-5 border rounded-3xl p-4 bg-card shadow-sm">
                  <Skeleton className="w-28 h-28 rounded-2xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>

            {/* order summary skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
            </div>
          </div>

          {/* FBT skeleton */}
          <section className="mt-12">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <RecoSkeletonCard key={i} />
              ))}
            </div>
          </section>

          {/* Trending / Recommended (always show skeleton while loadingReco) */}
          <TrendingSection title="🔥 Trending Posters" reco={reco} loading={loadingReco} onAdd={addRecoToCart} />
        </div>
        <Footer />
      </>
    );
  }

  /* ------------------------------- empty state ------------------------------- */
  if ((cartSummary.items?.length ?? 0) === 0) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section className="rounded-3xl border bg-gradient-to-br from-background via-background to-muted p-8 text-center">
            <img
              src="/src/assets/empty_cart.jpg"
              alt="Empty cart"
              className="mx-auto w-60 h-72 object-cover rounded-3xl shadow-md"
            />
            <h1 className="mt-6 text-2xl md:text-3xl font-semibold tracking-tight">Your cart is feeling lonely</h1>
            <p className="mt-2 text-muted-foreground">Discover premium posters loved by our community.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild size="lg" className="rounded-2xl">
                <Link to="/">Continue Shopping</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="rounded-2xl">
                <Link to="/category/3">Explore Sports Posters</Link>
              </Button>
            </div>
          </section>

          {/* Trending / Recommended (shows skeleton first, then data) */}
          <TrendingSection title="🔥 Trending Posters" reco={reco} loading={loadingReco} onAdd={addRecoToCart} />
        </main>
        <Footer />
      </>
    );
  }

  /* -------------------------------- real cart -------------------------------- */
  return (
    <>
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* free shipping banner / progress */}
        {totals && (
          <div className="rounded-3xl border p-4 sm:p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center gap-3">
            <Truck className="h-5 w-5" />
            {totals.toFreeShip > 0 ? (
              <p className="text-sm">
                Add <span className="font-semibold">{INR(totals.toFreeShip)}</span> more to unlock{" "}
                <span className="font-semibold">FREE Shipping</span>!
              </p>
            ) : (
              <p className="text-sm font-medium">🎉 You unlocked FREE Shipping!</p>
            )}
            <div className="ml-auto w-40 sm:w-64 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${totals.progress}%` }} />
            </div>
          </div>
        )}

        <div className="mt-6 grid lg:grid-cols-3 gap-8">
          {/* items */}
          <section className="lg:col-span-2 space-y-4">
            {cartSummary.items.map((item) => {
              const q = optimisticQty[item.productId] ?? item.quantity;
              const hasDiscount = item.discount > 0 && item.discountedPrice < item.productPrice;
              const img = item.productPhoto || PLACEHOLDER_IMG;

              return (
                <div
                  key={item.id}
                  className="group relative flex items-center gap-5 border rounded-3xl p-4 sm:p-5 bg-card shadow-sm hover:shadow-md transition"
                >
                  <div className="relative shrink-0">
                    <img
                      src={img}
                      alt={item.productName}
                      onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                      className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl ring-1 ring-border"
                    />
                    {hasDiscount && <Badge className="absolute -top-2 -left-2 text-[10px] px-2">-{item.discount}%</Badge>}
                  </div>

                  {/* details */}
                  <div className="min-w-0 flex-1">
                    <Link to={`/products/${item.productId}`} className="block">
                      <h3 className="font-semibold leading-tight line-clamp-1 hover:underline">{item.productName}</h3>
                    </Link>
                    <div className="mt-1 text-sm text-muted-foreground">Premium Poster</div>

                    {/* price */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="font-semibold">{INR(item.discountedPrice ?? item.productPrice)}</div>
                      {hasDiscount && <div className="text-xs text-muted-foreground line-through">{INR(item.productPrice)}</div>}
                    </div>
                  </div>

                  {/* qty & remove */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center rounded-2xl border">
                      <button
                        disabled={isUpdating}
                        className="p-2 sm:p-3 hover:bg-accent rounded-l-2xl disabled:opacity-50"
                        onClick={() =>
                          q <= 1
                            ? removeItem(item.productId)
                            : updateQuantity(item.productId, clamp(q - 1, 1, 999))
                        }
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        className="w-12 text-center bg-transparent outline-none"
                        value={q}
                        min={1}
                        onChange={(e) => updateQuantity(item.productId, clamp(Number(e.target.value || 1), 1, 999))}
                        aria-label="Quantity"
                      />
                      <button
                        disabled={isUpdating}
                        className="p-2 sm:p-3 hover:bg-accent rounded-r-2xl disabled:opacity-50"
                        onClick={() => updateQuantity(item.productId, clamp(q + 1, 1, 999))}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold">{INR(item.discountedTotal)}</div>
                      {hasDiscount && (
                        <div className="text-[11px] text-emerald-600">
                          You saved {INR((item.totalPrice - item.discountedTotal).toFixed(0))}
                        </div>
                      )}
                    </div>

                    <button
                      disabled={isUpdating}
                      onClick={() => removeItem(item.productId)}
                      title="Remove"
                      className="text-red-600 hover:bg-red-50 rounded-xl p-2 transition disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </section>

          {/* summary */}
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-3xl border p-5 bg-card shadow-sm">
              <h3 className="text-xl font-semibold">Order Summary</h3>

              <Separator className="my-5" />

              <div className="space-y-2 text-sm">
                <Row label="Original Total" value={INR(cartSummary.originalTotalAmount ?? 0)} />
                <Row
                  label={<span className="text-emerald-700">Discount</span>}
                  value={<span className="text-emerald-700">-{INR(cartSummary.totalSavings ?? 0)}</span>}
                />
                <Separator className="my-3" />
                <Row label={<span className="font-semibold">Final Total</span>} value={<span className="font-semibold">{INR(totals.final)}</span>} />
              </div>

              {/* trust badges */}
              <div className="mt-5 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                <Trust icon={ShieldCheck} title="Secure" subtitle="256-bit SSL" />
                <Trust icon={RefreshCw} title="Easy Returns" subtitle="7-days" />
                <Trust icon={CreditCard} title="UPI / Cards" subtitle="All modes" />
              </div>

              <Button onClick={() => navigate("/checkout")} className="mt-5 w-full h-12 rounded-2xl text-base">
                Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="mt-2 text-xs text-center text-muted-foreground">
                <Lock className="inline h-3 w-3 mr-1" />
                Payments are encrypted and secured.
              </p>
            </div>
          </aside>
        </div>

        {/* FBT / Recommendations */}
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> Frequently Bought Together
            </h2>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>

          {loadingReco ? (
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <RecoSkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {reco.fbt.map((p) => (
                <Card key={p.id} className="group rounded-3xl overflow-hidden">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-3xl">
                    <img
                      src={p?.photos?.[0]?.url || PLACEHOLDER_IMG}
                      onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {p.discountPrice && p.discountPrice < p.price && (
                      <Badge className="absolute top-3 left-3">
                        Save {100 - Math.round((p.discountPrice / p.price) * 100)}%
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/product/${p.id}`} className="font-medium line-clamp-1 hover:underline">
                        {p.name}
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-4 w-4" /> {(p.rating ?? 0).toFixed(1)}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="font-semibold">{INR(p.discountPrice ?? p.price)}</div>
                      {p.discountPrice && p.discountPrice < p.price && (
                        <div className="text-xs text-muted-foreground line-through">{INR(p.price)}</div>
                      )}
                    </div>
                    <Button onClick={() => addRecoToCart(p)} size="sm" className="mt-3 w-full rounded-2xl">
                      Add
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* You may also like */}
        <TrendingSection title="You may also like" reco={reco} loading={loadingReco} onAdd={addRecoToCart} />
      </main>

      {/* sticky mobile checkout bar */}
      {totals && (
        <div className="lg:hidden sticky bottom-0 inset-x-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-lg font-semibold">{INR(totals.final)}</div>
            </div>
            <Button onClick={() => navigate("/checkout")} className="rounded-2xl">
              Checkout <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

/* -------------------------------- subcomponents ------------------------------- */
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div>{label}</div>
      <div>{value}</div>
    </div>
  );
}

function Trust({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border p-2">
      <Icon className="h-4 w-4" />
      <div>
        <div className="leading-none">{title}</div>
        <div className="text-[10px] text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}

function RecoSkeletonCard() {
  return (
    <Card className="rounded-3xl overflow-hidden">
      <div className="aspect-[3/4] rounded-3xl overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-9 w-full rounded-2xl" />
      </CardContent>
    </Card>
  );
}

function TrendingSection({ title = "🔥 Trending Posters", reco, loading, onAdd }) {
  const list = (reco?.related?.length ? reco.related : reco?.fbt || []).slice(0, 8);

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          View all
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <RecoSkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {list.map((p) => (
            <Card key={p.id} className="group rounded-3xl overflow-hidden">
              <Link to={`/product/${p.id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-3xl">
                  <img
                    src={p?.photos?.[0]?.url || PLACEHOLDER_IMG}
                    onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {p.discountPrice && p.discountPrice < p.price && (
                    <Badge className="absolute top-3 left-3">
                      Save {100 - Math.round((p.discountPrice / p.price) * 100)}%
                    </Badge>
                  )}
                </div>
              </Link>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium line-clamp-1">{p.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-4 w-4" /> {(p.rating ?? 0).toFixed(1)}
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="font-semibold">{INR(p.discountPrice ?? p.price)}</div>
                  {p.discountPrice && p.discountPrice < p.price && (
                    <div className="text-xs text-muted-foreground line-through">{INR(p.price)}</div>
                  )}
                </div>
                {onAdd && (
                  <Button onClick={() => onAdd(p)} size="sm" className="mt-3 w-full rounded-2xl">
                    Add
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
