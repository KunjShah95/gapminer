import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
  Github,
  Chrome,
  Shield,
  ArrowLeft,
  Mail,
  KeyRound,
} from "lucide-react";
import type { User } from "@gapminer/types";

type AuthMode =
  | "login"
  | "signup"
  | "forgot-password"
  | "reset-password"
  | "2fa";

const allowedModes: AuthMode[] = [
  "login",
  "signup",
  "forgot-password",
  "reset-password",
  "2fa",
];

const resolveMode = (value: string | null): AuthMode | null => {
  if (value && allowedModes.includes(value as AuthMode)) {
    return value as AuthMode;
  }
  return null;
};

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode =
    resolveMode(searchParams.get("mode")) ??
    (searchParams.get("signin") === "true" ? "login" : "signup");
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [resetToken, setResetToken] = useState(searchParams.get("token") || "");
  const { setUser, setToken } = useAuthStore();
  const navigate = useNavigate();
  const redirectPlan = searchParams.get("plan");

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setResetToken(token);
      setMode("reset-password");
      return;
    }

    const nextMode = resolveMode(searchParams.get("mode"));
    if (nextMode && nextMode !== mode) {
      setMode(nextMode);
      return;
    }

    if (!nextMode && searchParams.get("signin") === "true" && mode !== "login") {
      setMode("login");
    }
  }, [searchParams, mode]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requires_2fa) {
          setPendingEmail(email);
          setPendingPassword(password);
          setMode("2fa");
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Authentication failed");
      }

      const userData = data.user;
      const mappedUser: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        plan: userData.plan,
        createdAt: userData.created_at,
        analysesUsed: userData.analyses_used,
        analysesLimit: userData.analyses_limit,
      };

      setUser(mappedUser);
      setToken(data.access_token);
      navigateAfterLogin(data.access_token);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/2fa/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: twoFactorCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid 2FA code");
      }

      const userData = data.user;
      const mappedUser: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        plan: userData.plan,
        createdAt: userData.created_at,
        analysesUsed: userData.analyses_used,
        analysesLimit: userData.analyses_limit,
      };

      setUser(mappedUser);
      setToken(data.access_token);
      navigateAfterLogin(data.access_token);
    } catch (err: any) {
      setError(err.message || "Invalid 2FA code");
    } finally {
      setLoading(false);
    }
  };

  const navigateAfterLogin = async (token: string) => {
    if (redirectPlan && (redirectPlan === "pro" || redirectPlan === "teams")) {
      try {
        const checkoutResponse = await fetch(
          "/api/v1/payments/create-checkout-session",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ planId: redirectPlan }),
          },
        );
        const checkoutData = await checkoutResponse.json();
        if (checkoutResponse.ok && checkoutData.url) {
          window.location.href = checkoutData.url;
          return;
        }
      } catch (checkoutErr) {
        console.error("Checkout redirect failed:", checkoutErr);
      }
    }
    navigate("/dashboard");
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      const userData = data.user;
      const mappedUser: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        plan: userData.plan,
        createdAt: userData.created_at,
        analysesUsed: userData.analyses_used,
        analysesLimit: userData.analyses_limit,
      };

      setUser(mappedUser);
      setToken(data.access_token);
      navigateAfterLogin(data.access_token);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setSuccess(
        "If an account exists with this email, you will receive a password reset link.",
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        setMode("login");
        setEmail("");
        setPassword("");
        setResetToken("");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login":
        return "Welcome back";
      case "signup":
        return "Create your account";
      case "forgot-password":
        return "Reset your password";
      case "reset-password":
        return "Create new password";
      case "2fa":
        return "Two-factor authentication";
      default:
        return "";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "login":
        return "Sign in to access your analysis dashboard and roadmaps.";
      case "signup":
        return "The first AI-pipeline that bridges your skills to market demand.";
      case "forgot-password":
        return "Enter your email and we will send you a reset link.";
      case "reset-password":
        return "Enter your new password below.";
      case "2fa":
        return "Enter the 6-digit code from your authenticator app.";
      default:
        return "";
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-8 relative overflow-hidden hero-mesh">
      {/* Background Blurs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      {/* Navigation */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="text-2xl font-bold tracking-tighter text-[#f9f5fd] flex items-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-2xl primary-gradient flex items-center justify-center text-on-primary-fixed shadow-lg group-hover:scale-110 transition-transform">
            <Sparkles size={20} />
          </div>
          Gapminer
        </Link>

        {(mode === "login" || mode === "signup") && (
          <div className="flex items-center gap-2 rounded-full border border-outline-variant/15 bg-surface-container-low/70 p-1 backdrop-blur-xl shadow-lg">
            <Link
              to="/auth?mode=login"
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${mode === "login" ? "bg-primary text-on-primary-fixed" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Sign In
            </Link>
            <Link
              to="/auth?mode=signup"
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${mode === "signup" ? "bg-primary text-on-primary-fixed" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Create Account
            </Link>
          </div>
        )}
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="glass bg-surface-container-high p-8 lg:p-12 rounded-[2.5rem] border border-outline-variant/20 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight font-headline mb-3">
              {getTitle()}
            </h1>
            <p className="text-on-surface-variant text-sm font-light leading-relaxed">
              {getSubtitle()}
            </p>
          </div>

          {/* Login Form */}
          {(mode === "login" || mode === "signup") && (
            <>
              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  type="button"
                  className="glass border border-outline-variant/20 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors text-sm font-semibold active:scale-[0.98]"
                >
                  <Chrome size={18} />
                  Google
                </button>
                <button
                  type="button"
                  className="glass border border-outline-variant/20 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors text-sm font-semibold active:scale-[0.98]"
                >
                  <Github size={18} />
                  GitHub
                </button>
              </div>

              <div className="relative mb-8 text-center">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-outline-variant/10"></div>
                </div>
                <span className="relative px-4 text-xs font-bold uppercase tracking-widest text-outline bg-surface-container-high">
                  or email
                </span>
              </div>
            </>
          )}

          {/* Forms */}
          {(mode === "login" || mode === "signup") && (
            <form
              onSubmit={
                mode === "login" ? handleLoginSubmit : handleSignupSubmit
              }
              className="space-y-5"
            >
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1"
                    htmlFor="auth-name"
                  >
                    Full Name
                  </label>
                  <input
                    id="auth-name"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1"
                  htmlFor="auth-email"
                >
                  Email Address
                </label>
                <input
                  id="auth-email"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label
                    className="text-xs font-bold uppercase tracking-widest text-on-surface-variant"
                    htmlFor="auth-password"
                  >
                    Password
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot-password")}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative group/pass">
                  <input
                    id="auth-password"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50 pr-12"
                    type={showPw ? "text" : "password"}
                    placeholder={
                      mode === "signup" ? "••••••••" : "Enter password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors p-1"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="bg-error/10 border border-error/50 p-4 rounded-2xl text-error text-sm font-medium animate-shake"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full primary-gradient text-on-primary-fixed py-4 rounded-2xl font-bold shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 group/btn"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-on-primary-fixed/30 border-t-on-primary-fixed rounded-full animate-spin"></div>
                ) : (
                  <>
                    {mode === "signup" ? "Create Free Account" : "Sign In"}
                    <ArrowRight
                      size={20}
                      className="group-hover/btn:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === "forgot-password" && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1"
                  htmlFor="forgot-email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-outline"
                  />
                  <input
                    id="forgot-email"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl pl-12 pr-5 py-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div
                  className="bg-error/10 border border-error/50 p-4 rounded-2xl text-error text-sm font-medium"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  className="bg-primary/10 border border-primary/50 p-4 rounded-2xl text-primary text-sm font-medium"
                  role="alert"
                >
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full primary-gradient text-on-primary-fixed py-4 rounded-2xl font-bold shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-on-primary-fixed/30 border-t-on-primary-fixed rounded-full animate-spin"></div>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-sm text-primary hover:underline flex items-center justify-center gap-2 mx-auto"
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Reset Password Form */}
          {mode === "reset-password" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1"
                  htmlFor="new-password"
                >
                  New Password
                </label>
                <div className="relative group/pass">
                  <input
                    id="new-password"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50 pr-12"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors p-1"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="bg-error/10 border border-error/50 p-4 rounded-2xl text-error text-sm font-medium"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  className="bg-primary/10 border border-primary/50 p-4 rounded-2xl text-primary text-sm font-medium"
                  role="alert"
                >
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full primary-gradient text-on-primary-fixed py-4 rounded-2xl font-bold shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-on-primary-fixed/30 border-t-on-primary-fixed rounded-full animate-spin"></div>
                ) : (
                  "Reset Password"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-sm text-primary hover:underline flex items-center justify-center gap-2 mx-auto"
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* 2FA Form */}
          {mode === "2fa" && (
            <form onSubmit={handle2FAVerify} className="space-y-5">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1"
                  htmlFor="2fa-code"
                >
                  Authentication Code
                </label>
                <div className="relative">
                  <KeyRound
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-outline"
                  />
                  <input
                    id="2fa-code"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl pl-12 pr-5 py-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50 text-center text-2xl tracking-[0.5em] font-mono"
                    type="text"
                    placeholder="000000"
                    value={twoFactorCode}
                    onChange={(e) =>
                      setTwoFactorCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    required
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>
              </div>

              {error && (
                <div
                  className="bg-error/10 border border-error/50 p-4 rounded-2xl text-error text-sm font-medium"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || twoFactorCode.length !== 6}
                className="w-full primary-gradient text-on-primary-fixed py-4 rounded-2xl font-bold shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-on-primary-fixed/30 border-t-on-primary-fixed rounded-full animate-spin"></div>
                ) : (
                  "Verify Code"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setTwoFactorCode("");
                  }}
                  className="text-sm text-primary hover:underline flex items-center justify-center gap-2 mx-auto"
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Toggle */}
          {(mode === "login" || mode === "signup") && (
            <div className="mt-10 text-center text-sm text-on-surface-variant font-light">
              {mode === "signup" ? (
                <>
                  Already using Gapminer?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-primary font-bold hover:underline ml-1 transition-colors"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  New to the platform?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-primary font-bold hover:underline ml-1 transition-colors"
                  >
                    Create Account
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Security / Terms */}
        <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
          <div className="flex items-center gap-6 text-xs text-outline font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-primary">
              Conditions
            </a>
            <span className="w-1 h-1 rounded-full bg-outline/30"></span>
            <a href="#" className="hover:text-primary">
              Privacy
            </a>
            <span className="w-1 h-1 rounded-full bg-outline/30"></span>
            <a href="#" className="hover:text-primary">
              Security
            </a>
          </div>
          <p className="text-[10px] text-outline/50 flex items-center gap-1">
            <Shield size={10} />
            SSL Encrypted via Ollama Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
