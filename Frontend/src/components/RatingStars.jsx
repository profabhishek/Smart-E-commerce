// components/RatingStars.jsx
import React from "react";

// Solid star (filled), not Lucide's outline
function SolidStar({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.283 3.967a1 1 0 0 0 .95.69h4.173c.969 0 1.371 1.24.588 1.81l-3.377 2.454a1 1 0 0 0-.364 1.118l1.29 3.99c.3.927-.755 1.688-1.54 1.12l-3.385-2.408a1 1 0 0 0-1.164 0l-3.385 2.408c-.785.568-1.84-.193-1.54-1.12l1.29-3.99a1 1 0 0 0-.364-1.118L2.005 9.394c-.783-.57-.38-1.81.588-1.81h4.173a1 1 0 0 0 .95-.69l1.283-3.967z"
      />
    </svg>
  );
}

export default function RatingStars({ rating = 0, count = 0, size = "h-4 w-4" }) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const fillPct = Math.max(0, Math.min(1, r - i)) * 100; // 0..100
          return (
            <span key={i} className="relative inline-block align-middle">
              {/* empty base */}
              <SolidStar className={`${size} text-gray-300`} />
              {/* partial/yellow overlay */}
              {fillPct > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden text-yellow-500"
                  style={{ width: `${fillPct}%` }}
                >
                  <SolidStar className={size} />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="text-xs text-gray-600 mt-2">
        {r.toFixed(1)}{count > 0 ? ` (${count})` : ""}
      </span>
    </div>
  );
}
