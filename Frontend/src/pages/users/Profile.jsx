import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Home/Header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import toast, { Toaster } from "react-hot-toast";

// 🌍 Countries & states (replace with API later)
const countryStateMap = {
  India: ["Delhi", "Maharashtra", "Karnataka", "Uttar Pradesh"],
  USA: ["California", "Texas", "New York", "Florida"],
};

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [originalAddress, setOriginalAddress] = useState(null);

  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // 🛡️ Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${VITE_API_BASE_URL}/api/user/profile`, {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();

          if (
            data.role !== "USER" &&
            !data.authorities?.some((a) => a.authority === "ROLE_USER")
          ) {
            navigate("/", { replace: true });
            return;
          }

          setProfile(data);
          setOriginalProfile(data); // snapshot for comparison
          setAddresses(data.addresses || []);
        } else {
          navigate("/", { replace: true });
        }
      } catch {
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate, VITE_API_BASE_URL]);

  // 🔄 Handle profile update
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${VITE_API_BASE_URL}/api/user/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
        }),
      });
      if (res.ok) {
        toast.success("Profile updated successfully 🎉");
        setOriginalProfile(profile); // update snapshot
      } else {
        toast.error("Failed to update profile ❌");
      }
    } catch {
      toast.error("Something went wrong ❌");
    } finally {
      setSaving(false);
    }
  };

  // 📦 Address CRUD
  const handleSaveAddress = async (addr) => {
    try {
      let res;
      if (addr.id) {
        // Update
        res = await fetch(`${VITE_API_BASE_URL}/api/user/addresses/${addr.id}?userId=${profile.id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addr),
        });
      } else {
        // Add
        res = await fetch(`${VITE_API_BASE_URL}/api/user/addresses?userId=${profile.id}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addr),
        });
      }

      if (res.ok) {
        const updated = await res.json();
        if (addr.id) {
          setAddresses(addresses.map((a) => (a.id === updated.id ? updated : a)));
          toast.success("Address updated ✅");
        } else {
          setAddresses([...addresses, updated]);
          toast.success("Address added ✅");
        }
        setOriginalAddress(updated); // reset snapshot
        setShowAddressModal(false);
      } else {
        toast.error("Failed to save address ❌");
      }
    } catch {
      toast.error("Something went wrong ❌");
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const res = await fetch(`${VITE_API_BASE_URL}/api/user/addresses/${id}?userId=${profile.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setAddresses(addresses.filter((a) => a.id !== id));
        toast.success("Address deleted 🗑️");
      } else {
        toast.error("Failed to delete ❌");
      }
    } catch {
      toast.error("Something went wrong ❌");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading…</p>;
  if (!profile) return null;

  // 🛑 Compare objects
  const isProfileChanged = JSON.stringify(profile) !== JSON.stringify(originalProfile);
  const isAddressChanged = JSON.stringify(editingAddress) !== JSON.stringify(originalAddress);

  return (
    <>
      <Header />
      <Toaster position="top-right" />
      <div className="flex min-h-screen bg-gray-50 p-6">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          {/* Profile Info */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-6" onSubmit={handleSaveProfile}>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={profile.name || ""}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled className="bg-gray-100" />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={profile.phone || ""}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="flex justify-end">
                  <Button className="cursor-pointer" type="submit" disabled={saving || !isProfileChanged}>
                    {saving ? "Saving…" : "Save Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold">Addresses</CardTitle>
                <Button className="cursor-pointer" onClick={() => { setEditingAddress({}); setOriginalAddress({}); setShowAddressModal(true); }}>
                  Add Address
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses.length > 0 ? (
                addresses.map((addr) => (
                  <div key={addr.id} className="border p-4 rounded-md flex justify-between items-start">
                    <div>
                      <p><strong>{addr.houseNo}, {addr.area}</strong></p>
                      <p>{addr.city}, {addr.state}, {addr.country} - {addr.pinCode}</p>
                      <p><em>{addr.landmark}</em></p>
                    </div>
                    <div className="space-x-2">
                      <Button className="cursor-pointer"
                        variant="outline"
                        onClick={() => { setEditingAddress(addr); setOriginalAddress(addr); setShowAddressModal(true); }}
                      >
                        Edit
                      </Button>
                      <Button className="cursor-pointer" variant="destructive" onClick={() => handleDeleteAddress(addr.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No addresses saved yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Address Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAddress?.id ? "Edit Address" : "Add Address"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {["houseNo", "area", "landmark", "city", "pinCode"].map((field) => (
              <div key={field}>
                <Label htmlFor={field}>{field}</Label>
                <Input
                  id={field}
                  value={editingAddress?.[field] || ""}
                  onChange={(e) =>
                    setEditingAddress({ ...editingAddress, [field]: e.target.value })
                  }
                />
              </div>
            ))}
            <div>
              <Label htmlFor="country">Country</Label>
              <select
                className="w-full border rounded p-2"
                value={editingAddress?.country || ""}
                onChange={(e) =>
                  setEditingAddress({
                    ...editingAddress,
                    country: e.target.value,
                    state: "",
                  })
                }
              >
                <option value="">Select Country</option>
                {Object.keys(countryStateMap).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <select
                className="w-full border rounded p-2"
                value={editingAddress?.state || ""}
                onChange={(e) =>
                  setEditingAddress({ ...editingAddress, state: e.target.value })
                }
              >
                <option value="">Select State</option>
                {(countryStateMap[editingAddress?.country] || []).map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <Button className="cursor-pointer" variant="outline" onClick={() => setShowAddressModal(false)}>Cancel</Button>
              <Button className="cursor-pointer"
                onClick={() => handleSaveAddress(editingAddress || {})}
                disabled={!isAddressChanged}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
