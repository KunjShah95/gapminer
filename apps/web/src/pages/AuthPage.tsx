import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { safeReadJson } from "@/lib/authFetch";
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
  const { user, token, setUser, setToken } = useAuthStore();
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

    if (
      !nextMode &&
      searchParams.get("signin") === "true" &&
      mode !== "login"
    ) {
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

      const data = await safeReadJson<any>(response, {});

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
        createdAt: userData.createdAt || userData.created_at,
        analysesUsed: userData.analysesUsed || userData.analyses_used,
        analysesLimit: userData.analysesLimit || userData.analyses_limit,
        twoFactorEnabled:
          userData.twoFactorEnabled || userData.two_factor_enabled,
        isVerified: userData.isVerified || userData.is_verified,
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

      const data = await safeReadJson<any>(response, {});

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
        const checkoutData = await safeReadJson<any>(checkoutResponse, {});
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

      const data = await safeReadJson<any>(response, {});

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

      const data = await safeReadJson<any>(response, {});

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

      const data = await safeReadJson<any>(response, {});

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
    <div className="relative flex min-h-screen overflow-hidden bg-surface text-on-surface mesh-bg">
      <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-secondary/10 blur-[100px]" />

      {/* Navigation */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between gap-4 px-6 py-6 lg:px-10">
        <Link
          to="/"
          className="group flex items-center gap-2 text-xl font-bold tracking-tight text-on-surface"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl primary-gradient text-on-primary-fixed shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            <Sparkles size={20} />
          </div>
          <span>
            Gapminer <span className="text-on-surface-variant text-sm font-medium">Career OS</span>
          </span>
        </Link>

        {(mode === "login" || mode === "signup") && (
          <div className="flex items-center gap-1 rounded-full border border-outline-variant/15 bg-surface-container/80 p-1 backdrop-blur-xl">
            <Link
              to="/auth?mode=login"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${mode === "login" ? "primary-gradient text-on-primary-fixed" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Sign In
            </Link>
            <Link
              to="/auth?mode=signup"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${mode === "signup" ? "primary-gradient text-on-primary-fixed" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Create Account
            </Link>
          </div>
        )}
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-10 px-6 pb-12 pt-28 lg:flex-row lg:items-stretch lg:gap-0 lg:px-10 lg:pb-10 lg:pt-24">
        {/* Brand panel — desktop split */}
        <aside className="hidden flex-col justify-center lg:flex lg:w-[42%] lg:pr-12">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-primary">Gapminer Career OS</p>
          <h2 className="mb-6 font-headline text-4xl font-black leading-tight tracking-tight xl:text-5xl">
            Precision intelligence for your{' '}
            <span className="text-gradient">next role.</span>
          </h2>
          <p className="max-w-md text-base font-light leading-relaxed text-on-surface-variant">
            Multi-agent analysis maps your skills to market demand, surfaces gaps with severity scores, and builds a
            verified roadmap — privately, on your infrastructure.
          </p>
          <ul className="mt-10 space-y-4">
            {['Local AI · resume stays private', 'ATS + semantic skill matching', 'Roadmaps ranked by ROI'].map(
              (item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Shield size={14} />
                  </span>
                  {item}
                </li>
              ),
            )}
          </ul>
        </aside>

        <div className="w-full max-w-md animate-fade-in lg:max-w-none lg:flex lg:w-[58%] lg:items-center lg:justify-center">
        <div className="glass-card w-full p-8 lg:max-w-md lg:p-12">
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
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-outline">
            <a href="#" className="hover:text-primary">
              Conditions
            </a>
            <span className="h-1 w-1 rounded-full bg-outline/30" />
            <a href="#" className="hover:text-primary">
              Privacy
            </a>
            <span className="h-1 w-1 rounded-full bg-outline/30" />
            <a href="#" className="hover:text-primary">
              Security
            </a>
          </div>
          <p className="flex items-center gap-1 text-[10px] text-outline/60">
            <Shield size={10} />
            SSL Encrypted · Ollama Infrastructure
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
