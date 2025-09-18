import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Home/Header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle,DialogClose } from "@/components/ui/dialog";
import toast, { Toaster } from "react-hot-toast";
import { X } from "lucide-react";
import Footer from "../Home/Footer";

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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);


  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const userToken = localStorage.getItem("user_token");

  // 🛡️ Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${VITE_API_BASE_URL}/api/user/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`, // ✅ send user token
          },
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
  }, [navigate, VITE_API_BASE_URL, userToken]);

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`, // ✅ send user token
        },
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
        res = await fetch(
          `${VITE_API_BASE_URL}/api/user/addresses/${addr.id}?userId=${profile.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userToken}`, // ✅ send user token
            },
            body: JSON.stringify(addr),
          }
        );
      } else {
        // Add
        res = await fetch(
          `${VITE_API_BASE_URL}/api/user/addresses?userId=${profile.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userToken}`, // ✅ send user token
            },
            body: JSON.stringify(addr),
          }
        );
      }

      if (res.ok) {
        const updated = await res.json();
        if (addr.id) {
          setAddresses(
            addresses.map((a) => (a.id === updated.id ? updated : a))
          );
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
      const res = await fetch(
        `${VITE_API_BASE_URL}/api/user/addresses/${id}?userId=${profile.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userToken}`, // ✅ send user token
          },
        }
      );
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
  const isProfileChanged =
    JSON.stringify(profile) !== JSON.stringify(originalProfile);
  const isAddressChanged =
    JSON.stringify(editingAddress) !== JSON.stringify(originalAddress);

  return (
    <>
      <Header />
      <Toaster position="top-center" />
      <div className="flex min-h-screen bg-gray-50 p-6">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          {/* Profile Info */}
      <Card className="shadow-xl border rounded-2xl">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Profile Information
          </CardTitle>
          <p className="text-sm text-gray-500">Manage your personal details here</p>
        </CardHeader>

        <CardContent className="pt-6">
          <form className="space-y-6" onSubmit={handleSaveProfile}>
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                value={profile.name || ""}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="h-12 rounded-lg bg-gray-100 border-gray-300 text-gray-500"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                value={profile.phone || ""}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="h-11 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all duration-200"
                disabled={saving || !isProfileChanged}
              >
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
                      <Button
                        className="cursor-pointer"
                        variant="destructive"
                        onClick={() => {
                          setAddressToDelete(addr.id);   // store the ID of the address
                          setShowDeleteModal(true);      // open confirmation modal
                        }}
                      >
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
        <DialogContent className="sm:max-w-lg rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-lg font-semibold text-gray-800">
              {editingAddress?.id ? "Edit Address" : "Add Address"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 pt-3">
            {/* House & Area side by side */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <Label className="mb-2" htmlFor="houseNo">House No.</Label>
                <Input
                  id="houseNo"
                  value={editingAddress?.houseNo || ""}
                  onChange={(e) =>
                    setEditingAddress({ ...editingAddress, houseNo: e.target.value })
                  }
                  placeholder="123"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <Label className="mb-2" htmlFor="area">Area</Label>
                <Input
                  id="area"
                  value={editingAddress?.area || ""}
                  onChange={(e) =>
                    setEditingAddress({ ...editingAddress, area: e.target.value })
                  }
                  placeholder="Street / Colony"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Landmark */}
            <div>
              <Label className="mb-2" htmlFor="landmark">Landmark</Label>
              <Input
                id="landmark"
                value={editingAddress?.landmark || ""}
                onChange={(e) =>
                  setEditingAddress({ ...editingAddress, landmark: e.target.value })
                }
                placeholder="Near park, mall..."
                className="h-10 text-sm"
              />
            </div>

            {/* City & Pincode side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-2" htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editingAddress?.city || ""}
                  onChange={(e) =>
                    setEditingAddress({ ...editingAddress, city: e.target.value })
                  }
                  placeholder="City"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <Label className="mb-2" htmlFor="pinCode">Pin Code</Label>
                <Input
                  id="pinCode"
                  value={editingAddress?.pinCode || ""}
                  onChange={(e) =>
                    setEditingAddress({ ...editingAddress, pinCode: e.target.value })
                  }
                  placeholder="110001"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <Label className="mb-2" htmlFor="country">Country</Label>
              <select
                id="country"
                className="w-full h-10 text-sm rounded-md border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* State */}
            <div>
              <Label className="mb-2" htmlFor="state">State</Label>
              <select
                id="state"
                className="w-full h-10 text-sm rounded-md border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={editingAddress?.state || ""}
                onChange={(e) =>
                  setEditingAddress({ ...editingAddress, state: e.target.value })
                }
              >
                <option value="">Select State</option>
                {(countryStateMap[editingAddress?.country] || []).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                className="cursor-pointer"
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddressModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                onClick={() => handleSaveAddress(editingAddress || {})}
                disabled={!isAddressChanged}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md rounded-xl shadow-lg [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-red-600">
              Are you sure?
            </DialogTitle>
            <p className="text-sm text-gray-500">
              This action will permanently delete the address. You cannot undo this.
            </p>

            {/* ✅ Custom Close Button with cursor-pointer */}
            <DialogClose asChild>
              <button
                className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogClose>
          </DialogHeader>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleDeleteAddress(addressToDelete);
                setShowDeleteModal(false);
              }}
            >
              Yes, Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Footer */}
      <Footer />
    </>
  );
}
