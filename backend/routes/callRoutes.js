const express = require("express");
const router = express.Router();
const CallHistory = require("../models/CallHistory");
const Connection = require("../models/Connection");
const { protect } = require("../middleware/authMiddleware");

// Get call history for the current user (as caller or receiver)
router.get("/history", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await CallHistory.find({
      $or: [{ caller: userId }, { receiver: userId }],
    })
      .populate("caller", "name profileImage")
      .populate("receiver", "name profileImage")
      .sort({ startTime: -1 })
      .limit(50)
      .lean();

    res.json(history);
  } catch (error) {
    console.error("Call history error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Log a call when it ends (called by frontend after end-call)
router.post("/log", protect, async (req, res) => {
  try {
    const { receiverId, startTime, endTime, status } = req.body;
    const callerId = req.user._id;

    if (!receiverId || !startTime) {
      return res.status(400).json({ message: "receiverId and startTime required" });
    }

    const connection = await Connection.findOne({
      $or: [
        { senderId: callerId, receiverId: receiverId, status: "accepted" },
        { senderId: receiverId, receiverId: callerId, status: "accepted" },
      ],
    });
    if (!connection) {
      return res.status(403).json({ message: "Only connected users can log calls" });
    }

    const end = endTime ? new Date(endTime) : new Date();
    const start = new Date(startTime);
    const durationSeconds = Math.round((end - start) / 1000);

    const record = await CallHistory.create({
      caller: callerId,
      receiver: receiverId,
      startTime: start,
      endTime: end,
      durationSeconds,
      status: status || "ended",
    });

    res.status(201).json(record);
  } catch (error) {
    console.error("Call log error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
