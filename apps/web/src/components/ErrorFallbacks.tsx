import { Link } from "react-router-dom";
import { BarChart3, Bot, RefreshCw, Home } from "lucide-react";

export function AnalysisErrorFallback() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
        <BarChart3 size={32} className="text-error" />
      </div>
      <h2 className="mb-2 text-xl font-black text-on-surface">Analysis Load Failed</h2>
      <p className="mb-6 text-sm text-on-surface-variant text-center max-w-md">
        We couldn't load your analysis results. This may be a temporary issue.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary-fixed"
        >
          <RefreshCw size={16} />
          Retry
        </button>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/25 px-6 py-3 text-sm font-bold text-on-surface"
        >
          <Home size={16} />
          Dashboard
        </Link>
      </div>
    </div>
  );
}

export function ChatErrorFallback() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
        <Bot size={32} className="text-error" />
      </div>
      <h2 className="mb-2 text-xl font-black text-on-surface">Chat Unavailable</h2>
      <p className="mb-6 text-sm text-on-surface-variant text-center max-w-md">
        The AI chat service is currently unavailable. The Ollama model may need to be restarted.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary-fixed"
      >
        <RefreshCw size={16} />
        Retry
      </button>
    </div>
  );
}
