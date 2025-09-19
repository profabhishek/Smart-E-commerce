import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../Home/Header";
import Footer from "../Home/Footer";
import RatingStars from "../../components/RatingStars";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${VITE_API_BASE_URL}/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        setProduct(data);

        // Fetch related products from same category
        if (data.category) {
          const relatedRes = await fetch(
            `${VITE_API_BASE_URL}/api/products?categoryId=${data.category.id}&limit=4`
          );
          const relatedData = await relatedRes.json();
          setRelatedProducts(relatedData.filter((p) => p.id !== data.id));
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleQuantityChange = (change) => {
    setQuantity((prev) => Math.max(1, prev + change));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />

        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image skeleton */}
            <div className="space-y-4">
              <div className="w-full h-96 bg-gray-200 rounded-2xl animate-pulse" />
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Details skeleton */}
            <div className="space-y-6">
              <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="h-20 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <div className="container mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Product not found
          </h1>
          <Link
            to="/"
            className="mt-4 inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            Back to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const originalPrice = product.price;
  const discountPercent = product.discount || 20;
  const finalPrice = Math.round(originalPrice * (1 - discountPercent / 100));
  const rating = product.rating || 4.3;
  const ratingCount = product.ratingCount || 120;
  const images = product.photos || ["https://via.placeholder.com/600x800"];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <nav className="text-sm text-gray-600">
            <Link to="/" className="hover:text-green-600 transition">
              Home
            </Link>
            <span className="mx-2">/</span>
            {product.category && (
              <>
                <Link
                  to={`/categories/${product.category.id}`}
                  className="hover:text-green-600 transition">
                  {product.category.name}
                </Link>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-gray-800 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-96 object-cover rounded-2xl shadow-lg"
                />
                {product.category && (
                  <span className="absolute top-4 left-4 bg-green-600 text-xs px-3 py-1 rounded-full text-white shadow">
                    {product.category.name}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="absolute top-4 right-4 bg-red-500 text-xs px-3 py-1 rounded-full text-white shadow">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                        selectedImage === index
                          ? "border-green-600"
                          : "border-gray-200 hover:border-green-300"
                      }`}>
                      <img
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {product.name}
                </h1>
                <RatingStars
                  rating={rating}
                  count={ratingCount}
                  size="h-5 w-5"
                />
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Description
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-green-600">
                    ₹{finalPrice}
                  </span>
                  {discountPercent > 0 && (
                    <>
                      <span className="text-lg line-through text-gray-400">
                        ₹{originalPrice}
                      </span>
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                        Save ₹{originalPrice - finalPrice}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-500">Inclusive of all taxes</p>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition">
                    -
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center font-medium border-x border-gray-300">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition">
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition shadow-lg">
                  Buy Now
                </button>
                <button className="flex-1 bg-white hover:bg-gray-50 text-green-600 font-semibold py-3 px-6 rounded-xl border-2 border-green-600 transition">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              Related Posters
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {relatedProducts.map((p) => {
                const relatedOriginalPrice = p.price;
                const relatedDiscountPercent = p.discount || 20;
                const relatedFinalPrice = Math.round(
                  relatedOriginalPrice * (1 - relatedDiscountPercent / 100)
                );
                const relatedRating = p.rating || 4.3;
                const relatedRatingCount = p.ratingCount || 120;

                return (
                  <div
                    key={p.id}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                    <div className="relative">
                      <img
                        src={
                          p.photos?.[0] || "https://via.placeholder.com/400x600"
                        }
                        alt={p.name}
                        className="w-full h-64 object-cover transform group-hover:scale-105 duration-500"
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-800 line-clamp-1 mb-2">
                        {p.name}
                      </h3>
                      <RatingStars
                        rating={relatedRating}
                        count={relatedRatingCount}
                        size="h-4 w-4 mb-3"
                      />

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-semibold text-green-600">
                            ₹{relatedFinalPrice}
                          </span>
                          {relatedDiscountPercent > 0 && (
                            <span className="ml-2 text-sm line-through text-gray-400">
                              ₹{relatedOriginalPrice}
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/products/${p.id}`}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg 
                                    bg-green-600 hover:bg-green-700 text-white 
                                    shadow-md transition cursor-pointer">
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
