const { groq, defaultModel } = require("../config/groq");
const AIChatMessage = require("../models/AIChatMessage");

const SKILLS = [
  "Java",
  "JavaScript",
  "Python",
  "React",
  "Node.js",
  "UI/UX",
  "Public Speaking",
  "Leadership",
  "SQL",
  "Data Science",
];

const SYSTEM_PROMPT = (skill, level) =>
  `You are a friendly learning mentor for the skill: ${skill || "general"}.
The user's level is: ${level || "beginner"}.
Respond helpfully with clear explanations and examples.
For technical skills include code examples when relevant.
Keep responses concise but informative.`;

/* ------------------------------------------------ */
/* 1️⃣ AI Chat (context-aware) */
/* ------------------------------------------------ */

async function chat(userId, skill, message, level = "Beginner") {
  if (!groq) throw new Error("Groq API key not configured");
  
  const history = await AIChatMessage.find({
    user: userId,
    skill: skill || "general",
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const systemInstruction = SYSTEM_PROMPT(skill, level);

  let chatHistory = history.reverse().map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
  }));

  chatHistory.unshift({
    role: "system",
    content: systemInstruction,
  });

  chatHistory.push({
    role: "user",
    content: message,
  });

  const completion = await groq.chat.completions.create({
    messages: chatHistory,
    model: defaultModel,
    temperature: 0.7,
    max_tokens: 1024,
  });

  const reply = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

  /* Save conversation */
  await AIChatMessage.create([
    { user: userId, role: "user", content: message, skill },
    { user: userId, role: "assistant", content: reply, skill },
  ]);

  return { reply };
}

/* ------------------------------------------------ */
/* 2️⃣ Learning Roadmap */
/* ------------------------------------------------ */

async function getRoadmap(skill, level = "Beginner") {
  if (!groq) throw new Error("Groq API key not configured");

  const prompt = `Create a personalized learning roadmap for "${skill}" for a ${level} learner.

Return JSON only:

{
  "skill": "${skill}",
  "level": "${level}",
  "weeks": [
    { "week": 1, "title": "...", "milestones": ["..."], "topics": ["..."] }
  ],
  "totalWeeks": 8
}

Make it practical with 6-10 weeks.
Output ONLY valid JSON without any markdown formatting.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: defaultModel,
    temperature: 0.5,
    response_format: { type: "json_object" },
  });

  let text = completion.choices[0]?.message?.content || "{}";

  try {
    return JSON.parse(text);
  } catch {
    return {
      skill,
      level,
      weeks: [],
      totalWeeks: 8,
      raw: text,
    };
  }
}

/* ------------------------------------------------ */
/* 3️⃣ Practice Exercises */
/* ------------------------------------------------ */

function normalizeExercise(ex) {
  if (!ex || typeof ex !== "object") return null;

  return {
    question: ex.question ?? ex.Question ?? "",
    options: Array.isArray(ex.options)
      ? ex.options
      : ex.Options
        ? [].concat(ex.Options)
        : [],
    answer: ex.answer ?? ex.Answer ?? "",
    explanation: ex.explanation ?? ex.Explanation ?? "",
    codeExample: ex.codeExample ?? ex.code ?? ex.CodeExample ?? "",
  };
}

function extractJsonArray(text) {
  if (!text) return [];

  let clean = text.replace(/```json\n?|\n?```/g, "").trim();

  const match = clean.match(/\[\s*[\s\S]*\]/);

  if (match) clean = match[0];

  try {
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getExercises(
  skill,
  level = "Beginner",
  difficulty = "medium",
  type = "quiz",
  count = 3
) {
  if (!groq) throw new Error("Groq API key not configured");

  const prompt = `Generate ${count} ${type} exercises for "${skill}" at ${level} level.

Return JSON array only wrapped in an object with an 'exercises' key:
{
  "exercises": [
    {
      "question": "...",
      "options": ["A","B","C","D"],
      "answer": "A",
      "explanation": "...",
      "codeExample": "optional code"
    }
  ]
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: defaultModel,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  let text = completion.choices[0]?.message?.content || '{"exercises":[]}';
  
  try {
    const parsed = JSON.parse(text);
    const raw = parsed.exercises || [];
    return raw.map(normalizeExercise).filter(Boolean);
  } catch {
    return [];
  }
}

/* ------------------------------------------------ */
/* 4️⃣ Doubt Clarification */
/* ------------------------------------------------ */

async function clarifyDoubt(skill, doubt, level = "Beginner") {
  if (!groq) throw new Error("Groq API key not configured");

  const prompt = `The user is learning "${skill}" at ${level} level.

Question:
"${doubt}"

Explain clearly with examples.
If technical include code examples.
Keep explanation simple but complete.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: defaultModel,
    temperature: 0.6,
  });

  const reply =
    completion.choices[0]?.message?.content ||
    "Sorry, I couldn't generate an explanation.";

  return { reply };
}

/* ------------------------------------------------ */
/* 5️⃣ Clear Chat History */
/* ------------------------------------------------ */

async function clearHistory(userId, skill) {
  await AIChatMessage.deleteMany({
    user: userId,
    skill: skill || "general",
  });

  return { message: "Chat history cleared" };
}

/* ------------------------------------------------ */
/* 6️⃣ Recommend Tutorials */
/* ------------------------------------------------ */

async function recommendTutorials(skill, level = "Beginner") {
  if (!groq) throw new Error("Groq API key not configured");

  const prompt = `You are EduBot, an AI learning assistant inside a Community Skill Exchange Platform.

Your job is to recommend helpful YouTube tutorials for users based on the skill they want to learn.

Rules:
1. Recommend beginner-friendly, high-quality tutorials.
2. Prefer tutorials that include projects or hands-on examples.
3. Provide 5 recommendations from the best and most popular YouTube channels for the skill.
4. Include the tutorial title, channel name, topic covered, and why it is useful.
5. Structure the response in a clean list format.
6. Focus on practical learning rather than theory-heavy videos.
7. If the user provides a skill level (beginner/intermediate/advanced), adjust recommendations accordingly.
8. Suggest tutorials that help users build real projects.

Output format:

Skill: ${skill}

Recommended Tutorials:

1. Title:
   Channel:
   Topic:
   Why watch:

2. Title:
   Channel:
   Topic:
   Why watch:

3. Title:
   Channel:
   Topic:
   Why watch:

4. Title:
   Channel:
   Topic:
   Why watch:

5. Title:
   Channel:
   Topic:
   Why watch:

The user is looking for recommendations for the skill: "${skill}" at ${level} level.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: defaultModel,
    temperature: 0.6,
  });

  const reply =
    completion.choices[0]?.message?.content ||
    "Sorry, I couldn't generate recommendations.";

  return { reply };
}

module.exports = {
  chat,
  getRoadmap,
  getExercises,
  clarifyDoubt,
  clearHistory,
  recommendTutorials,
  SKILLS,
};