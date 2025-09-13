import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Home/Header";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Same endpoint, but now only for *display* purposes.
    // Header already fetched it, so this will usually hit browser cache.
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/user/profile", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
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
  }, [navigate]);

  if (loading) return <p className="text-center mt-10">Loading…</p>;
  if (!profile) return null;

  return (
    <>
      <Header /> {/* header now has live profile data */}
      {/* <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
          <h1 className="mb-4 text-2xl font-semibold text-center">
            My Profile
          </h1>
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
      </div> */}
    </>
  );
}
