import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Building2,
  MapPin,
  Briefcase,
  Calculator,
  MessageSquare,
  FileText,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";

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

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tighter mb-2">
          Negotiation Companion
        </h1>
        <p className="text-on-surface-variant">
          Data-driven salary negotiation strategy powered by market intelligence
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="glass p-6 rounded-3xl border border-outline-variant/10">
              <h2 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-primary" />
                Target Role
              </h2>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary"
                  value={formData.roleTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, roleTitle: e.target.value })
                  }
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Location"
                    className="bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder="Years Exp"
                    className="bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary"
                    value={formData.yearsExperience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearsExperience: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <input
                  type="text"
                  placeholder="Target Company (optional)"
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="glass p-6 rounded-3xl border border-outline-variant/10">
              <h2 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <DollarSign size={16} className="text-primary" />
                Current Offer
              </h2>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-outline mb-1 block">
                      Base Salary
                    </label>
                    <input
                      type="number"
                      placeholder="150000"
                      className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary"
                      value={formData.currentOffer.base || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentOffer: {
                            ...formData.currentOffer,
                            base: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-outline mb-1 block">
                      Bonus
                    </label>
                    <input
                      type="number"
                      placeholder="20000"
                      className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary"
                      value={formData.currentOffer.bonus || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentOffer: {
                            ...formData.currentOffer,
                            bonus: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-outline mb-1 block">
                      Annual Stock
                    </label>
                    <input
                      type="number"
                      placeholder="50000"
                      className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary"
                      value={formData.currentOffer.stock || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentOffer: {
                            ...formData.currentOffer,
                            stock: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-outline mb-1 block">
                      Signing Bonus
                    </label>
                    <input
                      type="number"
                      placeholder="25000"
                      className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary"
                      value={formData.currentOffer.signing || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentOffer: {
                            ...formData.currentOffer,
                            signing: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                {formData.currentOffer.base > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-surface-container-highest border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-outline">
                        Total Compensation
                      </span>
                      <span className="text-xl font-black text-primary">
                        {formatCurrency(calculateTotal(formData.currentOffer))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 rounded-xl bg-surface-container-high cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                checked={formData.hasCompetingOffer}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hasCompetingOffer: e.target.checked,
                  })
                }
              />
              <span className="text-sm font-medium">
                I have a competing offer
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !formData.roleTitle || !formData.location}
              className="w-full py-4 rounded-xl primary-gradient font-black text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Target size={18} />
                  Generate Strategy
                </>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {strategy ? (
            <div className="space-y-6">
              <div className="flex gap-2 p-1 bg-surface-container-high rounded-xl">
                {(["overview", "tactics", "data"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      activeTab === tab
                        ? "bg-primary text-on-primary-fixed shadow-md"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="glass p-5 rounded-2xl border border-outline-variant/10">
                      <div className="text-[10px] font-black uppercase text-outline mb-2">
                        Opening Ask
                      </div>
                      <div className="text-2xl font-black text-tertiary">
                        {formatCurrency(strategy.openingAnchor)}
                      </div>
                    </div>
                    <div className="glass p-5 rounded-2xl border border-outline-variant/10">
                      <div className="text-[10px] font-black uppercase text-outline mb-2">
                        Target
                      </div>
                      <div className="text-2xl font-black text-primary">
                        {formatCurrency(strategy.targetNumber)}
                      </div>
                    </div>
                    <div className="glass p-5 rounded-2xl border border-outline-variant/10">
                      <div className="text-[10px] font-black uppercase text-outline mb-2">
                        Walk Away
                      </div>
                      <div className="text-2xl font-black text-error">
                        {formatCurrency(strategy.walkAwayPoint)}
                      </div>
                    </div>
                  </div>

                  <div className="glass p-6 rounded-3xl border border-outline-variant/10">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                      <TrendingUp size={16} className="text-primary" />
                      Expected Improvement
                    </h3>
                    <div className="text-3xl font-black primary-gradient bg-clip-text text-transparent">
                      {strategy.estimatedImprovement}
                    </div>
                  </div>

                  <div className="glass p-6 rounded-3xl border border-outline-variant/10">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-4">
                      Key Negotiation Levers
                    </h3>
                    <div className="space-y-3">
                      {strategy.keyNegotiationLevers.map((lever, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-high"
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 ${
                              lever.priority === "high"
                                ? "bg-primary"
                                : lever.priority === "medium"
                                  ? "bg-tertiary"
                                  : "bg-outline"
                            }`}
                          />
                          <div>
                            <div className="font-bold text-sm">
                              {lever.lever}
                            </div>
                            <div className="text-xs text-on-surface-variant">
                              {lever.impact}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {strategy.competingOfferStrategy.shouldUse && (
                    <div className="glass p-6 rounded-3xl border border-tertiary/20 bg-tertiary/5">
                      <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FileText size={16} className="text-tertiary" />
                        Competing Offer Strategy
                      </h3>
                      <p className="text-sm mb-4">
                        {strategy.competingOfferStrategy.howToPresent}
                      </p>
                      <div className="space-y-2">
                        <div className="text-xs font-black uppercase text-outline">
                          Risks to Consider
                        </div>
                        {strategy.competingOfferStrategy.risks.map(
                          (risk, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs text-on-surface-variant"
                            >
                              <AlertTriangle
                                size={12}
                                className="text-warning"
                              />
                              {risk}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "tactics" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MessageSquare size={16} className="text-primary" />
                    Talking Points
                  </h3>

                  {strategy.talkingPoints.map((item, idx) => (
                    <div
                      key={idx}
                      className="glass p-5 rounded-2xl border border-outline-variant/10"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            item.timing === "early"
                              ? "bg-error/20 text-error"
                              : item.timing === "mid"
                                ? "bg-warning/20 text-warning"
                                : "bg-success/20 text-success"
                          }`}
                        >
                          {item.timing}
                        </span>
                      </div>
                      <div className="font-bold text-sm mb-2">{item.point}</div>
                      <div className="text-xs text-on-surface-variant flex items-start gap-2">
                        <CheckCircle
                          size={12}
                          className="text-primary mt-0.5 shrink-0"
                        />
                        {item.dataSupport}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "data" && benchmarks.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Calculator size={16} className="text-primary" />
                    Market Benchmarks
                  </h3>

                  {benchmarks.map((bench, idx) => (
                    <div
                      key={idx}
                      className="glass p-5 rounded-2xl border border-outline-variant/10"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Building2 size={16} className="text-primary" />
                          <span className="font-bold text-sm">
                            {bench.tier.toUpperCase()} Companies
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-outline">
                          n={bench.sampleSize}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-[10px] font-black uppercase text-outline mb-1">
                            Base Range
                          </div>
                          <div className="text-sm font-bold">
                            {formatCurrency(bench.minSalary)} -{" "}
                            {formatCurrency(bench.maxSalary)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase text-outline mb-1">
                            Median Base
                          </div>
                          <div className="text-sm font-bold text-primary">
                            {formatCurrency(bench.medianSalary)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase text-outline mb-1">
                            Total Comp
                          </div>
                          <div className="text-sm font-bold">
                            {formatCurrency(bench.totalCompMedian)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="glass p-12 rounded-3xl border border-outline-variant/10 text-center">
              <div className="w-20 h-20 rounded-full bg-surface-container-high mx-auto mb-6 flex items-center justify-center">
                <Target size={32} className="text-outline" />
              </div>
              <h3 className="text-xl font-black mb-2">Ready to Negotiate?</h3>
              <p className="text-on-surface-variant text-sm max-w-md mx-auto">
                Enter your target role, location, and offer details to get a
                personalized negotiation strategy backed by real market data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
