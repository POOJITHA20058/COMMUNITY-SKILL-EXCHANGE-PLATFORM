import React from "react";
import { FaStar, FaRegStar } from "react-icons/fa";

/**
 * Display-only star rating (0–5). Optional count label.
 */
export const StarRatingDisplay = ({ value = 0, count = 0, showCount = true, className = "" }) => {
  const v = Math.min(5, Math.max(0, Number(value) || 0));
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="text-amber-500">
          {i <= v ? <FaStar className="inline" /> : <FaRegStar className="inline" />}
        </span>
      ))}
      {showCount && count > 0 && (
        <span className="text-slate-500 text-sm ml-1">({count})</span>
      )}
    </div>
  );
};

/**
 * Editable star rating: click to set 1–5, used for "Rate this user".
 */
export const StarRatingInput = ({ value = 0, onChange, className = "" }) => {
  const v = Math.min(5, Math.max(0, parseInt(value, 10) || 0));
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onKeyDown={(e) => (e.key === "Enter" ? onChange(i) : null)}
          className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded p-0.5"
          aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
        >
          {i <= v ? (
            <FaStar className="text-amber-500 text-xl" />
          ) : (
            <FaRegStar className="text-slate-300 text-xl hover:text-amber-400" />
          )}
        </button>
      ))}
    </div>
  );
};
