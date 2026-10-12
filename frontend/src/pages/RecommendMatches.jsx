import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const getApiBase = () => {
  const env = import.meta.env.VITE_API_URL || "";
  const base = env.replace(/\/api\/?$/, "") || "http://localhost:5000";
  return base.startsWith("http") ? base : "http://localhost:5000";
};
const API_BASE = getApiBase();

const formatSkill = (skill) => {
  if (typeof skill === "string") return skill;
  if (skill?.name) return skill.name;
  return String(skill);
};

const RecommendMatches = () => {
  const { user, token: reduxToken } = useSelector((state) => state.auth);
  const token = reduxToken || (user && user.token) || localStorage.getItem("token");
  const [recommendedMatches, setRecommendedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingUserIds, setPendingUserIds] = useState([]);
  const [connectedUserIds, setConnectedUserIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?._id) return;

    const fetchMatches = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/match/${user._id}`);
        const connRes = await axios.get(`${API_BASE}/api/connections/${user._id}`);

        const pending = connRes.data
          .filter((c) => c.status === "pending")
          .map((c) =>
            c.senderId._id === user._id ? c.receiverId._id : c.senderId._id
          );
        const connected = connRes.data
          .filter((c) => c.status === "accepted")
          .map((c) =>
            c.senderId._id === user._id ? c.receiverId._id : c.senderId._id
          );

        setPendingUserIds(pending);
        setConnectedUserIds(connected);
        setRecommendedMatches(res.data);
      } catch (error) {
        console.error("Error fetching matches or connections:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [user?._id]);

  const handleConnect = async (matchUser) => {
    try {
      await axios.post(
        `${API_BASE}/api/connections/send`,
        { receiverId: matchUser._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingUserIds((prev) => [...prev, matchUser._id]);
      toast.success(`Connection request sent to ${matchUser.name}!`);
    } catch (error) {
      const msg = error.response?.data?.message || "Error sending connection";
      if (msg.includes("already") || msg.includes("pending")) {
        setPendingUserIds((prev) => [...prev, matchUser._id]);
      }
      toast.error(msg);
    }
  };

  const filteredMatches = recommendedMatches.filter((u) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(searchLower) ||
      (u.skillsOffered && u.skillsOffered.some((s) => {
        const skillName = typeof s === 'string' ? s : (s.name || '');
        return skillName.toLowerCase().includes(searchLower);
      }));
    const matchesLevel =
      levelFilter === "All" || (u.experienceLevel || "Beginner") === levelFilter;
    return matchesSearch && matchesLevel;
  });

  if (loading)
    return <h3 className="text-center mt-10 text-gray-700">Loading matches...</h3>;

  return (
    <div className="bg-gray-50 min-h-screen bg-gradient-to-br from-orange-100 via-white to-red-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl mt-16">
        <div className="mb-8 border-b-2 border-gray-200 pb-4">
          <h2 className="text-3xl font-bold text-red-500 tracking-wide text-center">
            Recommendations
          </h2>
          {/* bg-red-500 text-white px-6 py-3 rounded-full text-lg hover:bg-red-600 transition */}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="relative w-full md:w-1/2">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search skills or users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <span className="text-gray-600 font-medium whitespace-nowrap">Filter:</span>
            {["All", "Beginner", "Intermediate", "Advanced"].map((level) => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200 ${levelFilter === level
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* User List */}
        {filteredMatches.length === 0 ? (
          <div className="text-gray-600 text-center text-lg mt-12 bg-white p-8 rounded-lg border shadow-sm">
            No matching users found. Try adjusting your search or filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((u) => {
              const isConnected = connectedUserIds.includes(u._id);
              const isPending = pendingUserIds.includes(u._id);
              const canConnect = !isConnected && !isPending;
              const displayImage =
                u.profileImage && u.profileImage.includes("http")
                  ? u.profileImage
                  : null;

              return (
                <div
                  key={u._id}
                  className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex items-start md:items-center gap-5 mb-5 md:mb-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl shrink-0 overflow-hidden border border-gray-200 shadow-sm">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={u.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        "👤"
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {u.name}
                      </h3>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-semibold text-gray-500">Skill:</span>{" "}
                        {u.skillsOffered?.length
                          ? u.skillsOffered.map(formatSkill).join(", ")
                          : "None listed"}
                      </p>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-semibold text-gray-500">Level:</span>{" "}
                        {u.experienceLevel || "Beginner"}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-sm text-yellow-600 font-medium bg-yellow-50 w-fit px-2 py-0.5 rounded">
                        ⭐ {u.rating ? u.rating.toFixed(1) : "0"} Rating
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-start md:justify-end gap-3 md:ml-4 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <button
                      onClick={() => navigate(`/user/${u._id}`)}
                      className="flex-1 md:flex-none px-5 py-2 border-2 border-slate-600 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition-colors duration-200 focus:ring-2 focus:ring-slate-300 outline-none"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleConnect(u)}
                      disabled={!canConnect}
                      className={`flex-[2] md:flex-none px-6 py-3 rounded-full text-lg font-semibold text-white transition-colors duration-200 outline-none ${isConnected
                        ? "bg-red-400 hover:bg-red-600 cursor-default"
                        : isPending
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                      {isConnected ? "Connected" : isPending ? "Pending" : "Connect"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendMatches;

