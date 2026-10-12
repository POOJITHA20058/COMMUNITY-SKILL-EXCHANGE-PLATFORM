const express = require("express");
const router = express.Router();
const Connection = require("../models/Connection");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/authMiddleware");
const { preventIfBlocked } = require("../middleware/blockUserMiddleware");

router.post("/send", protect, preventIfBlocked({ targetBody: "receiverId" }), async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const senderId = currentUserId;
    const receiverId = req.body.receiverId;

    if (!receiverId) {
      return res
        .status(400)
        .json({ message: "receiverId is required" });
    }

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: "You cannot connect with yourself" });
    }

    
    let existing = await Connection.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    if (existing) {
   
      if (existing.status === "declined") {
        existing.status = "pending";
        existing.senderId = senderId; 
        await existing.save();

        return res.status(200).json({
          message: "Connection request re-sent successfully",
          connection: existing,
        });
      }

     
      if (existing.status === "pending") {
        return res.status(400).json({
          message: "Connection request already pending",
        });
      }

      if (existing.status === "accepted") {
        return res.status(400).json({
          message: "You are already connected",
        });
      }
    }

  
    const connection = await Connection.create({
      senderId,
      receiverId,
      status: "pending",
    });

    const notif = await Notification.create({
      recipient: receiverId,
      sender: senderId,
      type: "connection",
      message: "sent you a connection request",
      referenceId: connection._id
    });
    const populatedNotif = await notif.populate("sender", "name profileImage");
    
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers) {
        const receiverSocket = onlineUsers.get(receiverId.toString());
        if (receiverSocket) {
            io.to(receiverSocket).emit("newNotification", populatedNotif);
        }
    }

    res.status(201).json({
      message: "Connection request sent successfully",
      connection,
    });
  } catch (error) {
    console.error("Error sending connection request:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const connections = await Connection.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .populate("senderId", "name email profileImage rating ratingCount profileVisits")
      .populate("receiverId", "name email profileImage rating ratingCount profileVisits");

    res.status(200).json(connections);
  } catch (error) {
    console.error("Error fetching connections:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Connection.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Connection not found" });
    }

    // Notify the sender (who sent the request) so their connections page updates without refresh
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers) {
      const senderId = updated.senderId?.toString?.() || updated.senderId;
      const socketId = onlineUsers.get(senderId);
      if (socketId) {
        io.to(socketId).emit("connectionStatusUpdated", { connectionId: id, status });
      }
    }

    res.status(200).json({ message: `Request ${status}`, updated });
  } catch (error) {
    console.error("Error updating connection:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
