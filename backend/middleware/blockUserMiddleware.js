const mongoose = require("mongoose");
const User = require("../models/User");

const isValidObjectId = (id) => {
  if (!id || typeof id !== "string") return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
};

/**
 * Middleware: Prevents action if current user and target user have blocked each other.
 * Use for: connection send, message send, etc.
 * Expects: req.user (from protect), and either req.params.userId or req.body.receiverId/senderId
 */
const preventIfBlocked = (opts = {}) => {
  const targetParam = opts.targetParam || "userId";
  const targetBody = opts.targetBody; // e.g. "receiverId" or "receiver"
  return async (req, res, next) => {
    try {
      const currentUserId = req.user?._id?.toString?.() || req.user?.id;
      if (!currentUserId) return next();

      let targetUserId = req.params?.[targetParam] || (targetBody && req.body?.[targetBody]);
      if (!targetUserId) return next();
      targetUserId = String(targetUserId);

      const currentUser = await User.findById(currentUserId).select("blockedUsers").lean();
      if (!currentUser) return next();

      const blocked = currentUser.blockedUsers || [];
      const blockedIds = blocked.map((id) => id?.toString?.()).filter(Boolean);
      if (blockedIds.includes(targetUserId)) {
        return res.status(403).json({ message: "You cannot perform this action with this user" });
      }

      const targetUser = await User.findById(targetUserId).select("blockedUsers").lean();
      if (targetUser?.blockedUsers?.some((id) => id?.toString?.() === currentUserId)) {
        return res.status(403).json({ message: "This user has blocked you" });
      }

      next();
    } catch (err) {
      console.error("Block check error:", err);
      next();
    }
  };
};

/**
 * Returns array of user IDs to exclude from search (blocked by me OR blocked me).
 * Use in User.find({ _id: { $nin: await getBlockedExcludeIds(currentUserId) } })
 */
const getBlockedExcludeIds = async (currentUserId) => {
  if (!currentUserId) return [];
  const user = await User.findById(currentUserId).select("blockedUsers").lean();
  if (!user) return [];

  const blockedByMe = (user.blockedUsers || [])
    .map((id) => id?.toString?.())
    .filter(Boolean)
    .filter(isValidObjectId);

  const blockedMe = await User.find(
    { blockedUsers: currentUserId },
    { _id: 1 }
  )
    .lean()
    .then((users) => users.map((u) => u._id.toString()).filter(isValidObjectId));

  const combined = [...new Set([...blockedByMe, ...blockedMe])].filter(isValidObjectId);
  return combined;
};

module.exports = { preventIfBlocked, getBlockedExcludeIds };
