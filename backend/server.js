const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const Connection = require("./models/Connection");
const Notification = require("./models/Notification");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const matchRoutes = require("./routes/matchRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const messageRoutes = require("./routes/messageRoutes");
const activityRoutes = require("./routes/activityRoutes");
const eventRoutes = require("./routes/eventRoutes");
const callRoutes = require("./routes/callRoutes");
const aiRoutes = require("./routes/aiRoutes");
const blockRoutes = require("./routes/blockRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// Load env variables
dotenv.config();

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Static folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* -------------------- ROUTES -------------------- */
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/chat", messageRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/block", blockRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/notifications", notificationRoutes);

/* -------------------- ERROR HANDLING -------------------- */

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ message: "Internal Server Error" });
});

/* -------------------- SOCKET SETUP -------------------- */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

// Use Map instead of object (better for real-time apps)
const onlineUsers = new Map();
const videoOnlineUsers = new Map();
const socketToUserId = new Map();
app.set("onlineUsers", onlineUsers);
app.set("videoOnlineUsers", videoOnlineUsers);
app.set("socketToUserId", socketToUserId);

io.on("connection", (socket) => {
  console.log("⚡ Socket connected:", socket.id);

  // Add user (for chat, connections)
  socket.on("addUser", (userId) => {
    if (userId) {
      const id = String(userId);
      onlineUsers.set(id, socket.id);
      socketToUserId.set(socket.id, id);
    }
  });

  // Add user for video calls (separate map so incoming-call reaches VideoSocketContext)
  socket.on("addVideoUser", (userId) => {
    if (userId) {
      const id = String(userId);
      videoOnlineUsers.set(id, socket.id);
      socketToUserId.set(socket.id, id);
      console.log("📹 Video user registered:", id, "| Total:", videoOnlineUsers.size);
    }
  });

  // Send message (block check done at API layer; socket just relays after message is created)
  socket.on("sendMessage", (payload) => {
    const receiverSocketId = onlineUsers.get(payload.receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("getMessage", payload);
    }
  });

  // ---------- Video call signaling (only between connected users) ----------
  socket.on("call-user", async (payload) => {
    const callerId = socketToUserId.get(socket.id) || payload.from;
    const receiverId = payload.to;
    if (!callerId || !receiverId) return;
    try {
      const connection = await Connection.findOne({
        $or: [
          { senderId: callerId, receiverId: receiverId, status: "accepted" },
          { senderId: receiverId, receiverId: callerId, status: "accepted" },
        ],
      });
      if (!connection) {
        socket.emit("call-rejected", { message: "Not connected with this user" });
        return;
      }
      const receiverIdStr = String(receiverId);
      const receiverSocketId = videoOnlineUsers.get(receiverIdStr);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("incoming-call", {
          from: callerId,
          fromName: payload.fromName,
          fromProfileImage: payload.fromProfileImage,
        });
        socket.emit("call-status", { status: "calling" });
        console.log("📹 Call sent from", callerId, "to", receiverIdStr);

        try {
          const notif = await Notification.create({
            recipient: receiverId,
            sender: callerId,
            type: "video_call",
            message: "is calling you for a video chat"
          });
          const populatedNotif = await notif.populate("sender", "name profileImage");
          const recSocket = onlineUsers.get(receiverIdStr);
          if (recSocket) {
            io.to(recSocket).emit("newNotification", populatedNotif);
          }
        } catch (notifErr) {
          console.error("Error creating video call notification:", notifErr);
        }
      } else {
        const videoUserIds = [...videoOnlineUsers.keys()];
        console.log("📹 Receiver", receiverIdStr, "NOT in video users. Registered:", videoUserIds.join(", ") || "none");
        socket.emit("call-rejected", {
          message: "User is offline. Ask them to open the app and stay on a page (e.g. Dashboard or Connections).",
        });
      }
    } catch (err) {
      socket.emit("call-rejected", { message: "Server error" });
    }
  });

  socket.on("accept-call", (payload) => {
    const callerSocketId = videoOnlineUsers.get(String(payload.from)) || onlineUsers.get(String(payload.from));
    if (callerSocketId) io.to(callerSocketId).emit("call-accepted", { to: payload.to });
  });

  socket.on("reject-call", (payload) => {
    const callerSocketId = videoOnlineUsers.get(String(payload.from)) || onlineUsers.get(String(payload.from));
    if (callerSocketId) io.to(callerSocketId).emit("call-rejected", { message: "Call declined" });
  });

  socket.on("offer", (payload) => {
    const toSocketId = videoOnlineUsers.get(String(payload.to)) || onlineUsers.get(String(payload.to));
    if (toSocketId) io.to(toSocketId).emit("offer", payload);
  });

  socket.on("answer", (payload) => {
    const toSocketId = videoOnlineUsers.get(String(payload.to)) || onlineUsers.get(String(payload.to));
    if (toSocketId) io.to(toSocketId).emit("answer", payload);
  });

  socket.on("ice-candidate", (payload) => {
    const toSocketId = videoOnlineUsers.get(String(payload.to)) || onlineUsers.get(String(payload.to));
    if (toSocketId) io.to(toSocketId).emit("ice-candidate", payload);
  });

  socket.on("end-call", (payload) => {
    const otherSocketId = videoOnlineUsers.get(String(payload.to)) || onlineUsers.get(String(payload.to));
    if (otherSocketId) io.to(otherSocketId).emit("call-ended", {});
  });

  socket.on("disconnect", () => {
    socketToUserId.delete(socket.id);
    for (const [userId, sId] of videoOnlineUsers.entries()) {
      if (sId === socket.id) {
        videoOnlineUsers.delete(userId);
        break;
      }
    }
    for (let [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log("Socket disconnected:", socket.id);
  });
});

// Make io available in routes
app.set("io", io);

/* -------------------- START SERVER -------------------- */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();