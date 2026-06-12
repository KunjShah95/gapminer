import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthToken } from "@/lib/authFetch";
import {
  Bot,
  Send,
  User,
  Sparkles,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { PageShell, PageHeader, Button } from "@/components/ui";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your career AI assistant. I can help you with:\n\n• **Resume analysis** — Upload and get feedback on your resume\n• **Skill gap analysis** — See what skills you're missing for target roles\n• **Career advice** — Get personalized career guidance\n• **Market insights** — Learn about trending skills and roles\n• **Interview prep** — Practice questions and get tips\n\nWhat would you like help with?",
  timestamp: Date.now(),
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [
            ...messages.slice(1).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: userMsg.content },
          ],
        }),
      });

      if (!res.ok) throw new Error(await res.text().catch(() => "Chat failed"));

      const data = await res.json();
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.text || data.message || "I'm not sure how to respond to that.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || "Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setError(null);
  };

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        icon={<Bot size={22} />}
        title="AI Career Assistant"
        description="Chat with AI about your career, skills, job search, and more"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            disabled={messages.length <= 1}
          >
            <Trash2 size={14} />
            Clear chat
          </Button>
        }
      />

      <div className="glass-card flex flex-col overflow-hidden" style={{ minHeight: "calc(100vh - 220px)" } as CSSProperties}>
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                    msg.role === "user"
                      ? "bg-primary text-on-primary-fixed"
                      : "bg-surface-container-highest text-primary",
                  )}
                >
                  {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-on-primary-fixed rounded-tr-sm"
                      : "bg-surface-container border border-outline-variant/10 rounded-tl-sm",
                  )}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 max-w-[85%]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-container-highest text-primary">
                <Bot size={16} />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-surface-container border border-outline-variant/10 px-5 py-4">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary/50" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary/50" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary/50" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 rounded-xl border border-error/20 bg-error/5 p-3 text-xs text-error"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-outline-variant/10 p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your career, skills, or job search..."
              rows={1}
              className="w-full resize-none rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 pr-12 text-sm outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5 placeholder:text-outline/50"
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary-fixed transition-all hover:bg-primary/90 disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
          <p className="mt-2 text-[10px] text-outline text-center">
            AI responses are generated locally via Ollama. Press Enter to send, Shift+Enter for new line.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
