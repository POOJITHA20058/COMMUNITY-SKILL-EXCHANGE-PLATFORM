const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  skillsOffered: [{ type: String }],
  skillsWanted: [{ type: String }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  bio: { type: String, maxlength: 500 },
  location: { type: String },

  experienceLevel: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: "Beginner",
  },
  availability: { type: String },

  profileImage: { type: String, default: "https://icon-library.com/images/default-profile-icon/default-profile-icon-6.jpg" },

  socialLinks: {
    linkedin: String,
    github: String,
  },

  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  profileVisits: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
