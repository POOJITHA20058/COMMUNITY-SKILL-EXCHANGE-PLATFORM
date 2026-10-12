const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");


router.post("/add", async (req, res) => {
  try {
    const { userId, type, content } = req.body;

    if (!userId || !content)
      return res.status(400).json({ message: "userId and content required" });

    const activity = await Activity.create({ user: userId, type, content });
    const populated = await activity.populate([
      { path: "user", select: "name profileImage" },
      { path: "comments.user", select: "name profileImage" }
    ]);

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error adding activity:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/", async (req, res) => {
  try {
    const { sortBy } = req.query;
    let sortOption = { createdAt: -1 };

    if (sortBy === "popular") sortOption = { likes: -1 };

    const activities = await Activity.find()
      .populate("user", "name profileImage")
      .populate("comments.user", "name profileImage")
      .sort(sortOption);

    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/like/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;

    const activity = await Activity.findById(id);
    if (!activity) return res.status(404).json({ message: "Not found" });

    const alreadyLiked = activity.likes.includes(userId);
    if (alreadyLiked) {
      activity.likes.pull(userId);
    } else {
      activity.likes.push(userId);
    }

    await activity.save();
    const updated = await activity.populate([
      { path: "user", select: "name profileImage" },
      { path: "comments.user", select: "name profileImage" }
    ]);

    if (!alreadyLiked && updated.user._id.toString() !== userId) {
      const notif = await Notification.create({
        recipient: updated.user._id,
        sender: userId,
        type: "like",
        message: "liked your post",
        referenceId: activity._id
      });
      const populatedNotif = await notif.populate("sender", "name profileImage");
      const io = req.app.get("io");
      const onlineUsers = req.app.get("onlineUsers");
      if (io && onlineUsers) {
        const receiverSocket = onlineUsers.get(updated.user._id.toString());
        if (receiverSocket) {
          io.to(receiverSocket).emit("newNotification", populatedNotif);
        }
      }
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error liking activity:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add comment
router.post("/comment/:id", async (req, res) => {
  try {
    const { userId, text } = req.body;
    const { id } = req.params;

    if (!userId || !text)
      return res.status(400).json({ message: "userId and text required" });

    const activity = await Activity.findById(id);
    if (!activity) return res.status(404).json({ message: "Not found" });

    activity.comments.push({ user: userId, text });
    await activity.save();

    const updated = await activity.populate([
      { path: "user", select: "name profileImage" },
      { path: "comments.user", select: "name profileImage" }
    ]);

    if (updated.user._id.toString() !== userId) {
      const notif = await Notification.create({
        recipient: updated.user._id,
        sender: userId,
        type: "comment",
        message: "commented on your post",
        referenceId: activity._id
      });
      const populatedNotif = await notif.populate("sender", "name profileImage");
      const io = req.app.get("io");
      const onlineUsers = req.app.get("onlineUsers");
      if (io && onlineUsers) {
        const receiverSocket = onlineUsers.get(updated.user._id.toString());
        if (receiverSocket) {
          io.to(receiverSocket).emit("newNotification", populatedNotif);
        }
      }
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete activity
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findByIdAndDelete(id);
    if (!activity) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
