import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { StarRatingDisplay } from "../components/StarRating";
import { ProfileVisitBadge } from "../components/ProfileVisitBadge";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { FaBriefcase, FaEnvelope, FaPhoneAlt } from "react-icons/fa";

const getApiBase = () => {
  const env = import.meta.env.VITE_API_URL || "";
  const base = env.replace(/\/api\/?$/, "") || "http://localhost:5000";
  return base.startsWith("http") ? base : "http://localhost:5000";
};
const API_BASE = getApiBase();

const ViewConnections = () => {
  const { user, token: reduxToken } = useSelector((state) => state.auth);
  const token = reduxToken || (user && user.token) || localStorage.getItem("token");
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchConnections = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await axios.get(
        `${API_BASE}/api/connections/${user._id}`
      );
      setConnections(res.data);
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    fetchConnections();
  }, [user?._id, fetchConnections]);

  // When receiver accepts, sender gets this and refetches so "Your connections" updates without refresh
  useEffect(() => {
    if (!user?._id) return;
    const socket = io(API_BASE);
    socket.on("connect", () => socket.emit("addUser", user._id));
    socket.on("connectionStatusUpdated", () => fetchConnections());
    return () => {
      socket.off("connectionStatusUpdated");
      socket.disconnect();
    };
  }, [user?._id, fetchConnections]);

  // Accepted: people you're connected with. Pending (incoming): requests sent TO you (you are receiver).
  const acceptedConnections = connections.filter((c) => c.status === "accepted");
  const incomingRequests = connections.filter(
    (c) => c.status === "pending" && c.receiverId._id === user?._id
  );
  // Sent requests (pending where you are sender) are not shown in "Your Connections"


  const handleStatusUpdate = async (connectionId, status) => {
    try {
      const res = await axios.put(
        `${API_BASE}/api/connections/${connectionId}`,
        { status }
      );
      toast.success(`Connection ${status} successfully!`);


      setConnections((prev) =>
        prev.map((conn) =>
          conn._id === connectionId
            ? { ...conn, status: res.data.updated.status }
            : conn
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update connection status");
    }
  };


  const handleBlock = async (friendId, friendName) => {
    try {
      await axios.post(
        `${API_BASE}/api/block/${friendId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConnections((prev) =>
        prev.filter((c) => {
          const other = c.senderId._id === user._id ? c.receiverId : c.senderId;
          return other._id !== friendId;
        })
      );
      toast.success(`${friendName} has been blocked`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to block user");
    }
  };

  const handleStartExchanging = (friendId) => {
    navigate(`/chat/${friendId}`);
  };

  if (loading)
    return (
      <p className="text-center text-gray-600 mt-20 text-lg">
        Loading connections...
      </p>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-red-100">
      <Navbar />
      <div className="container mx-auto px-6 py-10 mt-10">
        <h2 className="text-3xl font-bold text-center text-rose-500 mb-8">
          Your Connections
        </h2>

        {acceptedConnections.length === 0 && incomingRequests.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">
            No connections or pending requests.
          </p>
        ) : (
          <>
            {/* Incoming requests: only for the receiver — show Accept/Reject */}
            {incomingRequests.length > 0 && (
              <div className="mb-10">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  Requests sent to you
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {incomingRequests.map((c) => {
                    const sender = c.senderId;
                    return (
                      <div
                        key={c._id}
                        className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 p-5 flex flex-col items-center text-center"
                      >
                        <div className="w-24 h-24 mb-4 rounded-full overflow-hidden border-4 border-rose-300">
                          <img
                            src={
                              sender?.profileImage?.startsWith("http")
                                ? sender.profileImage
                                : `http://localhost:5000/uploads/${sender.profileImage}`
                            }
                            alt={sender.name}
                            className="w-24 h-24 rounded-full object-cover border-4 border-red-400 shadow-lg"
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {sender.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">wants to connect</p>
                        <div className="flex gap-3 mt-2">
                          <button
                            onClick={() => handleStatusUpdate(c._id, "accepted")}
                            className="px-3 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white font-medium shadow-md"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(c._id, "declined")}
                            className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium shadow-md"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Accepted connections: people you're connected with */}
            {acceptedConnections.length > 0 && (
              <div>
                {/* <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  Your connections
                </h3> */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {acceptedConnections.map((c) => {
                    const friend =
                      c.senderId._id === user._id ? c.receiverId : c.senderId;
                    return (
                      <div
                        key={c._id}
                        className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-xl transition transform hover:-translate-y-1 p-6 flex flex-col text-center"
                      >
                        {/* Top: Profile Info Row */}
                        <div className="flex flex-row items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                          {/* Left: Profile Image */}
                          <div className="flex-shrink-0">
                            <img
                              src={
                                friend?.profileImage?.startsWith("http")
                                  ? friend.profileImage
                                  : `http://localhost:5000/uploads/${friend.profileImage}`
                              }
                              alt={friend.name}
                              className="w-20 h-20 rounded-full object-cover shadow-sm bg-gray-50 border border-gray-100 p-0.5"
                            />
                          </div>

                          {/* Right: Personal Info */}
                          <div className="flex flex-col text-left overflow-hidden">
                            <h3 className="text-xl font-extrabold text-[#002f4a] tracking-tight truncate">
                              {friend.name}
                            </h3>
                            <p className="text-sm font-semibold text-[#306c88] italic mb-1.5 truncate">
                              {friend.experienceLevel || "Member"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                              <FaEnvelope className="flex-shrink-0" />
                              <span className="truncate break-all" title={friend.email}>{friend.email}</span>
                            </div>
                            <p className="text-[11px] font-medium text-gray-400">
                              Joined {new Date(friend.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>

                        {/* Message / Chat Button */}
                        <div className="flex justify-center mt-2 mb-2">
                          <button
                            onClick={() => handleStartExchanging(friend._id)}
                            className="w-full bg-[#119182] hover:bg-[#0c7064] text-white font-bold py-2.5 px-8 rounded-full shadow-md transition-all duration-200 transform hover:scale-[1.02]"
                          >
                            Message
                          </button>
                        </div>

                        {/* Extra Actions Menu */}
                        <div className="flex justify-center gap-5 pt-3 mt-1 border-t border-gray-100">
                          <button
                            onClick={() => navigate(`/user/${friend._id}`)}
                            className="text-sm font-semibold text-[#306c88] hover:text-[#002f4a]"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => navigate(`/video-call/${friend._id}`, { state: { friendName: friend.name } })}
                            className="text-sm font-semibold text-[#306c88] hover:text-[#002f4a]"
                          >
                            Video
                          </button>
                          <button
                            onClick={() => handleBlock(friend._id, friend.name)}
                            className="text-sm font-semibold text-rose-500 hover:text-rose-700"
                          >
                            Block
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ViewConnections;
