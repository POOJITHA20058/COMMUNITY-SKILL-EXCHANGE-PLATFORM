const express = require("express");
const router = express.Router();
const {
  createEvent,
  getEvents,
  enrollInEvent,
  updateEvent,
  deleteEvent
} = require("../controllers/eventController");

// Basic auth middleware assumption (based on typical Express setup)
// Adjust the path if your auth middleware is named differently
const { protect } = require("../middleware/authMiddleware");

// Public route -> get all events
router.get("/", getEvents);

// Protected routes -> create event, enroll in event
router.post("/", protect, createEvent);
router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);
router.post("/:id/enroll", protect, enrollInEvent);

module.exports = router;
