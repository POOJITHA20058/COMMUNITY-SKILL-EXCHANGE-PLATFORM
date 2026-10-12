/**
 * Migration script: Convert skillsOffered from array of strings to array of { name, level }.
 * Run: node scripts/migrate-skills-offered.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const migrate = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({}).lean();
  let updated = 0;

  for (const u of users) {
    const skills = u.skillsOffered || [];
    if (skills.length === 0) continue;

    const first = skills[0];
    const needsMigration = typeof first === "string" || (first && !first.name);

    if (!needsMigration) continue;

    const newSkills = skills.map((s) =>
      typeof s === "string"
        ? { name: s.trim(), level: "Beginner" }
        : { name: String(s?.name || s?.skill || s).trim(), level: s?.level || "Beginner" }
    ).filter((s) => s.name);

    await User.updateOne(
      { _id: u._id },
      { $set: { skillsOffered: newSkills } }
    );
    updated++;
    console.log("Migrated user:", u.email);
  }

  console.log(`Done. Updated ${updated} users.`);
  process.exit(0);
};

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
