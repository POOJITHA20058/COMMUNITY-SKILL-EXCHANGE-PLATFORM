const Event = require("../models/Event");

// @desc    Create a new event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
  try {
    const { title, description, date, category, image } = req.body;

    if (!title || !description || !date) {
      return res.status(400).json({ message: "Please provide all required fields (title, description, date)" });
    }

    const event = new Event({
      title,
      description,
      date,
      category: category || "Other",
      image: image || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
      creator: req.user._id, // Assumes standard auth middleware adding `req.user`
    });

    const createdEvent = await event.save();
    return res.status(201).json(createdEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    // Sort by date ascending (upcoming events first)
    const events = await Event.find().populate("creator", "name profileImage").sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Enroll in an event
// @route   POST /api/events/:id/enroll
// @access  Private
const enrollInEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is already enrolled
    const alreadyEnrolled = event.enrolledUsers.includes(req.user._id);

    if (alreadyEnrolled) {
      return res.status(400).json({ message: "You are already enrolled in this event" });
    }

    event.enrolledUsers.push(req.user._id);
    await event.save();

    res.status(200).json({ message: "Successfully enrolled in event" });
  } catch (error) {
    console.error("Error enrolling in event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private
const updateEvent = async (req, res) => {
  try {
    const { title, description, date, category, image } = req.body;
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this event" });
    }

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.category = category || event.category;
    event.image = image || event.image;

    const updatedEvent = await event.save();
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this event" });
    }

    await Event.deleteOne({ _id: event._id });
    res.status(200).json({ message: "Event removed" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createEvent,
  getEvents,
  enrollInEvent,
  updateEvent,
  deleteEvent,
};
