import { useState, useEffect } from "react";
import { Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AddressManager({ user, onClose, VITE_API_BASE_URL }) {
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({
    id: null,
    country: "",
    state: "",
    city: "",
    area: "",
    houseNo: "",
    landmark: "",
    pinCode: "",
  });

  // Fetch addresses on open
  useEffect(() => {
    if (user) fetchAddresses(user.id);
  }, [user]);

  const fetchAddresses = async (userId) => {
    try {
      const res = await fetch(`${VITE_API_BASE_URL}/api/admin/users/${userId}/addresses`, {
        credentials: "include",
      });
      const data = await res.json();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load addresses");
    }
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    const method = addressForm.id ? "PUT" : "POST";
    const url = addressForm.id
      ? `${VITE_API_BASE_URL}/api/admin/users/${user.id}/addresses/${addressForm.id}`
      : `${VITE_API_BASE_URL}/api/admin/users/${user.id}/addresses`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(addressForm),
      });
      if (!res.ok) throw new Error("Save failed");

      toast.success(addressForm.id ? "Address updated!" : "Address added!");
      resetForm();
      fetchAddresses(user.id);
    } catch (err) {
      toast.error("Failed to save address");
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const res = await fetch(
        `${VITE_API_BASE_URL}/api/admin/users/${user.id}/addresses/${addressId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error("Delete failed");

      toast.success("Address deleted!");
      fetchAddresses(user.id);
    } catch (err) {
      toast.error("Failed to delete address");
    }
  };

  const resetForm = () => {
    setAddressForm({
      id: null,
      country: "",
      state: "",
      city: "",
      area: "",
      houseNo: "",
      landmark: "",
      pinCode: "",
    });
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">
          Addresses of {user?.email}
        </h3>

        {/* Address Form */}
        <form onSubmit={saveAddress} className="grid grid-cols-2 gap-3 mb-4">
          <input
            type="text"
            placeholder="House No"
            value={addressForm.houseNo}
            onChange={(e) => setAddressForm({ ...addressForm, houseNo: e.target.value })}
            className="border p-2 rounded-lg"
          />
          <input
            type="text"
            placeholder="Area"
            value={addressForm.area}
            onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
            className="border p-2 rounded-lg"
          />
          <input
            type="text"
            placeholder="City"
            value={addressForm.city}
            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
            className="border p-2 rounded-lg"
          />
          <input
            type="text"
            placeholder="State"
            value={addressForm.state}
            onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
            className="border p-2 rounded-lg"
          />
          <input
            type="text"
            placeholder="Country"
            value={addressForm.country}
            onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
            className="border p-2 rounded-lg"
          />
          <input
            type="text"
            placeholder="Landmark"
            value={addressForm.landmark}
            onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
            className="border p-2 rounded-lg"
          />
          <input
            type="text"
            placeholder="Pin Code"
            value={addressForm.pinCode}
            onChange={(e) => setAddressForm({ ...addressForm, pinCode: e.target.value })}
            className="border p-2 rounded-lg"
          />

          <div className="col-span-2 flex gap-3">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg">
              {addressForm.id ? "Update Address" : "Add Address"}
            </button>
            {addressForm.id && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg border border-gray-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Address List */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wide">
              <th className="py-2 px-3 text-left">House</th>
              <th className="py-2 px-3 text-left">Area</th>
              <th className="py-2 px-3 text-left">City</th>
              <th className="py-2 px-3 text-left">State</th>
              <th className="py-2 px-3 text-left">Pin</th>
              <th className="py-2 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {addresses.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="py-2 px-3">{a.houseNo}</td>
                <td className="py-2 px-3">{a.area}</td>
                <td className="py-2 px-3">{a.city}</td>
                <td className="py-2 px-3">{a.state}</td>
                <td className="py-2 px-3">{a.pinCode}</td>
                <td className="py-2 px-3 text-center">
                  <button
                    onClick={() => setAddressForm({ ...a })}
                    className="text-blue-600 hover:text-blue-800 mr-2"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteAddress(a.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {addresses.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  No addresses found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
