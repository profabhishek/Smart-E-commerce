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
  const userId = localStorage.getItem("user_id") || "guest";
  const token = localStorage.getItem("user_token");

  // ---------- state ----------
  const [cart, setCart] = useState(null); // { items: [], totalAmount, originalTotalAmount, totalSavings }
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  // addresses
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    pincode: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    landmark: "",
    type: "home",
  });

  const [paymentMethod, setPaymentMethod] = useState("upi"); // upi | card | netbanking | cod
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [gst, setGst] = useState({ addGst: false, gstin: "", businessName: "" });

  // coupons
  const [coupon, setCoupon] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponMeta, setCouponMeta] = useState(null); // { code, discountAmount, message }

  // optional: razorpay loader ref if you wire payments later
  const razorLoadedRef = useRef(false);

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

  // ---------- fetch user & prefill address ----------
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

        // Prefill top section
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

  // Map backend address to UI state shape
  const mapBackendAddress = (addr) => {
    if (!addr) return {};
    return {
      pincode: addr.pinCode || "",
      addressLine1: [addr.houseNo, addr.area].filter(Boolean).join(", "),
      addressLine2: addr.landmark || "",
      city: addr.city || "",
      state: addr.state || "",
      landmark: addr.landmark || "",
      type: "home",
    };
  };

  // When user switches the saved address
  useEffect(() => {
    if (!addresses.length) return;
    setAddress((prev) => ({
      ...prev,
      ...mapBackendAddress(addresses[selectedAddressIndex]),
    }));
  }, [selectedAddressIndex, addresses]);

  // ---------- optional: pincode -> city/state lookup ----------
  useEffect(() => {
    const lookup = async () => {
      const pin = (address.pincode || "").trim();
      if (pin.length !== 6) return;
      try {
        const r = await fetch(`${BASE_URL}/api/common/pincode/${pin}`);
        if (r.ok) {
          const data = await r.json(); // { city, state }
          setAddress((prev) => ({
            ...prev,
            city: data.city || prev.city,
            state: data.state || prev.state,
          }));
        }
      } catch {
        // ignore
      }
    };
    lookup();
  }, [address.pincode]);

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
  const isValidPincode = (p) => /^\d{6}$/.test(p);
  const isValidGstin = (g) =>
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test((g || "").trim());

  const validateForm = () => {
    if (!address.fullName.trim()) return "Please enter full name.";
    if (!isValidPhone(address.phone)) return "Enter a valid 10-digit mobile number.";
    if (!isValidPincode(address.pincode)) return "Enter a valid 6-digit pincode.";
    if (!address.addressLine1.trim()) return "Address line is required.";
    if (!address.city.trim() || !address.state.trim()) return "City and State are required.";
    if (gst.addGst) {
      if (!isValidGstin(gst.gstin)) return "Enter a valid GSTIN.";
      if (!gst.businessName.trim()) return "Business name is required for GST invoice.";
    }
    return null;
  };

  // ---------- coupon ----------
  const applyCoupon = async () => {
    if (!coupon.trim()) {
      setCouponMeta(null);
      return;
    }
    try {
      setCouponApplying(true);
      const res = await fetch(`${BASE_URL}/api/coupons/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code: coupon.trim(),
          amount: cart?.totalAmount ?? 0,
          items:
            cart?.items?.map((i) => ({
              productId: i.productId,
              qty: i.quantity,
            })) ?? [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponMeta(null);
        toast.error(data?.message || "Coupon not applicable");
      } else {
        setCouponMeta({
          code: coupon.trim(),
          discountAmount: Number(data.discountAmount || 0),
          message: data?.message,
        });
        toast.success(data?.message || "Coupon applied");
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not apply coupon");
    } finally {
      setCouponApplying(false);
    }
  };

  // ---------- place order (UI only; plug into your backend/Razorpay) ----------
  const handlePlaceOrder = async () => {
    if (!cart || !pricing) return;
    const err = validateForm();
    if (err) return toast.error(err);

    // TODO: Wire with your existing /api/checkout/create-order + Razorpay flow.
    // For now just simulate:
    setPlacing(true);
    setTimeout(() => {
      setPlacing(false);
      toast.success(
        paymentMethod === "cod" ? "Order placed (COD)!" : "Payment initiated!"
      );
      navigate("/order-success");
    }, 900);
  };

  // ---------- UI: loading ----------
  if (loading || !cart || !pricing) {
    return (
      <>
        <Header />
        <div className="container max-w-6xl mx-auto px-4 py-10">
          <div className="animate-pulse grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="h-60 bg-gray-200 rounded-xl" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

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
                    onChange={(e) =>
                      setAddress({ ...address, phone: e.target.value.replace(/\D/g, "") })
                    }
                    maxLength={10}
                    placeholder="98xxxxxxxx"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input
                    value={address.pincode}
                    onChange={(e) =>
                      setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") })
                    }
                    maxLength={6}
                    placeholder="110059"
                    className="mt-2"
                  />
                </div>
                <div>
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
                <div className="sm:col-span-2">
                  <Label>Address Line</Label>
                  <Input
                    value={address.addressLine1}
                    onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                    placeholder="House/Flat, Street, Area"
                    className="mt-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Address Line 2 (optional)</Label>
                  <Input
                    value={address.addressLine2}
                    onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                    placeholder="Apartment / Landmark"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="New Delhi"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    placeholder="Delhi"
                    className="mt-2"
                  />
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

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items ({cart.items.length})</span>
                  <span>₹{pricing.subtotal}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{pricing.shipping === 0 ? <Badge className="bg-green-600">Free</Badge> : `₹${pricing.shipping}`}</span>
                </div>

                <div className="flex justify-between">
                  <span>Coupon</span>
                  <span className={pricing.couponDiscount ? "text-green-600 font-medium" : ""}>
                    −₹{pricing.couponDiscount}
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
                  <span>₹{pricing.total}</span>
                </div>
                <div className="text-xs text-gray-500">Inclusive of all taxes.</div>
              </div>

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
              disabled={placing}
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
