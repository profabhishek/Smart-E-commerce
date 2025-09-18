import React from "react";
import ReactDOM from "react-dom/client";
import RoutesRoot from "./routes/routes";
import "./index.css";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { CartProvider } from "./pages/cart/CartContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
      <CartProvider>
        <QueryClientProvider client={queryClient}>
          <RoutesRoot />
        </QueryClientProvider>
      </CartProvider>
    </GoogleReCaptchaProvider>
  </React.StrictMode>
);
