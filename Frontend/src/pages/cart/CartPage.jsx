import { useEffect, useState } from "react";
import Header from "../Home/Header";
import Footer from "../Home/Footer";
import "../../App.css";
import { Trash2 } from "lucide-react";
import { useCart } from "./CartContext"; // 👈 context

export default function CartPage({ userId }) {
  const [cartSummary, setCartSummary] = useState(null);
  const [optimisticItems, setOptimisticItems] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("user_token");

  // ✅ context methods
  const { fetchCartCount, addToCart, removeFromCart } = useCart();

  // Fetch cart details
  const fetchCart = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/cart/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCartSummary(data);
      setIsUpdating(false);

      // sync header cart
      fetchCartCount();
    } catch (err) {
      console.error("Cart fetch failed:", err);
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [userId]);

  // Quantity update (optimistic)
  const updateQuantity = async (productId, newQuantity, oldQuantity) => {
    if (!cartSummary) return;

    setOptimisticItems((prev) => ({
      ...prev,
      [productId]: newQuantity,
    }));
    setIsUpdating(true);

    // 🔹 Update context immediately
    const diff = newQuantity - oldQuantity;
    if (diff > 0) addToCart(productId, diff);
    if (diff < 0) removeFromCart(productId); // naive: one by one; can be extended

    try {
      await fetch(
        `${BASE_URL}/api/cart/${userId}/update?productId=${productId}&quantity=${newQuantity}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchCart();
    } catch (err) {
      console.error("Failed to update cart:", err);
      fetchCart();
    }
  };

  const removeItem = async (productId) => {
    setIsUpdating(true);
    // 🔹 Update context immediately
    removeFromCart(productId);

    try {
      await fetch(
        `${BASE_URL}/api/cart/${userId}/remove?productId=${productId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchCart();
    } catch (err) {
      console.error("Failed to remove item:", err);
      fetchCart();
    }
  };

  // ---------------------- Skeleton Loader ----------------------
  if (!cartSummary) {
    return (
      <>
        <Header />
        <div className="p-6 max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-6 text-gray-800">🛒 Your Shopping Cart</h2>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="flex items-center gap-6 border rounded-xl p-4 shadow-sm bg-white animate-pulse"
                >
                  <div className="w-28 h-28 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-2/3 bg-gray-200 rounded" />
                    <div className="h-4 w-1/3 bg-gray-200 rounded" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded" />
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md h-fit space-y-4 animate-pulse">
              <div className="h-5 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
              <div className="h-10 w-full bg-gray-200 rounded mt-4" />
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // ---------------------- Actual UI ----------------------
  return (
    <>
      <Header />
      <div className="p-6 max-w-5xl mx-auto min-h-70">
        <h2 className="text-3xl font-extrabold mb-6 text-gray-800">🛒 Your Shopping Cart</h2>

        {cartSummary.items.length === 0 ? (
          <p className="text-lg text-gray-500">Your cart is empty</p>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {cartSummary.items.map((item) => {
                const optimisticQty = optimisticItems[item.productId] ?? item.quantity;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-6 border rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white"
                  >
                    <img
                      src={item.productPhoto || "https://via.placeholder.com/150"}
                      alt={item.productName}
                      className="w-28 h-28 object-cover rounded-lg shadow"
                    />

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">{item.productName}</h3>

                      {isUpdating ? (
                        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mt-2" />
                      ) : (
                        <>
                          {item.discount > 0 ? (
                            <div className="mt-1">
                              <span className="text-green-600 font-bold text-lg">
                                ₹{item.discountedPrice}
                              </span>
                              <span className="ml-2 text-gray-400 line-through">₹{item.productPrice}</span>
                              <span className="ml-2 text-xs text-red-500 font-medium">{item.discount}% OFF</span>
                            </div>
                          ) : (
                            <p className="text-gray-700 font-semibold">₹{item.productPrice}</p>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={isUpdating || optimisticQty <= 1}
                        className={`px-2 py-1 rounded transition 
                          ${isUpdating ? "bg-gray-300 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300 cursor-pointer"}`}
                        onClick={() =>
                          updateQuantity(item.productId, optimisticQty - 1, item.quantity)
                        }
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-semibold">{optimisticQty}</span>
                      <button
                        disabled={isUpdating}
                        className={`px-2 py-1 rounded transition 
                          ${isUpdating ? "bg-gray-300 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300 cursor-pointer"}`}
                        onClick={() =>
                          updateQuantity(item.productId, optimisticQty + 1, item.quantity)
                        }
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right w-28">
                      {isUpdating ? (
                        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
                      ) : (
                        <>
                          <p className="font-semibold text-gray-800">₹{item.discountedTotal}</p>
                          {item.discount > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                              Saved ₹{(item.totalPrice - item.discountedTotal).toFixed(2)}
                            </p>
                          )}
                        </>
                      )}
                      <button
                        disabled={isUpdating}
                        className={`p-2 rounded hover:bg-red-50 mt-1 
                          ${isUpdating ? "text-gray-400 cursor-not-allowed" : "text-red-600 cursor-pointer"}`}
                        onClick={() => removeItem(item.productId)}
                        title="Remove"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md h-fit sticky top-20">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Order Summary</h3>
              <div className="space-y-2 text-gray-700">
                {isUpdating ? (
                  <>
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
                  </>
                ) : (
                  <>
                    <p className="flex justify-between">
                      <span>Original Total:</span>
                      <span>₹{cartSummary.originalTotalAmount}</span>
                    </p>
                    <p className="flex justify-between text-green-600 font-medium">
                      <span>You Saved:</span>
                      <span>₹{cartSummary.totalSavings}</span>
                    </p>
                    <p className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Final Total:</span>
                      <span>₹{cartSummary.totalAmount}</span>
                    </p>
                  </>
                )}
              </div>
              <button
                disabled={isUpdating}
                className={`mt-6 w-full py-3 font-bold rounded-lg shadow transition
                  ${isUpdating ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"}`}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
