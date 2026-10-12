const aiService = require("../services/aiService");

exports.chat = async (req, res) => {
  try {
    const { skill, message, level } = req.body;
    const userId = req.user._id;
    if (!message?.trim()) {
      return res.status(400).json({ message: "message is required" });
    }
    const result = await aiService.chat(userId, skill || "general", message.trim(), level || req.user.experienceLevel);
    res.json(result);
  } catch (err) {
    console.error("AI chat error:", err.message);
    res.status(500).json({ message: err.message || "AI chat failed" });
  }
};

exports.getRoadmap = async (req, res) => {
  try {
    const { skill, level } = req.query;
    if (!skill?.trim()) {
      return res.status(400).json({ message: "skill is required" });
    }
    const result = await aiService.getRoadmap(skill.trim(), level || req.user?.experienceLevel || "Beginner");
    res.json(result);
  } catch (err) {
    console.error("AI roadmap error:", err.message);
    res.status(500).json({ message: err.message || "Roadmap generation failed" });
  }
};

exports.getExercises = async (req, res) => {
  try {
    const { skill, level, difficulty, type, count } = req.query;
    if (!skill?.trim()) {
      return res.status(400).json({ message: "skill is required" });
    }
    const result = await aiService.getExercises(
      skill.trim(),
      level || req.user?.experienceLevel || "Beginner",
      difficulty || "medium",
      type || "quiz",
      Math.min(parseInt(count, 10) || 3, 10)
    );
    res.json({ exercises: result });
  } catch (err) {
    console.error("AI exercises error:", err.message);
    res.status(500).json({ message: err.message || "Exercise generation failed" });
  }
};

exports.clarifyDoubt = async (req, res) => {
  try {
    const { skill, doubt, level } = req.body;
    if (!doubt?.trim()) {
      return res.status(400).json({ message: "doubt is required" });
    }
    const result = await aiService.clarifyDoubt(skill || "general", doubt.trim(), level || req.user?.experienceLevel || "Beginner");
    res.json(result);
  } catch (err) {
    console.error("AI doubt error:", err.message);
    res.status(500).json({ message: err.message || "Doubt clarification failed" });
  }
};

exports.clearHistory = async (req, res) => {
  try {
    const { skill } = req.body;
    const userId = req.user._id;
    await aiService.clearHistory(userId, skill);
    res.json({ message: "Chat history cleared" });
  } catch (err) {
    console.error("AI clear error:", err.message);
    res.status(500).json({ message: err.message || "Clear failed" });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { skill } = req.query;
    const userId = req.user._id;
    const AIChatMessage = require("../models/AIChatMessage");
    const history = await AIChatMessage.find({ user: userId, skill: skill || "general" })
      .sort({ createdAt: 1 })
      .limit(50)
      .select("role content createdAt")
      .lean();
    res.json({ history });
  } catch (err) {
    console.error("AI history error:", err.message);
    res.status(500).json({ message: err.message || "Failed to fetch history" });
  }
};

exports.getSkills = (req, res) => {
  res.json({ skills: aiService.SKILLS });
};

exports.recommendTutorials = async (req, res) => {
  try {
    const { skill, level } = req.query;
    if (!skill?.trim()) {
      return res.status(400).json({ message: "skill is required" });
    }
    const result = await aiService.recommendTutorials(skill.trim(), level || req.user?.experienceLevel || "Beginner");
    res.json(result);
  } catch (err) {
    console.error("AI recommend tutorials error:", err.message);
    res.status(500).json({ message: err.message || "Tutorial recommendation failed" });
  }
};
