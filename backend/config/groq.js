const { Groq } = require("groq-sdk");

const apiKey = process.env.GROQ_API_KEY;
let groq = null;

if (apiKey) {
  groq = new Groq({ apiKey });
}

const defaultModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

module.exports = { groq, defaultModel };
