import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ✅ Always pick user token only (ROLE_USER)
  const getUserAuth = () => {
    const userId = localStorage.getItem("user_id");
    const token = localStorage.getItem("user_token"); // must be ROLE_USER token
    return { userId, token };
  };

  // 🔹 Fetch actual cart count from backend
  const fetchCartCount = async () => {
    const { userId, token } = getUserAuth();
    if (!userId || !token) {
      setCartCount(0);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/cart/${userId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCartCount(data.totalItems || 0);
      } else {
        console.warn("Cart fetch failed:", res.status);
        setCartCount(0);
      }
    } catch (err) {
      console.error("Failed to fetch cart count:", err);
      setCartCount(0);
    }
  };

  // 🔹 Optimistic Add to Cart
  const addToCart = async (productId, quantity = 1) => {
    const { userId, token } = getUserAuth();
    if (!userId || !token) {
      toast.error("Please login to add items to cart");
      window.location.href = "/email";
      return;
    }

    setCartCount((prev) => prev + quantity); // optimistic update

    try {
      const res = await fetch(
        `${BASE_URL}/api/cart/${userId}/add?productId=${productId}&quantity=${quantity}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Add to cart failed");
      fetchCartCount(); // sync real count
    } catch (err) {
      console.error(err);
      setCartCount((prev) => Math.max(0, prev - quantity)); // rollback
      toast.error("Could not add item to cart");
    }
  };

  // 🔹 Optimistic Remove from Cart
  const removeFromCart = async (productId) => {
    const { userId, token } = getUserAuth();
    if (!userId || !token) return;

    setCartCount((prev) => Math.max(0, prev - 1)); // optimistic update

    try {
      const res = await fetch(
        `${BASE_URL}/api/cart/${userId}/remove?productId=${productId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Remove from cart failed");
      fetchCartCount(); // sync
    } catch (err) {
      console.error(err);
      fetchCartCount(); // rollback by syncing again
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
