const Rating = require("../models/Rating");
const User = require("../models/User");
const Connection = require("../models/Connection");

/**
 * POST /api/ratings - Submit or update rating (only connected users can rate)
 */
exports.submitRating = async (req, res) => {
  try {
    const fromId = req.user._id.toString();
    const { ratedUserId, value, comment } = req.body;

    if (!ratedUserId) {
      return res.status(400).json({ message: "ratedUserId is required" });
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const connection = await Connection.findOne({
      $or: [
        { senderId: fromId, receiverId: ratedUserId, status: "accepted" },
        { senderId: ratedUserId, receiverId: fromId, status: "accepted" },
      ],
    });

    if (!connection) {
      return res.status(403).json({ message: "You can only rate users you are connected with" });
    }

    const existing = await Rating.findOne({ from: fromId, to: ratedUserId });
    const ratingDoc = existing
      ? await Rating.findOneAndUpdate(
          { from: fromId, to: ratedUserId },
          { value: num, comment: comment || "" },
          { new: true }
        )
      : await Rating.create({ from: fromId, to: ratedUserId, value: num, comment: comment || "" });

    const allForUser = await Rating.find({ to: ratedUserId }).select("value").lean();
    const sum = allForUser.reduce((s, r) => s + r.value, 0);
    const count = allForUser.length;
    const average = count ? Math.round((sum / count) * 10) / 10 : 0;

    await User.findByIdAndUpdate(ratedUserId, {
      rating: average,
      ratingCount: count,
    });

    res.json({
      message: existing ? "Rating updated" : "Rating submitted",
      rating: ratingDoc,
      averageRating: average,
      ratingCount: count,
    });
  } catch (err) {
    console.error("Submit rating error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/**
 * GET /api/ratings/user/:userId - List ratings received by a user
 */
exports.getRatingsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const ratings = await Rating.find({ to: userId })
      .populate("from", "name profileImage")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ ratings });
  } catch (err) {
    console.error("Get ratings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/ratings/me/:ratedUserId - Get current user's rating for a user (if any)
 */
exports.getMyRatingForUser = async (req, res) => {
  try {
    const fromId = req.user._id.toString();
    const { ratedUserId } = req.params;
    const rating = await Rating.findOne({ from: fromId, to: ratedUserId }).lean();
    res.json({ rating: rating || null });
  } catch (err) {
    console.error("Get my rating error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
