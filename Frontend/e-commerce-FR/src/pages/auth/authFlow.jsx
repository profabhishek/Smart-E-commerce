import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthEmail from "./authEmail";
import AuthOTP from "./authOtp";

export default function AuthFlow() {
  const [email, setEmail] = useState(null);
  const [auth, setAuth] = useState(() => {
    const userId = localStorage.getItem("userId");
    const storedEmail = localStorage.getItem("email");
    if (userId && storedEmail) {
      return { userId, email: storedEmail };
    }
    return null;
  });

  const navigate = useNavigate();

  const handleLogout = async () => {
    // Tell backend to clear cookie
    await fetch("http://localhost:8080/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    // Clear local state
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    setAuth(null);
    setEmail(null);
  };

  // Case 1 → OTP step
  if (email && !auth) {
    return (
      <AuthOTP
        onVerify={(data) => {
          const loginData = { userId: data.userId, email };
          setAuth(loginData);

          // Save minimal info
          localStorage.setItem("userId", data.userId);
          localStorage.setItem("email", email);

          navigate("/"); // back to home after login
        }}
      />
    );
  }

  // Case 2 → Home page (default or logged in)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        {auth ? (
          <>
            <h1 className="mb-2 text-center text-2xl font-semibold">Welcome!</h1>
            <p className="text-center text-gray-600 mb-4">
              You are logged in as <strong>{auth.email}</strong>
            </p>
            <button
              onClick={handleLogout}
              className="w-full rounded-lg bg-red-500 py-2 text-white hover:bg-red-600"
            >
              Logout
            </button>
            <br />
            <br />
            <button
              onClick={() => navigate("/profile")}
              className="w-full rounded-lg bg-green-600 py-2 text-white hover:bg-green-700 mb-2"
            >
              Go to Profile
            </button>

          </>
        ) : (
          <>
            <h1 className="mb-2 text-center text-2xl font-semibold">
              Welcome to Home page
            </h1>
            <button
              onClick={() => navigate("/email")}
              className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700"
            >
              Sign In
            </button>
            <br />
            <br />
            <button
              onClick={() => navigate("/profile")}
              className="w-full rounded-lg bg-green-600 py-2 text-white hover:bg-green-700 mb-2"
            >
              Go to Profile
            </button>

          </>
        )}
      </div>
    </div>
  );
}
