import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../components/Navbar";
import { StarRatingDisplay } from "../components/StarRating";
import { ProfileVisitBadge } from "../components/ProfileVisitBadge";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const getApiBase = () => {
  const env = import.meta.env.VITE_API_URL || "";
  const base = env.replace(/\/api\/?$/, "") || "http://localhost:5000";
  return base.startsWith("http") ? base : `http://localhost:5000`;
};
const API_BASE = getApiBase();

const formatSkill = (skill) => {
  if (typeof skill === "string") return skill;
  if (skill?.name) return skill.name;
  return String(skill);
};

const getImageUrl = (profileImage) => {
  if (!profileImage) return "https://icon-library.com/images/default-profile-icon/default-profile-icon-6.jpg";
  if (profileImage.startsWith("http")) return profileImage;
  return `${API_BASE}/uploads/${profileImage}`;
};

const AllUsers = () => {
  const navigate = useNavigate();
  const { user, token: reduxToken } = useSelector((state) => state.auth);
  const token = reduxToken || (user && user.token) || localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connections, setConnections] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Please sign in to view the community.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const url = `${API_BASE}/api/users`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      let data = [];
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : [];
      } catch {
        data = [];
      }
      if (!response.ok) {
        const msg = typeof data === "object" && data.message ? data.message : "Failed to load users";
        if (response.status === 401) {
          setError("Session expired. Please sign in again.");
          setTimeout(() => navigate("/signin"), 1500);
        }
        throw new Error(msg);
      }
      const list = Array.isArray(data) ? data : [];
      setUsers(list);
      const initialConnections = {};
      list.forEach((u) => (initialConnections[u._id] = false));
      setConnections(initialConnections);
    } catch (err) {
      setError(err.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!token && !loading) navigate("/signin", { replace: true });
  }, [token, loading, navigate]);

  const handleBlock = async (userId, userName) => {
    if (!token) {
      toast.error("Please sign in to block users");
      return;
    }
    const idStr = String(userId);
    try {
      const res = await fetch(`${API_BASE}/api/block/${idStr}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      let data = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => String(u._id) !== idStr));
        toast.success(`${userName} has been blocked`);
      } else {
        toast.error(data.message || "Failed to block user");
      }
    } catch (e) {
      toast.error("Failed to block user. Check console.");
      console.error("Block error:", e);
    }
  };

  const handleConnect = async (receiverId) => {
    if (!user?._id || !token) {
      toast.error("Please sign in to connect");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/connections/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiverId }),
      });
      const data = await res.json();
      if (res.ok) {
        setConnections((prev) => ({ ...prev, [receiverId]: true }));
        toast.success("Connection request sent!");
      } else {
        toast.error(data.message || "Failed to send request");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const filteredUsers = users.filter((u) => {
    if (u._id === user?._id) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const offeredStr = (u.skillsOffered || []).map(formatSkill).join(" ").toLowerCase();
    const wantedStr = (u.skillsWanted || []).map((s) => (typeof s === "string" ? s : s?.name || s)).join(" ").toLowerCase();
    return u.name?.toLowerCase().includes(term) || offeredStr.includes(term) || wantedStr.includes(term);
  });

  const hasResults = filteredUsers.length > 0;

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 text-center">
          <p className="text-gray-600 text-lg">Please sign in to view the community.</p>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navbar />

      <div className="pt-24 pb-16 px-4 md:px-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 text-center">
          Community Hub
        </h1>
        <p className="text-slate-600 text-center mb-8">
          Browse the community, then connect or block as needed.
        </p>

        <div className="mb-8 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Search by name or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={() => fetchUsers()}
              className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        ) : !hasResults ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600 text-lg">
              {searchTerm.trim() ? "No users match your search." : "No users in the community yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((u) => (
              <div
                key={u._id}
                className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={getImageUrl(u.profileImage)}
                      alt={u.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{u.name}</h3>
                      {u.location && (
                        <p className="text-sm text-slate-500 truncate">{u.location}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <StarRatingDisplay value={u.rating} count={u.ratingCount ?? 0} showCount={true} />
                        <ProfileVisitBadge count={u.profileVisits ?? 0} />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Offers</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(u.skillsOffered || []).length > 0 ? (
                        u.skillsOffered.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-0.5 bg-red-50 text-red-700 rounded-md text-xs font-medium"
                          >
                            {formatSkill(skill)}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs">None</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Wants</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(u.skillsWanted || []).length > 0 ? (
                        u.skillsWanted.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs"
                          >
                            {typeof skill === "string" ? skill : skill?.name || skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs">None</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/user/${u._id}`)}
                      className="px-3 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                    >
                      View profile
                    </button>
                    <button
                      onClick={() => handleConnect(u._id)}
                      disabled={connections[u._id]}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${connections[u._id]
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                    >
                      {connections[u._id] ? "Request sent" : "Connect"}
                    </button>
                    <button
                      onClick={() => handleBlock(u._id, u.name)}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-800"
                      title="Block user"
                    >
                      Block
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllUsers;
