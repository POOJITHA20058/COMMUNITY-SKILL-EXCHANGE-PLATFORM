const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const ratingController = require("../controllers/ratingController");

const router = express.Router();

router.post("/", protect, ratingController.submitRating);
router.get("/user/:userId", ratingController.getRatingsForUser);
router.get("/me/:ratedUserId", protect, ratingController.getMyRatingForUser);

module.exports = router;
