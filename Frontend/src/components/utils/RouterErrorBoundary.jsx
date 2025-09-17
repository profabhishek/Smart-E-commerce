import { useRouteError, useNavigate } from "react-router-dom";
import { TriangleAlert } from "lucide-react"; // nice error icon

export default function RouterErrorBoundary() {
  const err = useRouteError();
  const navigate = useNavigate();

  const status = err?.status || "Oops!";
  const statusText = err?.statusText || "Something went wrong";
  const message = err?.data || err?.message || "We couldn’t load this page.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 px-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-10 text-center border border-gray-200">
        {/* Logo */}
        <div className="mb-6">
          <span className="text-4xl font-extrabold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent drop-shadow">
            Poster पटाका
          </span>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-red-100 text-red-600">
            <TriangleAlert size={40} />
          </div>
        </div>

        {/* Error Text */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{status}</h1>
        <p className="text-lg text-gray-600 font-medium mb-1">{statusText}</p>
        <p className="text-gray-500 text-sm mb-6">{message}</p>

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition font-medium text-gray-700 cursor-pointer"
          >
            ⬅ Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white font-medium shadow hover:opacity-90 transition cursor-pointer"
          >
            🏠 Back to Home
          </button>
        </div>

        {/* Extra: Fun tagline */}
        <p className="mt-6 text-xs text-gray-400 italic">
          “Even posters need a break sometimes… we’ll get this fixed!”
        </p>
      </div>
    </div>
  );
}
