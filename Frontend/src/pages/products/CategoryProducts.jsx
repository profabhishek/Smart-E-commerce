import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../Home/Header";
import Footer from "../Home/Footer";
import RatingStars from "../../components/RatingStars";

export default function CategoryProducts() {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${VITE_API_BASE_URL}/api/products?categoryId=${id}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
        if (data.length > 0 && data[0].category) {
          setCategoryName(data[0].category.name);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [id]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      {/* Banner */}
      <section className="relative bg-gradient-to-r from-green-700 via-green-600 to-green-500 py-16 shadow-lg">
        <div className="container mx-auto px-6 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {categoryName || "Category"} Posters
          </h1>
          <p className="mt-3 text-lg opacity-90 max-w-2xl mx-auto">
            Explore handpicked posters from this category. Trendy, aesthetic & inspiring.
          </p>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          {loading ? (
            // ---------------- Skeleton Loader ----------------
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="group bg-white rounded-2xl shadow-md overflow-hidden relative border border-gray-100 animate-pulse"
                >
                  {/* Image skeleton */}
                  <div className="w-full h-80 bg-gray-200" />

                  {/* Details skeleton */}
                  <div className="p-5 flex flex-col justify-between h-48">
                    <div>
                      <div className="h-5 w-2/3 bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-full bg-gray-200 rounded mb-1" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded" />
                      <div className="flex gap-1 mt-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-4 w-4 bg-gray-200 rounded" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="space-y-1">
                        <div className="h-5 w-20 bg-gray-200 rounded" />
                        <div className="h-4 w-16 bg-gray-200 rounded" />
                      </div>
                      <div className="h-8 w-16 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            // ---------------- Real Product Cards ----------------
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
              {products.map((p) => {
                const originalPrice = p.price;
                const discountPercent = p.discount || 20;
                const finalPrice = Math.round(originalPrice * (1 - discountPercent / 100));
                const rating = p.rating || 4.3;
                const ratingCount = p.ratingCount || 120;

                return (
                  <div
                    key={p.id}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden relative border border-gray-100"
                  >
                    {/* Image */}
                    <div className="relative">
                      <img
                        src={p.photos?.[0]?.url || "https://via.placeholder.com/400x600"}
                        alt={p.name}
                        className="w-full h-80 object-cover transform group-hover:scale-105 duration-500"
                      />
                      {p.category && (
                        <span className="absolute top-3 left-3 bg-green-600 text-xs px-3 py-1 rounded-full text-white shadow">
                          {p.category.name}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-5 flex flex-col justify-between h-48">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {p.description}
                        </p>
                        <RatingStars rating={rating} count={ratingCount} size="h-5 w-5 mt-2" />
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <span className="text-lg font-semibold text-green-600">
                            ₹{finalPrice}
                          </span>
                          <span className="ml-2 text-sm line-through text-gray-400">
                            ₹{originalPrice}
                          </span>
                          <span className="ml-1 text-xs text-red-500 font-medium">
                            {discountPercent}% OFF
                          </span>
                        </div>
                        <Link
                          to={`/products/${p.id}`}
                          className="px-4 py-1.5 text-sm font-semibold rounded-lg 
                                    bg-green-600 hover:bg-green-700 text-white 
                                    shadow-md transition cursor-pointer"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center text-lg">
              No products found in this category.
            </p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
