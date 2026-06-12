import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Check,
  Sparkles,
  ArrowRight,
  Zap,
  Building2,
  Users,
  CheckCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { safeReadJson } from "@/lib/authFetch";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    desc: "For engineers exploring their career gaps.",
    features: [
      "3 analyses per month",
      "Basic skill gap report",
      "Radar chart visualization",
      "Skill tag breakdown (matched / missing)",
      "Email support",
    ],
    cta: "Get started free",
    highlighted: false,
    icon: Sparkles,
  },
  {
    id: "pro",
    name: "Pro",
    price: 12,
    period: "month",
    desc: "For engineers actively leveling up their careers.",
    features: [
      "Unlimited analyses",
      "Full personalized roadmap",
      "Market intelligence per skill",
      "Peer benchmarking",
      "PDF export + shareable link",
      "ATS keyword optimizer",
      "Progress tracker (Learning / Done)",
      "Resume strength score",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
    icon: Zap,
  },
  {
    id: "teams",
    name: "Teams",
    price: 49,
    period: "month",
    desc: "For engineering teams and hiring managers.",
    features: [
      "5 seats included",
      "Everything in Pro",
      "Shared team dashboard",
      "API access",
      "Resume vault (team)",
      "Analytics dashboard",
      "Slack integration",
    ],
    cta: "Start Team Trial",
    highlighted: false,
    icon: Users,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    period: "custom",
    desc: "For companies scaling technical hiring and L&D.",
    features: [
      "Unlimited seats",
      "On-prem deployment option",
      "SSO (SAML/OIDC)",
      "Custom skill taxonomy",
      "ATS integrations",
      "SLA & uptime guarantees",
      "24/7 dedicated support",
    ],
    cta: "Contact Sales",
    highlighted: false,
    icon: Building2,
  },
];

const COMPARISON = [
  {
    feature: "Analyses / month",
    free: "1",
    pro: "Unlimited",
    teams: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Skill gap report",
    free: "Basic",
    pro: "Full + confidence",
    teams: "Full + confidence",
    enterprise: "Full + confidence",
  },
  {
    feature: "Roadmap generation",
    free: "❌",
    pro: "✅",
    teams: "✅",
    enterprise: "✅",
  },
  {
    feature: "Market intelligence",
    free: "❌",
    pro: "✅",
    teams: "✅",
    enterprise: "✅",
  },
  {
    feature: "Peer benchmarking",
    free: "❌",
    pro: "✅",
    teams: "✅",
    enterprise: "✅",
  },
  {
    feature: "PDF export",
    free: "❌",
    pro: "✅",
    teams: "✅",
    enterprise: "✅",
  },
  {
    feature: "ATS optimizer",
    free: "❌",
    pro: "✅",
    teams: "✅",
    enterprise: "✅",
  },
  {
    feature: "Progress tracker",
    free: "❌",
    pro: "✅",
    teams: "✅",
    enterprise: "✅",
  },
  {
    feature: "Team dashboard",
    free: "❌",
    pro: "❌",
    teams: "✅",
    enterprise: "✅",
  },
  {
    feature: "API access",
    free: "❌",
    pro: "❌",
    teams: "✅",
    enterprise: "✅",
  },
  { feature: "SSO", free: "❌", pro: "❌", teams: "❌", enterprise: "✅" },
  { feature: "On-prem", free: "❌", pro: "❌", teams: "❌", enterprise: "✅" },
];

const FAQS = [
  {
    q: "Is the free plan really free forever?",
    a: "Yes. The Free plan has no time limit. You get 3 analyses per month, every month.",
  },
  {
    q: "Does GapMiner share my resume data?",
    a: "No. We use local AI models (Ollama). Your resume data is encrypted and never shared with external API providers like OpenAI.",
  },
  {
    q: "How accurate is the gap analysis?",
    a: 'Our benchmark shows 94% precision. We use advanced semantic embeddings to understand the "meaning" of skills, not just keyword matching.',
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel anytime from your account settings. No cancellation fees, no questions asked.",
  },
];

export default function PricingPage() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") {
      navigate("/auth?mode=signup");
      return;
    }

    if (!user || !token) {
      navigate(`/auth?mode=signup&plan=${planId}`);
      return;
    }

    setLoadingPlan(planId);
    try {
      const response = await fetch("/api/v1/payments/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      const data = await safeReadJson<any>(response, {});
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout session");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="mesh-bg">
      <div className="px-6 pb-20 pt-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 animate-fade-in text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-primary">
              Pricing
            </span>
            <h1 className="mt-4 font-headline text-5xl font-extrabold leading-tight tracking-tighter lg:text-7xl">
              Simple, Transparent <br />
              <span className="text-gradient">Career Intelligence</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl font-light leading-relaxed text-on-surface-variant">
              Choose the plan that fits your career stage. No hidden fees,
              cancel anytime.
            </p>
          </div>

          <div className="mb-32 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`glass-card relative flex flex-col p-6 sm:p-8 transition duration-300 hover:-translate-y-1 ${
                  plan.highlighted
                    ? "border-primary/40 ring-2 ring-primary/10"
                    : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full primary-gradient px-4 py-1 text-xs font-bold uppercase tracking-widest text-on-primary-fixed">
                    Most Popular
                  </div>
                )}
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-high text-primary">
                  <plan.icon size={24} />
                </div>
                <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
                <div className="mb-4">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-4xl font-bold tracking-tighter ${plan.highlighted ? "text-gradient" : ""}`}
                      >
                        ${plan.price}
                      </span>
                      <span className="text-sm text-outline">
                        /{plan.period}
                      </span>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold tracking-tighter">
                      Custom
                    </div>
                  )}
                </div>
                <p className="mb-8 flex-grow text-sm font-light leading-relaxed text-on-surface-variant">
                  {plan.desc}
                </p>
                <ul className="mb-8 flex-grow space-y-4">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-sm text-on-surface-variant"
                    >
                      <CheckCircle
                        className="mt-0.5 shrink-0 text-primary"
                        size={16}
                      />
                      <span className="leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.id === "enterprise" ? (
                  <Link
                    to="/contact"
                    className="glass-card flex w-full items-center justify-center gap-2 rounded-full py-4 text-center font-bold transition hover:border-primary/30"
                  >
                    {plan.cta}
                    <ArrowRight
                      className="transition-transform group-hover:translate-x-1"
                      size={18}
                    />
                  </Link>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loadingPlan !== null}
                    className={`flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold transition disabled:opacity-50 ${
                      plan.highlighted
                        ? "primary-gradient text-on-primary-fixed shadow-lg shadow-primary/25 hover:shadow-primary/40"
                        : "glass-card hover:border-primary/30"
                    }`}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          <section className="mb-32">
            <div className="mb-16 text-center">
              <h2 className="font-headline text-4xl font-bold tracking-tight">
                Full Feature Comparison
              </h2>
              <p className="mt-2 font-light text-on-surface-variant">
                Deep dive into every capability across our tiers.
              </p>
            </div>
            <div className="glass-card overflow-hidden rounded-[2rem]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-high">
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-sm font-bold uppercase tracking-widest text-outline">
                        Capability
                      </th>
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-center text-sm font-bold uppercase tracking-widest text-outline">
                        Free
                      </th>
                      <th className="border-x border-primary/10 bg-primary/5 px-4 sm:px-8 py-4 sm:py-6 text-center text-sm font-bold uppercase tracking-widest text-primary">
                        Pro
                      </th>
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-center text-sm font-bold uppercase tracking-widest text-outline">
                        Teams
                      </th>
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-center text-sm font-bold uppercase tracking-widest text-outline">
                        Enterprise
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-on-surface-variant">
                    {COMPARISON.map((row) => (
                      <tr
                        key={row.feature}
                        className="transition-colors hover:bg-primary/5"
                      >
                        <td className="px-4 sm:px-8 py-4 sm:py-6 font-medium text-on-surface">
                          {row.feature}
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-6 text-center">{row.free}</td>
                        <td className="border-x border-primary/10 bg-primary/[0.03] px-4 sm:px-8 py-4 sm:py-6 text-center font-bold text-on-surface">
                          {row.pro}
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-6 text-center">{row.teams}</td>
                        <td className="px-4 sm:px-8 py-4 sm:py-6 text-center">
                          {row.enterprise}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HelpCircle size={24} />
              </div>
              <h2 className="font-headline text-3xl font-bold">
                Have Questions?
              </h2>
              <p className="mt-2 font-light text-on-surface-variant">
                Everything you need to know about our service.
              </p>
            </div>
            <div className="grid gap-4">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="glass-card p-6 sm:p-8 transition hover:border-primary/30"
                >
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {faq.q}
                  </h3>
                  <p className="font-light leading-relaxed text-on-surface-variant">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center text-sm text-outline">
              Still have questions?{" "}
              <Link to="/contact" className="text-primary hover:underline">
                Contact our support team →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
