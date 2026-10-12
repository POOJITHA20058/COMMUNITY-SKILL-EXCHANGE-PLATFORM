const mongoose = require("mongoose");
const Event = require("./models/Event");
const User = require("./models/User");
const connectDB = require("./config/db");
const dotenv = require("dotenv");

dotenv.config();

const test = async () => {
  await connectDB();
  const user = await User.findOne();
  if (!user) {
    console.log("No user found");
    process.exit();
  }
  
  // Create mock event
  const newEvent = await Event.create({
    title: "Test Delete",
    description: "test",
    date: new Date(),
    creator: user._id
  });

  console.log("Created event:", newEvent._id);

  // Mock req and res
  const req = {
    params: { id: newEvent._id.toString() },
    user: user
  };

  const res = {
    status: (code) => ({
      json: (data) => {
        console.log("Result Status:", code);
        console.log("Result Data:", data);
        process.exit();
      }
    })
  };

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

test();
