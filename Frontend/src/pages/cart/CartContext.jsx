import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("user_token");

  // 🔹 Fetch actual cart count from backend
  const fetchCartCount = async () => {
    if (!userId || !token) {
      setCartCount(0);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/cart/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCartCount(data.totalItems || 0);
      }
    } catch (err) {
      console.error("Failed to fetch cart count:", err);
    }
  };

  // 🔹 Optimistic Add to Cart
  const addToCart = async (productId, quantity = 1) => {
    const userId = localStorage.getItem("user_id");
    const token = localStorage.getItem("user_token");

    if (!userId || !token) {
      toast.error("Please login to add items to cart");
      navigate("/email");   // 👈 redirect to login page
      return;
    }

    setCartCount((prev) => prev + quantity);

    try {
      await fetch(`${BASE_URL}/api/cart/${userId}/add?productId=${productId}&quantity=${quantity}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCartCount();
    } catch (err) {
      console.error("Add to cart failed:", err);
      setCartCount((prev) => Math.max(0, prev - quantity));
    }
  };

  // 🔹 Optimistic Remove from Cart
  const removeFromCart = async (productId) => {
    if (!userId || !token) return;

    // Optimistically set to unknown (force refresh)
    setCartCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(
        `${BASE_URL}/api/cart/${userId}/remove?productId=${productId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchCartCount();
    } catch (err) {
      console.error("Remove from cart failed:", err);
      fetchCartCount(); // rollback by syncing
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartCount,
        setCartCount,
        fetchCartCount,
        addToCart,
        removeFromCart,
      }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
