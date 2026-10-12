const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("./models/User");
const Event = require("./models/Event");
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

  // Generate Token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

  // Create an event directly in db
  const newEvent = await Event.create({
    title: "Test API Delete",
    description: "test",
    date: new Date(),
    creator: user._id
  });
  console.log("Created test event:", newEvent._id.toString());

  // Delete event through the API
  try {
    const res = await fetch(`http://localhost:5000/api/events/${newEvent._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const status = res.status;
    const data = await res.json();
    console.log("Response Status:", status);
    console.log("Response Data:", data);
  } catch (error) {
    console.error("Fetch Error:", error);
  }
  
  process.exit();
};

test();
