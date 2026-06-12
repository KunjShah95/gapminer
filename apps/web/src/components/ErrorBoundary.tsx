import { Component, type ReactNode, type ErrorInfo } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
              <AlertCircle size={32} className="text-error" />
            </div>
            <h2 className="mb-2 text-xl font-black text-on-surface">Something went wrong</h2>
            <p className="mb-6 text-sm text-on-surface-variant">
              {this.state.error?.message || "An unexpected error occurred. Please try again."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary-fixed transition-all hover:bg-primary/90"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/25 px-6 py-3 text-sm font-bold text-on-surface transition-all hover:bg-surface-container-high"
              >
                <Home size={16} />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
