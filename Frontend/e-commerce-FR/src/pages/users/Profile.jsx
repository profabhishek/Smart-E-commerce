import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/user/profile", {
          method: "GET",
          credentials: "include", // 👈 send cookies
        });

        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          // If unauthorized → redirect to home
          navigate("/", { replace: true });
        }
      } catch (err) {
        console.error("Profile fetch failed", err);
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (!profile) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-4 text-2xl font-semibold text-center">My Profile</h1>
        <p>
          <strong>Name:</strong> {profile.name || "Not set"}
        </p>
        <p>
          <strong>Email:</strong> {profile.email}
        </p>
        <p>
          <strong>Phone:</strong> {profile.phone || "Not set"}
        </p>
        <p>
          <strong>Country:</strong> {profile.address?.country || "Not set"}
        </p>
        <p>
          <strong>City:</strong> {profile.address?.city || "Not set"}
        </p>
      </div>
    </div>
  );
}
