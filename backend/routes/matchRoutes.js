const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { getBlockedExcludeIds } = require("../middleware/blockUserMiddleware");

router.get("/:userId", async (req, res) => {
  try {
    const cleanId = req.params.userId.trim();
    const user = await User.findById(cleanId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const excludeIds = await getBlockedExcludeIds(cleanId);
    const userFilter = { _id: { $nin: [user._id, ...excludeIds] } };
    const allUsers = await User.find(userFilter).lean();

    const normalizeSkills = (arr) =>
      (arr || []).map((s) => (typeof s === "string" ? s : s?.name || s)?.toLowerCase?.()?.trim?.()).filter(Boolean);

    const userWanted = normalizeSkills(user.skillsWanted);

    const matches = allUsers.filter((other) => {
      const otherOffered = normalizeSkills(other.skillsOffered);
      const teachesYouWant = userWanted.some((skill) => otherOffered.includes(skill));
      return teachesYouWant;
    });

    res.json(matches);
  } catch (error) {
    console.error("Skill Match Error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});


module.exports = router;
