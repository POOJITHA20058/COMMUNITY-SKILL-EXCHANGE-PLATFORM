const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const { preventIfBlocked } = require("../middleware/blockUserMiddleware");
const path = require("path");
const fs = require("fs");
const Message = require("../models/Message");

// Ensure uploads/chat_files directory exists
const uploadDir = path.join(__dirname, "../uploads/chat_files");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created uploads/chat_files directory");
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only images and PDFs allowed"));
  },
});

// Get all messages between two users
router.get("/:from/:to", async (req, res) => {
  try {
    const { from, to } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: from, receiver: to },
        { sender: to, receiver: from },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Fetch Messages Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Send text or link message
router.post("/add", protect, preventIfBlocked({ targetBody: "receiver" }), async (req, res) => {
  try {
    const sender = req.user._id.toString();
    const { receiver, content } = req.body;

    if (!receiver) {
      return res.status(400).json({ message: "receiver is required" });
    }

    const newMessage = await Message.create({
      sender,
      receiver,
      content: content || "", // allows links or empty text
    });

    res.json(newMessage);
  } catch (err) {
    console.error("Add Message Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Send file message
router.post("/add/file", protect, preventIfBlocked({ targetBody: "receiver" }), upload.single("file"), async (req, res) => {
  try {
    const sender = req.user._id.toString();
    const { receiver } = req.body;
    const fileUrl = req.file ? `chat_files/${req.file.filename}` : null;

    if (!fileUrl) {
      return res.status(400).json({ message: "File upload failed" });
    }

    const newMessage = await Message.create({
      sender,
      receiver,
      content: "",
      fileUrl,
    });

    res.json(newMessage);
  } catch (error) {
    console.error("File Message Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
