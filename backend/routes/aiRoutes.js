const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const aiController = require("../controllers/aiController");

const router = express.Router();

router.get("/skills", protect, aiController.getSkills);
router.post("/chat", protect, aiController.chat);
router.get("/history", protect, aiController.getHistory);
router.post("/clear-history", protect, aiController.clearHistory);
router.get("/roadmap", protect, aiController.getRoadmap);
router.get("/exercises", protect, aiController.getExercises);
router.post("/clarify", protect, aiController.clarifyDoubt);
router.get("/recommend-tutorials", protect, aiController.recommendTutorials);

module.exports = router;
