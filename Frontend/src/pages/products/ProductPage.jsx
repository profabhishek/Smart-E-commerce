import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "../Home/Header";
import Footer from "../Home/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "../cart/CartContext"; // optional, refresh if available
import toast from "react-hot-toast";
import {
  Star,
  ShieldCheck,
  Truck,
  RefreshCw,
  Heart,
  Minus,
  Plus,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

// ---------- helpers: quantity persistence (per user + product) ----------
const qtyKey = (uid, pid) => `qp:${uid || "guest"}:${pid}`;
const getSavedQty = (uid, pid) => {
  try {
    const s = localStorage.getItem(qtyKey(uid, pid));
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
};
const setSavedQty = (uid, pid, q) => {
  try {
    localStorage.setItem(qtyKey(uid, pid), String(q));
  } catch {}
};

// ---------- tiny utils ----------
const currency = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);
const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
const fallbackImg =
  "https://images.unsplash.com/photo-1611162618071-b39a2ec2cfb6?q=80&w=1200&auto=format&fit=crop"; // neutral placeholder

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8082";
  const token = localStorage.getItem("user_token");
  const userId = localStorage.getItem("user_id") || "2"; // demo fallback matches sample payload

  // ✅ use the same methods as CartPage
  const { fetchCartCount } = useCart();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const thumbStripRef = useRef(null);

  // -------- fetch product --------
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        if (!res.ok) throw new Error(`Failed to load product (${res.status})`);
        const data = await res.json();
        if (cancelled) return;
        setProduct(data);
        // restore qty
        const saved = getSavedQty(userId, data.id);
        setQuantity(saved || 1);
        // fetch featured by category
        if (data?.category?.id) {
          const fRes = await fetch(`${API_BASE}/api/products?categoryId=${data.category.id}`);
          if (fRes.ok) {
            const list = await fRes.json();
            const filtered = (list || []).filter((p) => p.id !== data.id).slice(0, 8);
            setFeatured(filtered);
          }
        }
      } catch (e) {
        setError(e.message || "Could not load product");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // keep quantity persisted
  useEffect(() => {
    if (product?.id && quantity > 0) setSavedQty(userId, product.id, quantity);
  }, [quantity, product?.id, userId]);

  const inStock = !!product?.inStock && (product?.stock ?? 0) > 0;
  const photos = useMemo(() => {
    if (!product?.photos?.length) return [fallbackImg];
    return product.photos.map((p) => p?.url || fallbackImg);
  }, [product]);

  const discountPct = useMemo(() => {
    if (!product?.price || !product?.discountPrice) return 0;
    const d = 100 - Math.round((product.discountPrice / product.price) * 100);
    return d > 0 ? d : 0;
  }, [product?.price, product?.discountPrice]);

  // -------- cart operations --------
  const callWithAuth = (url, options = {}) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

  const addToCart = async () => {
    if (!product?.id) return;
    if (!inStock) return toast.error("Out of stock");
    const qty = clamp(quantity, 1, product.stock || 1);

    try {
      const url = `${API_BASE}/api/cart/${encodeURIComponent(userId)}/add?productId=${product.id}&quantity=${qty}`;
      const res = await callWithAuth(url, { method: "POST" });
      if (!res.ok) throw new Error("Unable to add to cart");

      await res.json().catch(() => null);

      // 🔹 This will update Header badge instantly
      fetchCartCount();

      toast.success("Added to cart");
    } catch (e) {
      toast.error(e.message || "Unable to add to cart");
    }
  };


const buyNow = async () => {
  if (!product?.id) return;
  if (!inStock) return toast.error("Out of stock");

  const qty = clamp(quantity, 1, product.stock || 1);

  try {
    const url = `${API_BASE}/api/cart/${encodeURIComponent(userId)}/update?productId=${product.id}&quantity=${qty}`;
    const res = await callWithAuth(url, { method: "PUT" });
    if (!res.ok) throw new Error("Unable to set cart quantity");

    await res.json().catch(() => null);
    fetchCartCount();

    navigate("/checkout");
  } catch (e) {
    toast.error(e.message || "Unable to proceed to checkout");
  }
};

  const adjustQty = (dir) => {
    if (!product) return;
    setQuantity((q) => clamp(q + dir, 1, product.stock || 1));
  };

  // --------- skeletons ---------
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <Skeleton className="w-full aspect-[4/5] rounded-2xl" />
              <div className="mt-4 grid grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            </div>
            <div>
              <Skeleton className="h-8 w-80" />
              <div className="mt-2 flex items-center gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
              <Separator className="my-6" />
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          </div>
          <Separator className="my-10" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-destructive text-lg font-medium">{error}</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>Retry</Button>
        </main>
        <Footer />
      </div>
    );
  }

  // --------- main render ---------
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4 opacity-60" />
          <Link to={`/category/${product?.category?.id || "all"}`} className="hover:text-foreground transition-colors">
            {product?.category?.name || "Posters"}
          </Link>
          <ChevronRight className="h-4 w-4 opacity-60" />
          <span className="text-foreground line-clamp-1" aria-current="page">{product?.name}</span>
        </nav>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Gallery */}
          <div>
            {/* hero image */}
            <div className="relative rounded-3xl overflow-hidden shadow-sm ring-1 ring-border">
              <img
                src={photos[selected] || fallbackImg}
                onError={(e) => (e.currentTarget.src = fallbackImg)}
                alt={product?.name}
                className="w-full h-full object-cover max-h-[640px]"
              />
              {discountPct > 0 && (
                <Badge className="absolute top-4 left-4 text-sm">-{discountPct}%</Badge>
              )}
            </div>
            {/* thumbnails */}
            <div ref={thumbStripRef} className="mt-4 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-8 gap-3">
              {photos.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`relative aspect-square rounded-2xl ring-1 ring-border overflow-hidden transition-transform ${
                    selected === i ? "ring-2 ring-foreground scale-[1.01]" : "hover:scale-[1.01]"
                  }`}
                  aria-label={`Show image ${i + 1}`}
                >
                  <img src={src} onError={(e) => (e.currentTarget.src = fallbackImg)} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:pl-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">{product?.name}</h1>
              <button className="p-2 rounded-full border hover:bg-accent" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
              </button>
            </div>

            {/* rating */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(product?.rating || 0) ? "fill-yellow-400" : "opacity-30"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{(product?.rating ?? 0).toFixed(1)} / 5</span>
            </div>

            {/* price */}
            <div className="mt-4 flex items-end gap-3">
              <div className="text-3xl font-bold">{currency(product?.discountPrice ?? product?.price)}</div>
              {product?.discountPrice && product?.discountPrice < product?.price && (
                <div className="text-muted-foreground line-through">{currency(product.price)}</div>
              )}
              {discountPct > 0 && <Badge variant="secondary">Save {discountPct}%</Badge>}
            </div>

            <p className="mt-4 text-muted-foreground leading-relaxed">{product?.description}</p>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <Spec label="SKU" value={product?.sku} />
              <Spec label="Size" value={product?.size} />
              <Spec label="Material" value={product?.material} />
              <Spec label="Weight" value={`${product?.weight ?? "-"} kg`} />
            </div>

            <Separator className="my-6" />

            {/* quantity selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-2xl border">
                <button
                  className="p-3 disabled:opacity-40"
                  onClick={() => adjustQty(-1)}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(clamp(Number(e.target.value || 1), 1, product?.stock || 1))}
                  className="w-14 text-center outline-none bg-transparent"
                  min={1}
                  max={product?.stock || 1}
                  aria-label="Quantity"
                />
                <button
                  className="p-3 disabled:opacity-40"
                  onClick={() => adjustQty(1)}
                  disabled={!product?.stock || quantity >= product.stock}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <div className={`text-sm font-medium ${inStock ? "text-green-500" : "text-red-500"}`}>
                {inStock ? "In stock" : "Out of stock"}
              </div>

            </div>

            {/* actions */}
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="rounded-2xl h-12 text-base" onClick={addToCart} disabled={!inStock}>
                Add to Cart
              </Button>
              <Button size="lg" className="rounded-2xl h-12 text-base" variant="secondary" onClick={buyNow} disabled={!inStock}>
                Buy Now
              </Button>
            </div>

            {/* assurances */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <Assure icon={ShieldCheck} title="Secure Checkout" subtitle="256‑bit SSL" />
              <Assure icon={Truck} title="Fast Delivery" subtitle="2–5 business days" />
              <Assure icon={RefreshCw} title="Easy Returns" subtitle="7‑day policy" />
            </div>

            {/* tags */}
            {product?.tags?.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {product.tags.map((t) => (
                  <Badge key={t} variant="outline">#{t}</Badge>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {/* Featured Posters */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Featured Posters</h2>
            <Link to={`/category/${product?.category?.id || "all"}`} className="text-sm text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="text-sm text-muted-foreground">No featured items found.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featured.map((fp) => (
                <Card key={fp.id} className="group overflow-hidden rounded-3xl">
                  <Link to={`/products/${fp.id}`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-3xl">
                      <img
                        src={fp?.photos?.[0]?.url || fallbackImg}
                        onError={(e) => (e.currentTarget.src = fallbackImg)}
                        alt={fp.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {fp.discountPrice && fp.discountPrice < fp.price && (
                        <Badge className="absolute top-3 left-3">Save {100 - Math.round((fp.discountPrice / fp.price) * 100)}%</Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-medium line-clamp-1">{fp.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-4 w-4" /> {(fp.rating ?? 0).toFixed(1)}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="font-semibold">{currency(fp.discountPrice ?? fp.price)}</div>
                        {fp.discountPrice && fp.discountPrice < fp.price && (
                          <div className="text-xs text-muted-foreground line-through">{currency(fp.price)}</div>
                        )}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Spec({ label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-2xl border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Assure({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border p-3">
      <Icon className="h-5 w-5" />
      <div>
        <div className="text-sm font-medium leading-none">{title}</div>
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      </div>
    </div>
  );
}
