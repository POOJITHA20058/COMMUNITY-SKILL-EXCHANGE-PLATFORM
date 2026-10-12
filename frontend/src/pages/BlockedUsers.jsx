import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const getApiBase = () => {
  const env = import.meta.env.VITE_API_URL || "";
  const base = env.replace(/\/api\/?$/, "") || "http://localhost:5000";
  return base.startsWith("http") ? base : "http://localhost:5000";
};
const API_BASE = getApiBase();

const getImageUrl = (profileImage) => {
  if (!profileImage) return "https://icon-library.com/images/default-profile-icon/default-profile-icon-6.jpg";
  if (profileImage.startsWith("http")) return profileImage;
  return `${API_BASE}/uploads/${profileImage}`;
};

export default function BlockedUsers() {
  const navigate = useNavigate();
  const { user, token: reduxToken } = useSelector((state) => state.auth);
  const token = reduxToken || (user && user.token) || localStorage.getItem("token");

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBlocked = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/block`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlockedUsers(res.data.blockedUsers || []);
    } catch (err) {
      console.error("Failed to fetch blocked users:", err);
      setError(err.response?.data?.message || "Failed to load blocked users");
      setBlockedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocked();
  }, [token]);

  useEffect(() => {
    if (!token && !loading) navigate("/signin", { replace: true });
  }, [token, loading, navigate]);

  const handleUnblock = async (userId, userName) => {
    if (!token) return;
    try {
      await axios.delete(`${API_BASE}/api/block/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success(`${userName} has been unblocked`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unblock user");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 text-center">
          <p className="text-gray-600 text-lg">Please sign in to view blocked users.</p>
          <button
            onClick={() => navigate("/signin")}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-red-100">
      <Navbar />
      <div className="pt-24 pb-16 px-4 md:px-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Blocked Users</h1>
        <p className="text-slate-600 mb-8">
          Blocked users cannot see your profile or send you connection requests or messages. You can unblock them below.
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={fetchBlocked}
              className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600 text-lg">You have not blocked any users.</p>
            <p className="text-slate-500 text-sm mt-1">Block someone from Community Hub or Connections if needed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blockedUsers.map((u) => (
              <div
                key={u._id}
                className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={getImageUrl(u.profileImage)}
                    alt={u.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{u.name}</h3>
                    <p className="text-sm text-slate-500 truncate">{u.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblock(u._id, u.name)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-800-500"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
