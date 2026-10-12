const express = require("express");
const fs = require("fs");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { uploadMedia, deleteMediaFromClodinary } = require("../cloudinary");
const userController = require("../controllers/userController");
const { getBlockedExcludeIds } = require("../middleware/blockUserMiddleware");

const router = express.Router();

// In-memory cache to avoid double-counting very fast repeat profile views
// Key: `${viewerId}:${targetId}`, Value: timestamp (ms)
const recentProfileViews = new Map();

router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});


router.put("/update-profile", protect, upload.single("profileImage"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    
    let imageUrl = user.profileImage;
    if (req.file) {
     
      if (user.profileImagePublicId) {
        await deleteMediaFromClodinary(user.profileImagePublicId);
      }

      const uploadResponse = await uploadMedia(req.file.path);
      imageUrl = uploadResponse.secure_url;
      user.profileImagePublicId = uploadResponse.public_id;

      
      fs.unlinkSync(req.file.path);
    }

   
    let skillsOffered = user.skillsOffered;
    if (req.body.skillsOffered) {
      skillsOffered = userController.normalizeSkillsOffered(req.body.skillsOffered);
    }

    let skillsWanted = user.skillsWanted;
    if (req.body.skillsWanted) {
      try {
        skillsWanted = JSON.parse(req.body.skillsWanted);
      } catch {
        skillsWanted = req.body.skillsWanted.split(",").map((s) => s.trim());
      }
    }

    
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.bio = req.body.bio || user.bio;
    user.location = req.body.location || user.location;
    user.experienceLevel = req.body.experienceLevel || user.experienceLevel;
    user.availability = req.body.availability || user.availability;
    user.linkedin = req.body.linkedin || user.linkedin;
    user.github = req.body.github || user.github;
    user.skillsOffered = skillsOffered;
    user.skillsWanted = skillsWanted;
    user.profileImage = imageUrl;

    await user.save();

    const safeUser = await User.findById(user._id).select("-password").lean();
    res.json({
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});


router.delete("/delete", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    
    if (user && user.profileImagePublicId) {
      await deleteMediaFromClodinary(user.profileImagePublicId);
    }

    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Account Delete Error:", error);
    res.status(500).json({ message: "Error deleting account" });
  }
});

router.get("/", protect, userController.listUsers);

router.get("/:id", protect, async (req, res) => {
  try {
    const targetId = req.params.id?.trim();
    const currentUserId = req.user?._id?.toString?.();
    const user = await User.findById(targetId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (currentUserId && currentUserId !== targetId) {
      const excludeIds = await getBlockedExcludeIds(currentUserId);
      if (excludeIds.includes(targetId)) {
        return res.status(404).json({ message: "User not found" });
      }

      // Avoid counting the same viewer->profile more than once within a short window
      const key = `${currentUserId}:${targetId}`;
      const now = Date.now();
      const last = recentProfileViews.get(key) || 0;
      const WINDOW_MS = 5000;
      if (now - last > WINDOW_MS) {
        await User.findByIdAndUpdate(targetId, { $inc: { profileVisits: 1 } });
        recentProfileViews.set(key, now);
      }
    }
    const updated = await User.findById(targetId).select("-password").lean();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;
