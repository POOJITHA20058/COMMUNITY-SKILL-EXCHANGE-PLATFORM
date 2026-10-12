const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    value: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

ratingSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
