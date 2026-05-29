import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle,
  Briefcase,
  Calculator,
  MessageSquare,
  FileText,
  Loader2,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Badge,
  Input,
  EmptyState,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface OfferData {
  base: number;
  bonus: number;
  stock: number;
  signing: number;
}

interface Benchmark {
  tier: string;
  roleTitle: string;
  location: string;
  minSalary: number;
  medianSalary: number;
  maxSalary: number;
  totalCompMin: number;
  totalCompMedian: number;
  totalCompMax: number;
  yearsExperience: string;
  sampleSize: number;
}

interface Strategy {
  openingAnchor: number;
  targetNumber: number;
  walkAwayPoint: number;
  keyNegotiationLevers: Array<{
    lever: string;
    impact: string;
    priority: string;
  }>;
  talkingPoints: Array<{
    point: string;
    dataSupport: string;
    timing: string;
  }>;
  competingOfferStrategy: {
    shouldUse: boolean;
    howToPresent: string;
    risks: string[];
  };
  estimatedImprovement: string;
}

export default function NegotiationCompanionPage() {
  const [formData, setFormData] = useState({
    roleTitle: "",
    location: "",
    yearsExperience: 3,
    companyName: "",
    currentOffer: {
      base: 0,
      bonus: 0,
      stock: 0,
      signing: 0,
    } as OfferData,
    hasCompetingOffer: false,
  });

  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "tactics" | "data">(
    "overview",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/v1/negotiation/strategy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          ...formData,
          currentOffer:
            formData.currentOffer.base > 0 ? formData.currentOffer : null,
          competingOffers: formData.hasCompetingOffer
            ? [formData.currentOffer]
            : [],
        }),
      });

      const data = await response.json();
      setStrategy(data.strategy);
      setBenchmarks(data.benchmarks || []);
    } catch (err) {
      console.error("Failed to generate strategy:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);

  const calculateTotal = (offer: OfferData) =>
    offer.base + offer.bonus + offer.stock + offer.signing;

  const timingTone = (timing: string): "error" | "warning" | "success" => {
    if (timing === "early") return "error";
    if (timing === "mid") return "warning";
    return "success";
  };

  return (
    <PageShell maxWidth="xl">
      <OnboardingTooltip
        pageKey="negotiate"
        icon="💰"
        title="Research market salary data"
        description="View compensation benchmarks for your role and location. Practice your negotiation strategy."
      />

      <PageHeader
        badge="Compensation"
        title="Negotiation Companion"
        description="Data-driven salary negotiation strategy powered by market intelligence."
        icon={<DollarSign className="h-6 w-6" />}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card padding="md">
              <div className="mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                  Target Role
                </h2>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.roleTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, roleTitle: e.target.value })
                  }
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Years Exp"
                    value={formData.yearsExperience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearsExperience: parseInt(e.target.value, 10),
                      })
                    }
                    required
                  />
                </div>

                <Input
                  placeholder="Target Company (optional)"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                />
              </div>
            </Card>

            <Card padding="md">
              <div className="mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                  Current Offer
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Base Salary"
                  type="number"
                  placeholder="150000"
                  value={formData.currentOffer.base || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currentOffer: {
                        ...formData.currentOffer,
                        base: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                />
                <Input
                  label="Bonus"
                  type="number"
                  placeholder="20000"
                  value={formData.currentOffer.bonus || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currentOffer: {
                        ...formData.currentOffer,
                        bonus: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                />
                <Input
                  label="Annual Stock"
                  type="number"
                  placeholder="50000"
                  value={formData.currentOffer.stock || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currentOffer: {
                        ...formData.currentOffer,
                        stock: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                />
                <Input
                  label="Signing Bonus"
                  type="number"
                  placeholder="25000"
                  value={formData.currentOffer.signing || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currentOffer: {
                        ...formData.currentOffer,
                        signing: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                />
              </div>

              {formData.currentOffer.base > 0 && (
                <div className="mt-4 rounded-xl border border-primary/25 bg-primary/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-outline">
                      Total Compensation
                    </span>
                    <span className="text-xl font-black text-primary">
                      {formatCurrency(calculateTotal(formData.currentOffer))}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-outline-variant/40 bg-surface-container text-primary focus:ring-primary/30"
                checked={formData.hasCompetingOffer}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hasCompetingOffer: e.target.checked,
                  })
                }
              />
              <span className="text-sm font-medium text-on-surface">
                I have a competing offer
              </span>
            </label>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading || !formData.roleTitle || !formData.location}
              loading={loading}
            >
              {!loading && <Target className="h-5 w-5" />}
              Generate Strategy
            </Button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {strategy ? (
            <div className="space-y-6">
              <div className="flex gap-1 rounded-xl border border-outline-variant/15 bg-surface-container-low p-1">
                {(["overview", "tactics", "data"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all",
                      activeTab === tab
                        ? "primary-gradient text-on-primary-fixed shadow-md"
                        : "text-on-surface-variant hover:text-on-surface",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card padding="md">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                        Opening Ask
                      </p>
                      <p className="mt-2 text-2xl font-black text-amber-400">
                        {formatCurrency(strategy.openingAnchor)}
                      </p>
                    </Card>
                    <Card padding="md" className="border-primary/25">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                        Target
                      </p>
                      <p className="mt-2 text-2xl font-black text-primary">
                        {formatCurrency(strategy.targetNumber)}
                      </p>
                    </Card>
                    <Card padding="md">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                        Walk Away
                      </p>
                      <p className="mt-2 text-2xl font-black text-error">
                        {formatCurrency(strategy.walkAwayPoint)}
                      </p>
                    </Card>
                  </div>

                  <Card padding="md">
                    <div className="mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                        Expected Improvement
                      </h3>
                    </div>
                    <p className="text-3xl font-black primary-gradient bg-clip-text text-transparent">
                      {strategy.estimatedImprovement}
                    </p>
                  </Card>

                  <Card padding="md">
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-on-surface">
                      Key Negotiation Levers
                    </h3>
                    <div className="space-y-3">
                      {strategy.keyNegotiationLevers.map((lever, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-xl bg-surface-container-low p-3"
                        >
                          <div
                            className={cn(
                              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                              lever.priority === "high"
                                ? "bg-primary"
                                : lever.priority === "medium"
                                  ? "bg-amber-400"
                                  : "bg-outline",
                            )}
                          />
                          <div>
                            <p className="text-sm font-bold text-on-surface">{lever.lever}</p>
                            <p className="text-xs text-on-surface-variant">{lever.impact}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {strategy.competingOfferStrategy.shouldUse && (
                    <Card padding="md" className="border-amber-500/25 bg-amber-500/5">
                      <div className="mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                          Competing Offer Strategy
                        </h3>
                      </div>
                      <p className="mb-4 text-sm text-on-surface-variant">
                        {strategy.competingOfferStrategy.howToPresent}
                      </p>
                      <p className="mb-2 text-xs font-bold uppercase text-outline">
                        Risks to Consider
                      </p>
                      <ul className="space-y-2">
                        {strategy.competingOfferStrategy.risks.map((risk, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-xs text-on-surface-variant"
                          >
                            <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === "tactics" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                      Talking Points
                    </h3>
                  </div>

                  {strategy.talkingPoints.map((item, idx) => (
                    <Card key={idx} padding="md">
                      <Badge tone={timingTone(item.timing)} className="mb-2">
                        {item.timing}
                      </Badge>
                      <p className="mb-2 text-sm font-bold text-on-surface">{item.point}</p>
                      <p className="flex items-start gap-2 text-xs text-on-surface-variant">
                        <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                        {item.dataSupport}
                      </p>
                    </Card>
                  ))}
                </div>
              )}

              {activeTab === "data" && benchmarks.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                      Market Benchmarks
                    </h3>
                  </div>

                  {benchmarks.map((bench, idx) => (
                    <Card key={idx} padding="md">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-bold text-on-surface">
                          {bench.tier.toUpperCase()} Companies
                        </span>
                        <Badge tone="default">n={bench.sampleSize}</Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-outline">Base Range</p>
                          <p className="mt-1 text-sm font-bold text-on-surface">
                            {formatCurrency(bench.minSalary)} – {formatCurrency(bench.maxSalary)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-outline">
                            Median Base
                          </p>
                          <p className="mt-1 text-sm font-bold text-primary">
                            {formatCurrency(bench.medianSalary)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-outline">
                            Total Comp
                          </p>
                          <p className="mt-1 text-sm font-bold text-on-surface">
                            {formatCurrency(bench.totalCompMedian)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Target className="h-8 w-8" />}
              title="Ready to Negotiate?"
              description="Enter your target role, location, and offer details to get a personalized negotiation strategy backed by real market data."
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
