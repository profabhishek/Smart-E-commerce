import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "../Home/Header";
import Footer from "../Home/Footer";
import RatingStars from "../../components/RatingStars";
import {
  ShoppingCart,
  Star,
  Loader2,
  Sparkles,
  ChevronRight,
  Filter,
  ArrowUpDown,
  BadgePercent,
  Truck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "../cart/CartContext";
import { getCartOwnerId } from "../../utils/auth";

export default function CategoryProducts() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [addingId, setAddingId] = useState(null);

  // Toolbar state
  const [sort, setSort] = useState("relevance"); // "relevance" | "price_low" | "price_high" | "rating"
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const ownerId = getCartOwnerId();
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${VITE_API_BASE_URL}/api/products?categoryId=${id}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        const safe = Array.isArray(data) ? data : [];
        setProducts(safe);
        if (safe.length > 0 && safe[0].category) setCategoryName(safe[0].category.name);
      } catch (err) {
        console.error("Error fetching products:", err);
        toast.error("Could not load products.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [id]);

  // Derived: filtered + sorted list
  const visibleProducts = useMemo(() => {
    let list = [...products];

    // filter by price range
    const min = Number(priceMin) || 0;
    const max = Number(priceMax) || Number.POSITIVE_INFINITY;
    list = list.filter((p) => {
      const price = Number(p.price || 0);
      return price >= min && price <= max;
    });

    // sorting
    if (sort === "price_low") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === "price_high") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sort === "rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    // relevance keeps original order
    return list;
  }, [products, sort, priceMin, priceMax]);

  const handleAdd = async (p) => {
    try {
      setAddingId(p.id);
      await addToCart(p.id, 1, ownerId);
      toast.success(`${p.name} added to cart ✅`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to add to cart");
    } finally {
      setAddingId(null);
    }
  };

  // Skeleton grid
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-72 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-emerald-500">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="g" cx="50%" cy="0%" r="80%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#g)" />
          </svg>
        </div>

        <div className="container mx-auto px-6 py-12 text-white">
          <nav className="mb-4 text-sm/relaxed opacity-90 flex items-center gap-2">
            <Link to="/" className="hover:underline cursor-pointer">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/categories" className="hover:underline cursor-pointer">Categories</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium">{categoryName || "Category"}</span>
          </nav>

          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-6 w-6" />
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {categoryName || "Category"} Posters
            </h1>
          </div>
          <p className="opacity-90 max-w-2xl">
            Explore handpicked, premium designs curated for your vibe. High-quality prints, fast delivery, great prices.
          </p>
        </div>
      </section>

      {/* TOOLBAR */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Min"
                  className="h-9 w-24 rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-gray-500">—</span>
                <input
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value.replace(/\D/g, ""))}
                  placeholder="Max"
                  className="h-9 w-24 rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={() => {
                  setPriceMin("");
                  setPriceMax("");
                }}
                className="h-9 rounded-lg border px-3 text-sm cursor-pointer hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-gray-600" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-lg border px-3 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Rating: High to Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="py-10">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : visibleProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {visibleProducts.map((p) => {
                const originalPrice = Number(p.price || 0);
                const discountPercent = p.discount ?? 20;
                const finalPrice = Math.round(originalPrice * (1 - discountPercent / 100));
                const rating = p.rating || 4.3;
                const ratingCount = p.ratingCount || 120;

                const isBestSeller = rating >= 4.5 && ratingCount > 50;
                const freeShipping = finalPrice >= 499;

                return (
                  <article
                    key={p.id}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow overflow-hidden"
                  >
                    {/* Image */}
                    <div
                      className="relative cursor-pointer"
                      onClick={() => navigate(`/products/${p.id}`)}
                    >
                      <img
                        src={p.photos?.[0]?.url || "https://via.placeholder.com/600x800?text=Poster"}
                        alt={p.name}
                        className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* discount ribbon */}
                      <div className="absolute left-3 top-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white shadow">
                          <BadgePercent className="h-3 w-3" />
                          {discountPercent}% OFF
                        </span>
                      </div>

                      {/* rating pill */}
                      <div className="absolute right-3 top-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {rating.toFixed(1)} <span className="opacity-80">({ratingCount})</span>
                        </span>
                      </div>

                      {/* quick badges bottom-left */}
                      <div className="absolute left-3 bottom-3 flex flex-wrap gap-2">
                        {isBestSeller && (
                          <span className="rounded-md bg-amber-500/90 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
                            Bestseller
                          </span>
                        )}
                        {freeShipping && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
                            <Truck className="h-3 w-3" />
                            Free Shipping
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5">
                      <h3
                        className="text-base font-semibold text-gray-900 line-clamp-1 cursor-pointer hover:text-emerald-700"
                        onClick={() => navigate(`/products/${p.id}`)}
                        title={p.name}
                      >
                        {p.name}
                      </h3>

                      {p.description && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{p.description}</p>
                      )}

                      {/* price row */}
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-emerald-600">₹{finalPrice}</span>
                            {discountPercent > 0 && (
                              <span className="text-sm text-gray-400 line-through">₹{originalPrice}</span>
                            )}
                          </div>
                          {discountPercent > 0 && (
                            <div className="text-[11px] text-rose-600 font-medium mt-0.5">
                              You save ₹{(originalPrice - finalPrice).toFixed(0)}
                            </div>
                          )}
                        </div>

                        <button
                          aria-label={`Add ${p.name} to cart`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdd(p);
                          }}
                          disabled={addingId === p.id}
                          className={`inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-semibold shadow-sm transition
                            ${addingId === p.id ? "bg-gray-300 text-gray-600" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                            cursor-pointer`}
                        >
                          {addingId === p.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding…
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold text-gray-800">No products found</h3>
              <p className="text-gray-500 mt-1">Try adjusting filters or check back later.</p>
              <button
                onClick={() => {
                  setPriceMin("");
                  setPriceMax("");
                  setSort("relevance");
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer"
              >
                <Filter className="h-4 w-4" />
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
