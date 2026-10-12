import React, { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

const VideoSocketContext = createContext(null);

const getSocketBase = () => {
  const env = import.meta.env.VITE_API_URL || "";
  const base = env.replace(/\/api\/?$/, "") || "http://localhost:5000";
  return base.startsWith("http") ? base : "http://localhost:5000";
};
const SOCKET_URL = getSocketBase();

export function VideoSocketProvider({ children }) {
  const user = useSelector((state) => state.auth.user);
  const [socket, setSocket] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIncomingCall(null);
      return;
    }
    
    axios.get(`http://localhost:5000/api/notifications/${user._id}`)
      .then(res => setNotifications(res.data))
      .catch(err => console.error("Failed to fetch notifications:", err));

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    const registerVideoUser = () => {
      if (user?._id) {
          newSocket.emit("addVideoUser", user._id);
          newSocket.emit("addUser", user._id);
      }
    };
    newSocket.on("connect", registerVideoUser);
    newSocket.on("reconnect", registerVideoUser);
    newSocket.on("incoming-call", (payload) => {
      setIncomingCall({ from: payload.from, fromName: payload.fromName, fromProfileImage: payload.fromProfileImage });
    });
    newSocket.on("newNotification", (notif) => {
      setNotifications(prev => [notif, ...prev]);
    });
    setSocket(newSocket);
    return () => {
      newSocket.off("incoming-call");
      newSocket.off("newNotification");
      newSocket.off("connect", registerVideoUser);
      newSocket.off("reconnect", registerVideoUser);
      newSocket.disconnect();
      setSocket(null);
      setIncomingCall(null);
    };
  }, [user?._id]);

  const acceptCall = () => {
    if (!incomingCall || !socket) return;
    navigate(`/video-call/${incomingCall.from}`, { state: { isReceiver: true, fromName: incomingCall.fromName } });
    // Emit accept-call happens in VideoCallPage after it mounts to prevent offer race condition
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (!incomingCall || !socket) return;
    socket.emit("reject-call", { from: incomingCall.from, to: user._id });
    setIncomingCall(null);
  };

  return (
    <VideoSocketContext.Provider value={{ socket, incomingCall, acceptCall, rejectCall, setIncomingCall, notifications, setNotifications }}>
      {children}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
            <p className="text-gray-600 mb-2">Incoming video call from</p>
            <p className="text-xl font-semibold text-gray-900 mb-4">{incomingCall.fromName || "Someone"}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={rejectCall}
                className="px-5 py-2 rounded-full bg-red-500 text-white font-medium"
              >
                Reject
              </button>
              <button
                onClick={acceptCall}
                className="px-5 py-2 rounded-full bg-green-500 text-white font-medium"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </VideoSocketContext.Provider>
  );
}

export function useVideoSocket() {
  const ctx = useContext(VideoSocketContext);
  if (!ctx) throw new Error("useVideoSocket must be used within VideoSocketProvider");
  return ctx;
}
