const mongoose = require("mongoose");

const callHistorySchema = new mongoose.Schema(
  {
    caller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    durationSeconds: { type: Number },
    status: {
      type: String,
      enum: ["calling", "ringing", "connected", "ended", "missed", "rejected"],
      default: "calling",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CallHistory", callHistorySchema);
