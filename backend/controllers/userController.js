const User = require("../models/User");
const { getBlockedExcludeIds } = require("../middleware/blockUserMiddleware");

/**
 * Normalize skillsOffered from client (supports both formats):
 * - [{ name: "React", level: "Intermediate" }]
 * - ["React", "Node"] -> [{ name: "React", level: "Beginner" }, ...]
 */
const normalizeSkillsOffered = (val) => {
  if (!val) return [];
  let arr = val;
  if (typeof val === "string") {
    try {
      arr = JSON.parse(val);
    } catch {
      arr = val.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    if (typeof item === "string") return item.trim();
    return String(item?.name || item?.skill || "").trim();
  }).filter(Boolean);
};

/**
 * GET /api/users - list all users (excluding current user and blocked), no skill/level filter
 */
exports.listUsers = async (req, res) => {
  try {
    const currentUserId = req.user?._id?.toString?.();

    const filter = {};
    if (currentUserId) {
      const excludeIds = await getBlockedExcludeIds(currentUserId);
      filter._id = { $nin: [currentUserId, ...excludeIds] };
    }

    const users = await User.find(filter).select("-password").lean();
    res.json(users);
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.normalizeSkillsOffered = normalizeSkillsOffered;
