import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  ShieldCheck,
  Truck,
  BadgePercent,
  Stars,
  ArrowRight,
  Flame,
  Gift,
} from "lucide-react";
import RatingStars from "../../components/RatingStars";

export default function HomePage() {
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ---- data ----
  const fetchCategories = async () => {
    const res = await fetch(`${VITE_API_BASE_URL}/api/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
  };
  
  const fetchProducts = async () => {
    const res = await fetch(`${VITE_API_BASE_URL}/api/products`);
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json();
  };

  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const {
    data: products = [],
    isLoading: productsLoading,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const loading = categoriesLoading || productsLoading;

  // Interleave products for variety
  const grouped = products.reduce((acc, p) => {
    const key = p.category?.id ?? "uncategorized";
    (acc[key] ||= []).push(p);
    return acc;
  }, {});
  const interleaved = [];
  const keys = Object.keys(grouped);
  let more = true;
  while (more) {
    more = false;
    for (const k of keys) {
      if (grouped[k].length) {
        interleaved.push(grouped[k].shift());
        more = true;
      }
    }
  }

  // ---- skeletons ----
  const ProductSkeleton = () => (
    <div className="rounded-2xl border bg-white overflow-hidden">
      <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );

  const CategorySkeleton = () => (
    <div className="rounded-xl border bg-white p-6 text-center">
      <div className="h-20 w-20 mx-auto rounded-full bg-gray-200 animate-pulse" />
      <div className="h-4 w-20 mx-auto mt-4 bg-gray-200 rounded animate-pulse" />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 overflow-x-hidden">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* clipped blobs (won’t cause horizontal scroll) */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-400/25 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-lime-300/25 blur-3xl" />
        </div>

        <div className="bg-gradient-to-br from-white via-emerald-50 to-white">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-4 py-1 text-emerald-700 text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4" />
              New drops every week
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
              Express Yourself with{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                Stunning Posters
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Curated, high-quality art & quotes for every mood. Premium print,
              fast delivery, and prices that make you smile.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/products"
                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-white font-semibold shadow-md hover:bg-emerald-700 transition"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/about"
                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-gray-900 font-semibold border border-gray-200 hover:bg-gray-50 transition"
              >
                Learn More
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm text-gray-700">
              <div className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 border">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Secure Payments
              </div>
              <div className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 border">
                <Truck className="h-5 w-5 text-emerald-600" />
                Fast Delivery
              </div>
              <div className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 border">
                <BadgePercent className="h-5 w-5 text-emerald-600" />
                Best Prices
              </div>
              <div className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 border">
                <Stars className="h-5 w-5 text-emerald-600" />
                Premium Quality
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">
              Featured <span className="text-emerald-700">Posters</span>
            </h2>
            <Link
              to="/products"
              className="cursor-pointer hidden sm:inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-semibold"
            >
              Browse all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {[1, 2, 3, 4].map((n) => (
                <ProductSkeleton key={n} />
              ))}
            </div>
          ) : interleaved.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {interleaved.slice(0, 8).map((p) => {
                const price = Number(p.price || 0);
                const discount = p.discount ?? 20;
                const final = Math.max(0, Math.round(price * (1 - discount / 100)));
                const rating = p.rating || 4.6;
                const ratingCount = p.ratingCount || 120;

                return (
                  <article
                    key={p.id}
                    className="group relative rounded-2xl border bg-white overflow-hidden"
                  >
                    {/* media */}
                    <div className="relative overflow-hidden">
                      <img
                        src={p.photos?.[0]?.url || "https://via.placeholder.com/800x1000?text=Poster"}
                        alt={p.name}
                        loading="lazy"
                        className="w-full aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-[1.03] will-change-transform"
                      />
                      {/* chips */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                          <Flame className="h-3.5 w-3.5" />
                          {discount}% OFF
                        </span>
                        {p.category?.name && (
                          <span className="rounded-full bg-emerald-600/90 px-2.5 py-1 text-[11px] text-white shadow">
                            {p.category.name}
                          </span>
                        )}
                      </div>
                      {/* gradient */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent opacity-80" />
                    </div>

                    {/* content */}
                    <div className="p-4">
                      <h3
                        className="text-lg font-extrabold text-gray-900 line-clamp-1 cursor-pointer"
                        title={p.name}
                        onClick={() => (window.location.href = `/products/${p.id}`)}
                      >
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {p.description}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-emerald-600 font-semibold">₹{final}</span>
                            {discount > 0 && (
                              <span className="text-gray-400 line-through text-sm">₹{price}</span>
                            )}
                          </div>
                          <div className="mt-1">
                            <RatingStars rating={rating} count={ratingCount} size="h-4 w-4" />
                          </div>
                        </div>

                        <Link
                          to={`/products/${p.id}`}
                          className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-white text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No products found</p>
          )}

          {/* mobile 'browse all' */}
          <div className="mt-8 sm:hidden text-center">
            <Link
              to="/products"
              className="cursor-pointer inline-flex items-center gap-2 text-emerald-700 font-semibold"
            >
              Browse all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-gray-100 py-14">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">
              Shop by <span className="text-emerald-700">Category</span>
            </h2>
            <span className="hidden sm:block text-sm text-gray-600">
              Explore themes, aesthetics, and vibes.
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <CategorySkeleton key={n} />
              ))}
            </div>
          ) : categories.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className="cursor-pointer group rounded-xl border bg-white overflow-hidden hover:shadow-md transition"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img
                      src={cat.icon || "https://via.placeholder.com/600?text=Category"}
                      alt={cat.name}
                      loading="lazy"
                      className="h-24 w-24 object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{cat.name}</span>
                    <ArrowRight className="h-4 w-4 text-emerald-600" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No categories found</p>
          )}
        </div>
      </section>

      {/* USP STRIP */}
      <section className="bg-white border-y">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-700">
          <div className="flex items-start gap-3">
            <Gift className="h-6 w-6 text-emerald-600" />
            <div>
              <div className="font-semibold">Handpicked Designs</div>
              <div className="text-sm text-gray-500">
                Curated by artists & trend scouts.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="h-6 w-6 text-emerald-600" />
            <div>
              <div className="font-semibold">Lightning Fast Delivery</div>
              <div className="text-sm text-gray-500">
                Pan-India shipping with tracking.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <div>
              <div className="font-semibold">Secure & Hassle-free</div>
              <div className="text-sm text-gray-500">
                UPI/Cards/Netbanking with 100% safety.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-16 -left-10 h-64 w-64 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-10 h-72 w-72 bg-emerald-900/20 rounded-full blur-3xl" />
        </div>

        <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-700 text-white">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-12 sm:py-14 text-center">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Ready to level up your walls?
            </h3>
            <p className="mt-2 text-emerald-100">
              Explore thousands of designs across every mood & moment.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/products"
                className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-emerald-700 font-semibold shadow hover:bg-gray-100 transition"
              >
                Explore Posters <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/category/3"
                className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-white font-semibold shadow hover:bg-emerald-400 transition"
              >
                Trending Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
