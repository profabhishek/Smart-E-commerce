import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../Home/Header";
import Footer from "../Home/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  BadgeIndianRupee,
  MapPin,
  Package,
  ShieldCheck,
  Gift,
  Percent,
  Smartphone,
} from "lucide-react";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("user_token");

  // ---------- state ----------
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  if (!userId) {
  navigate("/login");
  return null; // or show spinner
}

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    houseNo: "",
    area: "",
    landmark: "",
    city: "",
    state: "",
    country: "India",
    pinCode: "",
    type: "home",
  });

  const [paymentMethod, setPaymentMethod] = useState("upi"); // upi | card | netbanking | cod
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [gst, setGst] = useState({ addGst: false, gstin: "", businessName: "" });

  const [coupon, setCoupon] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponMeta, setCouponMeta] = useState(null);

  const razorLoadedRef = useRef(false);

  // ---------- load Razorpay script ----------
  useEffect(() => {
    if (razorLoadedRef.current) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      razorLoadedRef.current = true;
    };
    document.body.appendChild(script);
  }, []);

  // ---------- fetch cart ----------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/api/cart/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Failed to load cart");
        const data = await res.json();
        setCart(data);
      } catch (e) {
        console.error(e);
        toast.error("Could not load your cart.");
        navigate("/cart");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // ---------- fetch user profile --------

  const mapBackendAddress = (addr) => {
    if (!addr) return {};
    return {
      houseNo: addr.houseNo || "",
      area: addr.area || "",
      landmark: addr.landmark || "",
      city: addr.city || "",
      state: addr.state || "",
      country: addr.country || "India",
      pinCode: addr.pinCode || "",
      type: "home",
    };
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();

        const addrs = Array.isArray(data.addresses) ? data.addresses : [];
        setAddresses(addrs);

        setAddress((prev) => ({
          ...prev,
          fullName: data.name || "",
          phone: data.phone || "",
          ...mapBackendAddress(addrs[0]),
        }));
      } catch (e) {
        console.error("Profile fetch error:", e);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!addresses.length) return;
    setAddress((prev) => ({
      ...prev,
      ...mapBackendAddress(addresses[selectedAddressIndex]),
    }));
  }, [selectedAddressIndex, addresses]);

  // ---------- totals ----------
  const pricing = useMemo(() => {
    if (!cart) return null;

    const subtotal = Number(cart.totalAmount ?? 0);
    const shipping = subtotal >= 499 ? 0 : 49;
    const codFee = paymentMethod === "cod" ? 30 : 0;
    const couponDiscount = Number(couponMeta?.discountAmount ?? 0);

    const total = Math.max(0, subtotal + shipping + codFee - couponDiscount);

    return { subtotal, shipping, codFee, couponDiscount, total };
  }, [cart, paymentMethod, couponMeta]);

  // ---------- validation ----------
  const isValidPhone = (p) => /^[6-9]\d{9}$/.test(p);
  const isValidPin = (p) => /^\d{6}$/.test(p);

  const validateForm = () => {
    if (!address.fullName.trim()) return "Please enter full name.";
    if (!isValidPhone(address.phone)) return "Enter a valid 10-digit mobile number.";
    if (!isValidPin(address.pinCode)) return "Enter a valid 6-digit pin code.";
    if (!address.houseNo.trim() && !address.area.trim())
      return "Please enter House No. or Area.";
    if (!address.city.trim() || !address.state.trim())
      return "City and State are required.";
    if (gst.addGst) {
      if (!isValidGstin(gst.gstin)) return "Enter a valid GSTIN.";
      if (!gst.businessName.trim())
        return "Business name is required for GST invoice.";
    }
    return null;
  };

  async function clearCartAfterPayment() {
  if (cart?.items?.length) {
    for (const cartItem of cart.items) {
      await fetch(`${BASE_URL}/api/cart/${userId}/remove?productId=${cartItem.productId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    }
  }
  localStorage.removeItem("cart");
  setCart(null);
}

  // ---------- place order ----------
  const handlePlaceOrder = async () => {
    if (!cart || !pricing) return;
    const err = validateForm();
    if (err) return toast.error(err);

    setPlacing(true);

    try {
      // 1. Create draft order in backend
      const draftRes = await fetch(`${BASE_URL}/api/checkout/create-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
        customerName: address.fullName,
        phone: address.phone,
        address: {
          houseNo: address.houseNo,
          area: address.area,
          landmark: address.landmark,
          city: address.city,
          state: address.state,
          country: address.country,
          pinCode: address.pinCode,
          type: address.type,
        },
        gst,
        couponCode: coupon,
        paymentMethod,
      }),
      });

      if (!draftRes.ok) throw new Error("Could not create order draft");
      const order = await draftRes.json();

      if (paymentMethod === "cod") {
        // COD → confirm immediately
        await fetch(`${BASE_URL}/api/checkout/confirm-cod/${order.id}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (cart?.items?.length) {
          for (const cartItem of cart.items) {
            await fetch(`${BASE_URL}/api/cart/${userId}/remove?productId=${cartItem.productId}`, {
              method: "DELETE",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
          }
        }

        // clear frontend cart too
        localStorage.removeItem("cart");
        setCart(null);

        toast.success("Order placed (COD)!");
        navigate("/order-details");
        return;
      }

      // Online payment → create Razorpay order
      const rzpRes = await fetch(`${BASE_URL}/api/checkout/create-razorpay-order/${order.id}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!rzpRes.ok) throw new Error("Could not create Razorpay order");
      const rzpData = await rzpRes.json();

      const options = {
        key: rzpData.key,
        amount: rzpData.amount,
        currency: rzpData.currency,
        order_id: rzpData.orderId,
        name: "SmartCommerce",
        description: "Order Payment",
        method: {
          upi: paymentMethod === "upi" ? "1" : "0",
          card: paymentMethod === "card" ? "1" : "0",
          netbanking: paymentMethod === "netbanking" ? "1" : "0",
        },
        handler: async function (response) {
          console.log("🔔 Razorpay returned response:", response);

          try {
            console.log("➡️ Sending confirm-payment payload:", {
              orderId: order.id,
              razorpayOrderId: response?.razorpay_order_id,
              razorpayPaymentId: response?.razorpay_payment_id,
              razorpaySignature: response?.razorpay_signature,
            });

            const res = await fetch(`${BASE_URL}/api/checkout/confirm-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                orderId: order.id,
                razorpayOrderId: response?.razorpay_order_id,
                razorpayPaymentId: response?.razorpay_payment_id,
                razorpaySignature: response?.razorpay_signature,
              }),
            });

            if (res.ok) {
              console.log("✅ Confirm-payment success");
              await clearCartAfterPayment();
              toast.success("Payment successful!");
              setTimeout(() => {
                navigate(`/order-details?orderId=${order.id}`, { state: { orderId: order.id } });
              }, 500);
              return;
            }

            // Backend returned error (500, 400, etc.)
            const errorText = await res.text();
            console.warn("⚠️ Confirm-payment failed:", errorText);

            // 🔁 fallback: poll order status up to 3 times
            for (let i = 0; i < 3; i++) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              const poll = await fetch(`${BASE_URL}/api/orders/${order.id}/status`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });

              if (poll.ok) {
                const status = await poll.text(); // "PAID", "FAILED", etc.
                console.log(`🔎 Poll attempt ${i + 1}:`, status);
                if (status === "PAID") {
                  await clearCartAfterPayment();
                  toast.success("Payment successful!");
                  setTimeout(() => navigate("/order-details"), 500);
                  return;
                } else if (status === "FAILED") {
                  break; // stop retrying if backend says failed
                }
              }
            }

            toast.error("Payment could not be confirmed. Please contact support.");
          } catch (err) {
            console.error("💥 Payment confirmation error:", err);

            // 🛑 Last-chance fallback
            try {
              const poll = await fetch(`${BASE_URL}/api/orders/${order.id}/status`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });

              if (poll.ok) {
                const status = await poll.text();
                console.log("Last-chance poll result:", status);
                if (status === "PAID") {
                  await clearCartAfterPayment();
                  toast.success("Payment successful!");
                  setTimeout(() => navigate("/order-details"), 500);
                  return;
                }
              }
            } catch (pollErr) {
              console.error("Fallback poll failed:", pollErr);
            }

            toast.error("Could not confirm payment. Please try again.");
          }
        },
        modal: {
          ondismiss: async function () {
            console.warn("Payment popup closed by user");

            // optional: mark order as FAILED in backend
            await fetch(`${BASE_URL}/api/checkout/payment-failed`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                orderId: order.id,
                reason: "Payment window closed by user",
              }),
            });

            toast.error("Payment was cancelled.");
          },
        },
        theme: { color: "#3399cc" },
      };

      if (!window.Razorpay) {
        alert("Razorpay SDK not loaded");
        return;
      }

      console.log("Opening Razorpay:", options);
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (e) {
      console.error(e);
      toast.error("Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  // ---------- apply coupon ----------
const applyCoupon = async () => {
  if (!coupon.trim()) return toast.error("Please enter a coupon code");

  setCouponApplying(true);
  try {
    const res = await fetch(`${BASE_URL}/api/coupons/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        couponCode: coupon.trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Invalid coupon");

    setCouponMeta(data); // store response (e.g. { discountAmount, message })
    toast.success(data.message || "Coupon applied!");
  } catch (err) {
    console.error("Coupon error:", err);
    toast.error(err.message || "Could not apply coupon");
    setCouponMeta(null);
  } finally {
    setCouponApplying(false);
  }
};


  // ---------- rest of your JSX (unchanged) ----------
  const payCta =
    paymentMethod === "upi"
      ? "Pay via UPI"
      : paymentMethod === "card"
      ? "Pay with Card"
      : paymentMethod === "netbanking"
      ? "Pay via Netbanking"
      : "Place Order (COD)";

  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3 text-gray-700">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-sm">Secure Checkout • UPI / Cards / Netbanking / COD</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Address + Payment + GST */}
          <div className="lg:col-span-2 space-y-8">
            {/* Address */}
            <section className="rounded-2xl border p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold">Delivery Address</h2>
              </div>

              {/* Saved address selector */}
              {addresses.length > 0 && (
                <RadioGroup
                  value={String(selectedAddressIndex)}
                  onValueChange={(val) => setSelectedAddressIndex(Number(val))}
                  className="space-y-3 mb-4"
                >
                  {addresses.map((addr, i) => (
                    <label
                      key={addr.id || i}
                      className={`flex items-start gap-3 rounded-xl p-3 border cursor-pointer ${
                        selectedAddressIndex === i ? "border-green-600 bg-green-50" : "border-gray-200"
                      }`}
                    >
                      <RadioGroupItem value={String(i)} />
                      <div>
                        <p className="font-medium">{address.fullName || "Saved Address"}</p>
                        <p className="text-sm text-gray-600">
                          {[addr.houseNo, addr.area, addr.city, addr.state].filter(Boolean).join(", ")}{" "}
                          - {addr.pinCode}
                        </p>
                        <p className="text-xs text-gray-500">📞 {address.phone || "-"}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}

              {/* Editable form (prefilled) */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    placeholder="e.g. Abhishek Jha"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Phone (10-digit)</Label>
                  <Input
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, "") })}
                    maxLength={10}
                    placeholder="98xxxxxxxx"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>House No.</Label>
                  <Input
                    value={address.houseNo}
                    onChange={(e) => setAddress({ ...address, houseNo: e.target.value })}
                    placeholder="123"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Area</Label>
                  <Input
                    value={address.area}
                    onChange={(e) => setAddress({ ...address, area: e.target.value })}
                    placeholder="Street / Colony"
                    className="mt-2"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label>Landmark</Label>
                  <Input
                    value={address.landmark}
                    onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                    placeholder="Near park, mall..."
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>City</Label>
                  <Input
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="City"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Pin Code</Label>
                  <Input
                    value={address.pinCode}
                    onChange={(e) => setAddress({ ...address, pinCode: e.target.value.replace(/\D/g, "") })}
                    maxLength={6}
                    placeholder="110001"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Country</Label>
                  <Input
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    placeholder="India"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="mb-2">State</Label>
                  <Input
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    placeholder="Delhi"
                    className="mt-2"
                  />
                  {/* If you prefer a dropdown, swap Input with <Select> and options */}
                </div>

                <div className="sm:col-span-2">
                  <Label className="mb-2">Address Type</Label>
                  <Select value={address.type} onValueChange={(v) => setAddress({ ...address, type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent side="bottom" sideOffset={8}>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  id="whatsapp"
                  type="checkbox"
                  checked={whatsappUpdates}
                  onChange={(e) => setWhatsappUpdates(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="whatsapp" className="flex items-center gap-1 cursor-pointer">
                  <Smartphone className="h-4 w-4" /> Get order updates on WhatsApp
                </Label>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-2xl border p-5">
              <div className="flex items-center gap-2 mb-4">
                <BadgeIndianRupee className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold">Payment</h2>
              </div>

              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="grid sm:grid-cols-2 gap-3"
              >
                <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer">
                  <RadioGroupItem value="upi" />
                  <div>
                    <div className="font-medium">UPI</div>
                    <div className="text-sm text-gray-500">GPay / PhonePe / Paytm UPI</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer">
                  <RadioGroupItem value="card" />
                  <div>
                    <div className="font-medium">Cards</div>
                    <div className="text-sm text-gray-500">Visa / Mastercard / Rupay</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer">
                  <RadioGroupItem value="netbanking" />
                  <div>
                    <div className="font-medium">Netbanking</div>
                    <div className="text-sm text-gray-500">All major banks</div>
                  </div>
                </label>

              </RadioGroup>

              <Separator className="my-4" />

              {/* GST Invoice */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    id="gst"
                    type="checkbox"
                    checked={gst.addGst}
                    onChange={(e) => setGst((prev) => ({ ...prev, addGst: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="gst" className="cursor-pointer">Add GST invoice (optional)</Label>
                </div>
                {gst.addGst && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label>GSTIN</Label>
                      <Input
                        value={gst.gstin}
                        onChange={(e) =>
                          setGst((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))
                        }
                        placeholder="22AAAAA0000A1Z5"
                        maxLength={15}
                      />
                    </div>
                    <div>
                      <Label>Business Name</Label>
                      <Input
                        value={gst.businessName}
                        onChange={(e) =>
                          setGst((prev) => ({ ...prev, businessName: e.target.value }))
                        }
                        placeholder="Your Company Pvt Ltd"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT: Order Summary */}
          <aside className="space-y-4">
            <section className="rounded-2xl border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold">Order Summary</h2>
              </div>

              {!pricing ? (
                <p className="text-sm text-gray-500">Loading order summary…</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Items ({cart?.items?.length || 0})</span>
                    <span>₹{pricing?.subtotal ?? 0}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {pricing?.shipping === 0
                        ? <Badge className="bg-green-600">Free</Badge>
                        : `₹${pricing?.shipping ?? 0}`}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Coupon</span>
                    <span className={pricing?.couponDiscount ? "text-green-600 font-medium" : ""}>
                      −₹{pricing?.couponDiscount ?? 0}
                    </span>
                  </div>

                  {gst.addGst && (
                    <div className="text-xs text-gray-600">
                      GST Invoice: <span className="font-medium">{gst.businessName}</span> • GSTIN {gst.gstin}
                    </div>
                  )}

                  <Separator className="my-2" />

                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>₹{pricing?.total ?? 0}</span>
                  </div>
                  <div className="text-xs text-gray-500">Inclusive of all taxes.</div>
                </div>
              )}

              {/* coupon */}
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="Have a coupon?"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  disabled={couponApplying}
                />
                <Button onClick={applyCoupon} disabled={couponApplying}>
                  {couponApplying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Percent className="h-4 w-4 mr-1" />
                      Apply
                    </>
                  )}
                </Button>
              </div>
              {couponMeta?.message && (
                <p className="text-xs text-green-600 mt-2">{couponMeta.message}</p>
              )}
            </section>

            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handlePlaceOrder}
              disabled={placing || !pricing}
            >
              {placing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                payCta
              )}
            </Button>

            <div className="rounded-2xl border p-4 text-sm text-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4" /> <span>Returns & Support</span>
              </div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Easy replacements for damaged products.</li>
                <li>Support via email within 24–48 hrs.</li>
                <li>GST invoice available for businesses.</li>
              </ul>
            </div>
          </aside>

        </div>

        {/* Back to cart */}
        <div className="mt-6 text-sm">
          <Link to="/cart" className="text-green-700 hover:underline">
            ← Back to Cart
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
