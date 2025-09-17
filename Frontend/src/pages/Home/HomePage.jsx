import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // 🔹 Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${VITE_API_BASE_URL}/api/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // 🔹 Fetch Products
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${VITE_API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // 🔹 Run both once on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchProducts()]);
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-100 via-white to-green-50 py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 leading-tight">
            Express Yourself with <span className="text-green-700">Posters</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Find trendy, quirky, and inspiring posters to brighten up your walls.
            From art prints to motivational quotes, Poster Pataka has it all.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              to="/products"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md"
            >
              Shop Now
            </Link>
            <Link
              to="/about"
              className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg shadow-sm hover:bg-gray-50"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gradient-to-b from-gray-50 via-white to-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-12">
            Featured <span className="text-green-700">Posters</span>
          </h2>

          {loading ? (
            // 🔹 Featured Products Skeleton
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="relative group rounded-2xl overflow-hidden shadow-lg border border-gray-100 animate-pulse"
                >
                  {/* Poster image skeleton */}
                  <div className="w-full h-96 bg-gray-200" />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gray-300/30" />

                  {/* Text overlay skeleton */}
                  <div className="absolute bottom-0 w-full p-5 space-y-3">
                    <div className="h-5 w-3/4 bg-gray-200 rounded" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded" />
                    <div className="flex items-center justify-between mt-3">
                      <div className="h-5 w-16 bg-gray-200 rounded" />
                      <div className="h-8 w-20 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
              {products.length > 0 ? (
                (() => {
                  const grouped = products.reduce((acc, p) => {
                    const catId = p.category?.id || "uncategorized";
                    if (!acc[catId]) acc[catId] = [];
                    acc[catId].push(p);
                    return acc;
                  }, {});
                  const interleaved = [];
                  const catKeys = Object.keys(grouped);
                  let hasMore = true;
                  while (hasMore) {
                    hasMore = false;
                    for (const key of catKeys) {
                      if (grouped[key].length > 0) {
                        interleaved.push(grouped[key].shift());
                        hasMore = true;
                      }
                    }
                  }

                  return interleaved.slice(0, 6).map((p) => (
                    <div
                      key={p.id}
                      className="relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100"
                    >
                      {/* Poster image */}
                      <img
                        src={p.photos?.[0] || "https://via.placeholder.com/400x600"}
                        alt={p.name}
                        className="w-full h-96 object-cover transform group-hover:scale-105 duration-500 opacity-100 group-hover:opacity-30 transition"
                      />

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition"></div>

                      {/* Text overlay */}
                      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent p-5 text-white">
                        <h3 className="text-lg md:text-xl font-extrabold tracking-tight drop-shadow-lg">
                          {p.name}
                        </h3>
                        <p className="text-sm text-gray-200 mt-1 line-clamp-2 drop-shadow-md">
                          {p.description}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-lg font-semibold text-green-400 drop-shadow-md">
                            ₹{p.price}
                          </span>
                          <Link
                            to={`/products/${p.id}`}
                            className="px-4 py-1.5 text-sm font-semibold rounded-lg 
                                      bg-gradient-to-r from-green-600 to-green-500 
                                      hover:from-green-700 hover:to-green-600 
                                      shadow-md transition cursor-pointer"
                          >
                            View
                          </Link>
                        </div>
                      </div>

                      {/* Category Tag */}
                      {p.category && (
                        <span className="absolute top-3 left-3 bg-green-600/90 text-white text-xs px-3 py-1 rounded-full shadow-md">
                          {p.category.name}
                        </span>
                      )}
                    </div>
                  ));
                })()
              ) : (
                <p className="text-gray-500 text-center col-span-full">
                  No products found
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Shop by Category
          </h2>

          {loading ? (
            // 🔹 Categories Skeleton
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-lg shadow p-6 flex flex-col items-center animate-pulse"
                >
                  <div className="w-20 h-20 rounded-full bg-gray-200 mb-4" />
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md flex flex-col items-center cursor-pointer transition"
                >
                  <div className="w-20 h-20 rounded-full border-2 flex items-center justify-center mb-4 bg-gray-50 overflow-hidden">
                    <img
                      src={cat.icon || "https://via.placeholder.com/200"}
                      alt={cat.name}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <span className="font-medium text-gray-700">{cat.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No categories found</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
