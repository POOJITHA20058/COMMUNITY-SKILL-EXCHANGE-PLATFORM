const express = require("express");
const mongoose = require("mongoose");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

function isValidObjectId(id) {
  if (!id || typeof id !== "string") return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

/**
 * POST /api/block/:userId
 * Block a user
 */
router.post("/:userId", protect, async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const targetUserId = (req.params.userId || "").trim();

    if (!targetUserId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetObjectId = new mongoose.Types.ObjectId(targetUserId);

    const existing = await User.findOne({
      _id: currentUserId,
      blockedUsers: targetObjectId,
    }).select("_id").lean();

    if (existing) {
      return res.status(400).json({ message: "User is already blocked" });
    }

    const updated = await User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { blockedUsers: targetObjectId } },
      { new: true, runValidators: false }
    ).select("blockedUsers").lean();

    if (!updated) {
      return res.status(404).json({ message: "Current user not found" });
    }

    const blockedIds = (updated.blockedUsers || []).map((id) => id.toString());

    res.json({
      message: "User blocked successfully",
      blockedUsers: blockedIds,
    });
  } catch (err) {
    console.error("Block user error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/**
 * DELETE /api/block/:userId
 * Unblock a user
 */
router.delete("/:userId", protect, async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const targetUserId = (req.params.userId || "").trim();

    if (!targetUserId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const updated = await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { blockedUsers: new mongoose.Types.ObjectId(targetUserId) } },
      { new: true, runValidators: false }
    ).select("blockedUsers").lean();

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    const blockedIds = (updated.blockedUsers || []).map((id) => id.toString());

    res.json({
      message: "User unblocked successfully",
      blockedUsers: blockedIds,
    });
  } catch (err) {
    console.error("Unblock user error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/**
 * GET /api/block
 * List blocked users
 */
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("blockedUsers", "name email profileImage")
      .select("blockedUsers")
      .lean();

    const blockedList = (user?.blockedUsers || [])
      .filter((u) => u && u._id)
      .map((u) => ({
        _id: u._id,
        name: u.name || "Unknown",
        email: u.email || "",
        profileImage: u.profileImage,
      }));

    res.json({ blockedUsers: blockedList });
  } catch (err) {
    console.error("List blocked error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
