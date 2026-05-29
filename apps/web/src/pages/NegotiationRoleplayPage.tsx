import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Trophy,
  Play,
  X,
  AlertCircle,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Badge,
  StatCard,
  EmptyState,
  Input,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";

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

  const resetSession = () => {
    setShowSetup(true);
    setSessionId(null);
    setMessages([]);
    setScorecard(null);
    setIsFinalized(false);
  };

  if (showSetup) {
    return (
      <PageShell maxWidth="md">
        <div className="flex min-h-[70vh] items-center justify-center">
          <Card padding="lg" className="w-full max-w-lg">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl primary-gradient text-on-primary-fixed">
                <DollarSign className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-black text-on-surface">
                Salary Negotiation Role-Play
              </h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                Practice negotiating with an AI recruiter
              </p>
            </div>

            {error && (
              <Card className="mb-4 border-error/30 bg-error/10" padding="sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-error" />
                  <p className="text-sm text-error">{error}</p>
                </div>
              </Card>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Company"
                  type="text"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="TechCorp"
                />
                <Input
                  label="Role"
                  type="text"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  placeholder="Software Engineer"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Base salary"
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) =>
                    setFormData({ ...formData, baseSalary: e.target.value })
                  }
                  placeholder="120000"
                />
                <Input
                  label="Bonus"
                  type="number"
                  value={formData.bonus}
                  onChange={(e) =>
                    setFormData({ ...formData, bonus: e.target.value })
                  }
                  placeholder="10000"
                />
                <Input
                  label="Equity"
                  type="number"
                  value={formData.equity}
                  onChange={(e) =>
                    setFormData({ ...formData, equity: e.target.value })
                  }
                  placeholder="50000"
                />
              </div>

              <Textarea
                label="Your goals"
                value={formData.goals}
                onChange={(e) =>
                  setFormData({ ...formData, goals: e.target.value })
                }
                placeholder="e.g., I want a higher base salary and more equity..."
                rows={3}
              />

              <Button
                onClick={handleStart}
                disabled={loading}
                loading={loading}
                className="w-full"
                size="lg"
              >
                <Play size={18} />
                {loading ? "Starting..." : "Start negotiation"}
              </Button>
            </div>
          </Card>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell noPadding maxWidth="full" className="flex min-h-screen flex-col !p-0">
      <div className="border-b border-outline-variant/15 bg-surface-container p-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Briefcase size={20} />
            </div>
            <div>
              <h1 className="font-bold text-on-surface">Negotiation practice</h1>
              <p className="text-xs text-on-surface-variant">
                {formData.company} · {formData.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFinalized && (
              <Badge tone="success" className="gap-1 normal-case tracking-normal">
                <CheckCircle2 size={12} />
                Finalized
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={resetSession}>
              <X size={18} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <EmptyState
              icon={<Bot size={28} />}
              title="Session started"
              description="The recruiter will message you shortly"
            />
          )}
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                msg.role === "user" && "flex-row-reverse",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  msg.role === "user"
                    ? "primary-gradient text-on-primary-fixed"
                    : "bg-surface-container-high text-on-surface-variant",
                )}
              >
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl p-4 text-sm",
                  msg.role === "user"
                    ? "primary-gradient rounded-tr-sm text-on-primary-fixed"
                    : "glass-card rounded-tl-sm text-on-surface",
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high">
                <Bot size={16} className="text-on-surface-variant" />
              </div>
              <Card padding="sm" className="rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-outline" />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-outline"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-outline"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {scorecard && (
        <div className="border-t border-outline-variant/15 bg-surface-container p-4">
          <div className="mx-auto max-w-3xl">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-on-surface">
              <Trophy className="h-5 w-5 text-amber-400" />
              Performance scorecard
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {["preparation", "communication", "strategy", "outcome"].map(
                (key) => (
                  <StatCard
                    key={key}
                    label={key}
                    value={scorecard.scorecard?.[key] || "N/A"}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-outline-variant/15 bg-surface-container p-4">
        <div className="mx-auto flex max-w-3xl gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              isFinalized ? "Negotiation finalized" : "Type your response..."
            }
            disabled={loading || isFinalized}
            className="gm-input flex-1 disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={loading || isFinalized || !input.trim()}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
