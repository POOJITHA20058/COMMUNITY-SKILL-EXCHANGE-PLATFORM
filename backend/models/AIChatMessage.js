const mongoose = require("mongoose");

const aiChatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    skill: { type: String },
    sessionId: { type: String },
  },
  { timestamps: true }
);

aiChatMessageSchema.index({ user: 1, skill: 1, createdAt: -1 });

module.exports = mongoose.model("AIChatMessage", aiChatMessageSchema);
