import React from "react";
import { FaEye } from "react-icons/fa";

/**
 * Badge showing profile visit count.
 */
export const ProfileVisitBadge = ({ count = 0, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 ${className}`}
    title="Profile views"
  >
    <FaEye className="text-slate-500" />
    {count}
  </span>
);
