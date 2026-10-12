const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const normalizeToArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean).map((s) => String(s).trim());
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.filter(Boolean).map((s) => String(s).trim());
  } catch {}
  return String(val)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

router.post("/signup", upload.single("profileImage"), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      skillsOffered,
      skillsWanted,
      bio,
      location,
      experienceLevel,
      availability,
      linkedin,
      github,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists with this email" });

    const userData = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: String(password),
      skillsOffered: normalizeToArray(skillsOffered),
      skillsWanted: normalizeToArray(skillsWanted),
      bio: bio ? String(bio).trim() : undefined,
      location: location ? String(location).trim() : undefined,
      experienceLevel: experienceLevel || "Beginner",
      availability: availability || undefined,
      socialLinks: { linkedin: linkedin || undefined, github: github || undefined },
    };

    if (req.file) {
      userData.profileImage = req.file.filename;
    }

    const user = await User.create(userData);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      skillsOffered: user.skillsOffered,
      skillsWanted: user.skillsWanted,
      profileImage: user.profileImage,
      socialLinks: user.socialLinks,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Signup error:", error);
    if (error.name === "ValidationError") {
      const msg = Object.values(error.errors)[0]?.message || error.message;
      return res.status(400).json({ message: msg });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: "User already exists with this email" });
    }
    res.status(500).json({ message: error.message || "Server error" });
  }
});


router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        skillsOffered: user.skillsOffered,
        skillsWanted: user.skillsWanted,
        bio: user.bio,
        location: user.location,
        experienceLevel: user.experienceLevel,
        availability: user.availability,
        profileImage: user.profileImage,
        socialLinks: user.socialLinks,
        rating: user.rating,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
});

router.get("/profile", protect, async (req, res) => {
  console.log("hitting..")
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    console.log(user);

    res.json(user); 
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});




router.get("/users", async (req, res) => {
  try {
    console.log("Fetching all users...");
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Fetch all users error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
