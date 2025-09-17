import React from "react";
import ReactDOM from "react-dom/client";
import RoutesRoot from "./routes/routes";
import "./index.css";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { CartProvider } from "./pages/cart/CartContext";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
      <CartProvider>
        <RoutesRoot />
      </CartProvider>
    </GoogleReCaptchaProvider>
  </React.StrictMode>
);
