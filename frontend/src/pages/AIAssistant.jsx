import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { IoChatbubbleOutline, IoBookOutline, IoCodeSlashOutline, IoHelpCircleOutline, IoLogoYoutube } from "react-icons/io5";
import ReactMarkdown from "react-markdown";

const cleanAIResponse = (text) => {
  if (!text) return "";
  let cleanText = text;
  if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
    cleanText = cleanText.substring(1, cleanText.length - 1);
  }
  // Replace literal \n with actual newlines
  return cleanText.replace(/\\n/g, '\n');
};

const getApiBase = () => {
  const env = import.meta.env.VITE_API_URL || "";
  const base = env.replace(/\/api\/?$/, "") || "http://localhost:5000";
  return base.startsWith("http") ? base : "http://localhost:5000";
};
const API_URL = getApiBase();

export default function AIAssistant() {
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [skillInput, setSkillInput] = useState(""); // optional, for roadmap/exercises only
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [doubt, setDoubt] = useState("");
  const [doubtReply, setDoubtReply] = useState("");
  const [tutorials, setTutorials] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/signin");
      return;
    }
  }, [token, navigate]);

  const level = user?.experienceLevel || "Beginner";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const fetchHistory = () => {
    if (!token) return;
    axios
      .get(`${API_URL}/api/ai/history`, {
        params: { skill: "general" },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setHistory(res.data.history || []))
      .catch(() => setHistory([]));
  };

  useEffect(() => {
    if (activeTab === "chat") fetchHistory();
  }, [activeTab]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    setMessage("");
    setHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/ai/chat`,
        { skill: "general", message: userMsg, level },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistory((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      setHistory((prev) => [...prev, { role: "assistant", content: err.response?.data?.message || "Error: Could not get response." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!token) return;
    try {
      await axios.post(`${API_URL}/api/ai/clear-history`, { skill: "general" }, { headers: { Authorization: `Bearer ${token}` } });
      setHistory([]);
    } catch (_) { }
  };

  const handleGetRoadmap = async () => {
    setLoading(true);
    setRoadmap(null);
    try {
      const skill = skillInput.trim() || "general programming";
      const res = await axios.get(`${API_URL}/api/ai/roadmap`, {
        params: { skill, level },
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoadmap(res.data);
    } catch (err) {
      setRoadmap({ error: err.response?.data?.message || "Failed to generate roadmap" });
    } finally {
      setLoading(false);
    }
  };

  const handleGetExercises = async () => {
    setLoading(true);
    setExercises([]);
    try {
      const skill = skillInput.trim() || "general programming";
      const res = await axios.get(`${API_URL}/api/ai/exercises`, {
        params: { skill, level, difficulty: "medium", count: 3 },
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data?.exercises) ? res.data.exercises : [];
      setExercises(list);
    } catch (err) {
      setExercises([{ question: "Failed to load exercises.", answer: "", explanation: err.response?.data?.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClarifyDoubt = async (e) => {
    e.preventDefault();
    if (!doubt.trim() || loading) return;
    setLoading(true);
    setDoubtReply("");
    try {
      const res = await axios.post(
        `${API_URL}/api/ai/clarify`,
        { skill: skillInput.trim() || "general", doubt: doubt.trim(), level },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDoubtReply(res.data.reply || "");
    } catch (err) {
      setDoubtReply(err.response?.data?.message || "Could not clarify.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetTutorials = async () => {
    setLoading(true);
    setTutorials("");
    try {
      const skill = skillInput.trim() || "general programming";
      const res = await axios.get(`${API_URL}/api/ai/recommend-tutorials`, {
        params: { skill, level },
        headers: { Authorization: `Bearer ${token}` },
      });
      setTutorials(res.data.reply || "");
    } catch (err) {
      setTutorials(err.response?.data?.message || "Failed to generate tutorials.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const tabs = [
    { id: "chat", label: "Chat", icon: IoChatbubbleOutline },
    { id: "roadmap", label: "Roadmap", icon: IoBookOutline },
    { id: "exercises", label: "Exercises", icon: IoCodeSlashOutline },
    { id: "doubt", label: "Ask Doubt", icon: IoHelpCircleOutline },
    { id: "tutorials", label: "Tutorials", icon: IoLogoYoutube },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-red-500 mb-6">AI Learning Assistant</h1>
        <p className="text-center text-gray-600 mb-8">Your personalized learning mentor powered by Groq</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === t.id ? "bg-red-500 text-white" : "bg-white text-gray-600 shadow hover:bg-gray-50"
                }`}
            >
              <t.icon className="text-lg" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {activeTab === "chat" && (
            <div className="flex flex-col h-[500px]">
              <div className="flex justify-between items-center px-4 py-2 border-b">
                <span className="text-gray-600">Chat with AI mentor</span>
                <button onClick={handleClearChat} className="text-sm text-red-500 hover:underline">Clear chat</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.length === 0 && !loading && (
                  <p className="text-gray-500 text-center py-8">Start a conversation! Ask anything about learning, skills, or programming.</p>
                )}
                {history.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 ${m.role === "user" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {m.role === "user" ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm">{m.content}</pre>
                      ) : (
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:p-0">
                          <ReactMarkdown>{cleanAIResponse(m.content)}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-2 text-gray-500">Thinking...</div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          )}

          {activeTab === "roadmap" && (
            <div className="p-6">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Skill (optional, e.g. Java, React)"
                className="mb-4 mr-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 w-full max-w-xs"
              />
              <button
                onClick={handleGetRoadmap}
                disabled={loading}
                className="mb-4 px-6 py-2 bg-red-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Roadmap"}
              </button>
              {roadmap?.error && <p className="text-red-500">{roadmap.error}</p>}
              {roadmap?.weeks?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{roadmap.skill} - {roadmap.level}</h3>
                  {roadmap.weeks.map((w) => (
                    <div key={w.week} className="border-l-4 border-red-500 pl-4 py-2">
                      <h4 className="font-semibold text-gray-800">Week {w.week}: {w.title}</h4>
                      <ul className="list-disc list-inside text-gray-600 text-sm mt-1">
                        {(w.milestones || w.topics || []).map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "exercises" && (
            <div className="p-6">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Skill (optional, e.g. Java, React)"
                className="mb-4 mr-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 w-full max-w-xs"
              />
              <button
                onClick={handleGetExercises}
                disabled={loading}
                className="mb-4 px-6 py-2 bg-red-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Exercises"}
              </button>
              <div className="space-y-6">
                {exercises.length === 0 && !loading && (
                  <p className="text-gray-500 text-center py-6">No exercises yet. Enter a skill above and click &quot;Generate Exercises&quot;, or try again if the request failed.</p>
                )}
                {exercises.map((ex, i) => (
                  <div key={i} className="border rounded-lg p-4 bg-gray-50">
                    <p className="font-medium text-gray-800">{ex.question ?? ex.Question ?? "Question"}</p>
                    {(ex.options?.length || ex.Options?.length) ? (
                      <ul className="mt-2 text-gray-600 text-sm list-disc list-inside">
                        {(ex.options || ex.Options || []).map((o, j) => (
                          <li key={j}>{typeof o === "string" ? o : String(o)}</li>
                        ))}
                      </ul>
                    ) : null}
                    <details className="mt-3">
                      <summary className="text-red-500 font-medium cursor-pointer">Show answer</summary>
                      <p className="mt-2 text-gray-700">{ex.answer ?? ex.Answer ?? ""}</p>
                      {(ex.explanation ?? ex.Explanation) && (
                        <p className="mt-2 text-gray-600 text-sm">{ex.explanation ?? ex.Explanation}</p>
                      )}
                      {(ex.codeExample ?? ex.code ?? ex.CodeExample) && (
                        <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                          {ex.codeExample ?? ex.code ?? ex.CodeExample ?? ""}
                        </pre>
                      )}
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "doubt" && (
            <div className="p-6">
              <form onSubmit={handleClarifyDoubt} className="space-y-4">
                <textarea
                  value={doubt}
                  onChange={(e) => setDoubt(e.target.value)}
                  placeholder="Ask your doubt... (e.g., What is the difference between let and const?)"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 min-h-[120px]"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!doubt.trim() || loading}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? "Clarifying..." : "Get Explanation"}
                </button>
              </form>
              {doubtReply && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-semibold text-gray-800 mb-2">Explanation</h4>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown>{cleanAIResponse(doubtReply)}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "tutorials" && (
            <div className="p-6">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Skill (optional, e.g. React, Node.js)"
                className="mb-4 mr-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 w-full max-w-xs"
              />
              <button
                onClick={handleGetTutorials}
                disabled={loading}
                className="mb-4 px-6 py-2 bg-red-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? "Finding Tutorials..." : "Recommend Tutorials"}
              </button>
              {tutorials && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-semibold text-gray-800 mb-2">Recommended YouTube Tutorials</h4>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown>{cleanAIResponse(tutorials)}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
