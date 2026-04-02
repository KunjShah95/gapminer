import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Trophy,
  BarChart3,
  Play,
  X,
  AlertCircle,
  DollarSign,
  Briefcase,
  Building2,
  Target,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";

export default function NegotiationRoleplayPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<any>(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    baseSalary: "",
    bonus: "",
    equity: "",
    goals: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStart = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/negotiation-roleplay/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company: formData.company,
          role: formData.role,
          offer: {
            base: formData.baseSalary
              ? parseInt(formData.baseSalary)
              : undefined,
            bonus: formData.bonus ? parseInt(formData.bonus) : undefined,
            equity: formData.equity ? parseInt(formData.equity) : undefined,
          },
          goals: formData.goals,
        }),
      });

      if (!res.ok) throw new Error("Failed to start negotiation");

      const data = await res.json().catch(() => ({
        sessionId: null,
        recruiterMessage: "Error starting session",
      }));
      setSessionId(data.sessionId);
      setMessages([{ role: "recruiter", content: data.recruiterMessage }]);
      setShowSetup(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId || isFinalized) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const token = getAuthToken();
      const res = await fetch("/api/v1/negotiation-roleplay/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId, message: userMessage }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json().catch(() => ({
        recruiterMessage: "Error processing response",
        isFinalized: false,
      }));
      setMessages((prev) => [
        ...prev,
        { role: "recruiter", content: data.recruiterMessage },
      ]);
      setIsFinalized(data.isFinalized);

      if (data.isFinalized) {
        fetchScorecard(sessionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  const fetchScorecard = async (sid: string) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/v1/negotiation-roleplay/score/${sid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        setScorecard(data);
      }
    } catch (err) {
      console.error("Failed to get scorecard:", err);
    }
  };

  if (showSetup) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Salary Negotiation Role-Play
              </h1>
              <p className="text-gray-600 mt-2">
                Practice negotiating with an AI recruiter
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    placeholder="TechCorp"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    placeholder="Software Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Salary
                  </label>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) =>
                      setFormData({ ...formData, baseSalary: e.target.value })
                    }
                    placeholder="120000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bonus
                  </label>
                  <input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) =>
                      setFormData({ ...formData, bonus: e.target.value })
                    }
                    placeholder="10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equity
                  </label>
                  <input
                    type="number"
                    value={formData.equity}
                    onChange={(e) =>
                      setFormData({ ...formData, equity: e.target.value })
                    }
                    placeholder="50000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Goals
                </label>
                <textarea
                  value={formData.goals}
                  onChange={(e) =>
                    setFormData({ ...formData, goals: e.target.value })
                  }
                  placeholder="e.g., I want a higher base salary and more equity..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                />
              </div>

              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Play size={18} />
                {loading ? "Starting..." : "Start Negotiation"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Briefcase size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">
                Negotiation Practice
              </h1>
              <p className="text-xs text-gray-500">
                {formData.company} • {formData.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFinalized && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 size={14} />
                Finalized
              </span>
            )}
            <button
              onClick={() => {
                setShowSetup(true);
                setSessionId(null);
                setMessages([]);
                setScorecard(null);
                setIsFinalized(false);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white border border-gray-200 rounded-tl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Bot size={16} className="text-gray-700" />
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {scorecard && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Performance Scorecard
            </h3>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {["preparation", "communication", "strategy", "outcome"].map(
                (key) => (
                  <div
                    key={key}
                    className="bg-gray-50 p-3 rounded-lg text-center"
                  >
                    <p className="text-2xl font-bold text-blue-600">
                      {scorecard.scorecard?.[key] || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{key}</p>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              isFinalized ? "Negotiation finalized" : "Type your response..."
            }
            disabled={loading || isFinalized}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || isFinalized || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
