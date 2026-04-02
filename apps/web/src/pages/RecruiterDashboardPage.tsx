import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  BarChart4,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Zap,
  Briefcase,
  Globe,
  Shield,
  RefreshCcw,
  MoreHorizontal,
  Mail,
  Calendar,
  Download,
  FilterX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

// ── Shared Types ──────────────────────────────────────────
interface Stat {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}

interface Candidate {
  id: string;
  name: string;
  role: string;
  matchScore: number;
  status: string;
  lastActive: string;
  skills: string[];
}

export default function RecruiterDashboardPage() {
  const [activeTab, setActiveTab] = useState("ranking");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  // ── Fetch Data ──────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const [statsRes, candidatesRes] = await Promise.all([
          fetch("http://localhost:3001/api/v1/recruiter/stats", { headers }),
          fetch("http://localhost:3001/api/v1/recruiter/candidates", {
            headers,
          }),
        ]);

        if (!statsRes.ok || !candidatesRes.ok)
          throw new Error("Failed to fetch dashboard intelligence");

        const statsData = await statsRes.json();
        const candidatesData = await candidatesRes.json();

        setStats(statsData);
        setCandidates(candidatesData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (token) fetchData();
  }, [token]);

  const statCards: Stat[] = [
    {
      label: "Active Pipeline",
      value: stats?.activeJobs || "12",
      icon: Briefcase,
      color: "primary",
    },
    {
      label: "Talent Pool",
      value: stats?.totalCandidates?.toLocaleString() || "4,281",
      icon: Users,
      color: "tertiary",
    },
    {
      label: "Match Confidence",
      value: `${stats?.avgMatchScore || "78.5"}%`,
      icon: Zap,
      color: "success",
    },
    {
      label: "Hiring Velocity",
      value: stats?.hiringVelocity || "14 days",
      icon: TrendingUp,
      color: "info",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-surface-container-low p-8 font-body overflow-hidden">
      {/* ── Header Area ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-black tracking-tight skew-x-[-2deg] flex items-center gap-3">
            Talent Intelligence{" "}
            <span className="text-primary italic">Enterprise</span>
            <div className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md text-[9px] uppercase tracking-tighter italic">
              V3.4 CORE
            </div>
          </h1>
          <p className="text-on-surface-variant font-black text-[10px] uppercase tracking-[0.3em] mt-3 opacity-60">
            Strategic Aggregate Bench Strength & Dynamic Benchmarking
          </p>
        </motion.div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-2 opacity-50">
              <RefreshCcw size={12} className="animate-spin text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Hydrating intelligence...
              </span>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 bg-surface-container/50 px-4 py-2.5 rounded-2xl border border-outline-variant/10 shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Worker status: Synchronized
              </span>
            </motion.div>
          )}
          <button className="btn btn-primary px-8 py-3.5 rounded-2xl shadow-2xl shadow-primary/30 active:scale-95">
            <Download size={14} />
            Export Aggregate Report
          </button>
        </div>
      </div>

      {/* ── Executive HUD ──────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            className="card group hover:border-primary/40 relative overflow-hidden"
          >
            {/* Subtle background glow on hover */}
            <div className="absolute -inset-10 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center justify-between mb-5 relative z-10">
              <div
                className={`p-2.5 rounded-xl bg-${stat.color}/10 flex items-center justify-center text-${stat.color} border border-${stat.color}/10`}
              >
                <stat.icon size={20} />
              </div>
              <div className="text-success flex items-center gap-1 text-[10px] font-black">
                +12.4% <TrendingUp size={12} />
              </div>
            </div>
            <div className="text-3xl font-black tracking-tight relative z-10">
              {stat.value}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-outline mt-1.5 relative z-10 opacity-70">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Main Operations View ────────────────────────────── */}
      <div className="flex-grow flex gap-8 overflow-hidden items-stretch">
        {/* Left: Interactive Talent Matrix */}
        <div className="flex-grow flex flex-col glass bg-white/70 p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl overflow-hidden backdrop-blur-3xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 p-1 bg-surface-container/40 rounded-[1.25rem] border border-outline-variant/10">
              {["Talent Ranking", "Skill Dense", "Bench Map"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t.toLowerCase().split(" ")[0])}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all",
                    activeTab === t.toLowerCase().split(" ")[0]
                      ? "bg-white text-primary shadow-lg shadow-black/5 ring-1 ring-outline-variant/10"
                      : "text-outline hover:text-on-surface",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
                />
                <input
                  className="bg-surface-container/40 rounded-2xl pl-11 pr-6 py-2.5 text-[11px] font-medium outline-none border border-outline-variant/10 focus:border-primary focus:bg-white transition-all w-64"
                  placeholder="Query semantic talent clusters..."
                />
              </div>
              <button className="p-2.5 rounded-2xl bg-surface-container/50 border border-outline-variant/10 text-outline hover:text-on-surface transition-all">
                <FilterX size={16} />
              </button>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 -mr-4">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="h-10">
                  <th className="text-[10px] font-black uppercase tracking-widest text-outline pl-4 opacity-50">
                    Identity Segment
                  </th>
                  <th className="text-[10px] font-black uppercase tracking-widest text-outline opacity-50">
                    Match Fidelity
                  </th>
                  <th className="text-[10px] font-black uppercase tracking-widest text-outline opacity-50">
                    Stack Dominance
                  </th>
                  <th className="text-[10px] font-black uppercase tracking-widest text-outline opacity-50">
                    Status Pipeline
                  </th>
                  <th className="pr-4"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {candidates.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group relative cursor-pointer"
                    >
                      <td className="py-5 pl-4 bg-surface-container/20 group-hover:bg-surface-container/60 transition-all rounded-l-[1.5rem] border-y border-l border-outline-variant/5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-black text-lg relative overflow-hidden">
                            <div className="absolute inset-0 primary-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-[13px] font-black tracking-tight text-on-surface">
                              {c.name}
                            </div>
                            <div className="text-[9px] font-bold text-outline uppercase tracking-wider flex items-center gap-2 mt-1">
                              {c.role}
                              <Globe size={10} className="text-primary/40" />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 bg-surface-container/20 group-hover:bg-surface-container/60 transition-all border-y border-outline-variant/5">
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-1.5 bg-surface-container rounded-full overflow-hidden border border-outline-variant/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${c.matchScore}%` }}
                              className={cn(
                                "h-full",
                                c.matchScore > 85
                                  ? "bg-success"
                                  : c.matchScore > 70
                                    ? "bg-primary"
                                    : "bg-warning",
                              )}
                            />
                          </div>
                          <span className="text-[11px] font-black tracking-tighter opacity-80">
                            {c.matchScore}%
                          </span>
                        </div>
                      </td>
                      <td className="py-5 bg-surface-container/20 group-hover:bg-surface-container/60 transition-all border-y border-outline-variant/5">
                        <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                          {(c.skills || []).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded-md bg-white border border-outline-variant/10 text-[8px] font-black uppercase tracking-tighter text-outline group-hover:border-primary/20 transition-colors"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-5 bg-surface-container/20 group-hover:bg-surface-container/60 transition-all border-y border-outline-variant/5">
                        <div
                          className={cn(
                            "px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-[0.1em] border inline-flex items-center gap-1.5",
                            c.status === "Hired"
                              ? "bg-success/10 border-success/30 text-success"
                              : c.status === "Interview"
                                ? "bg-warning/10 border-warning/30 text-warning"
                                : "bg-primary/10 border-primary/30 text-primary",
                          )}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          {c.status}
                        </div>
                      </td>
                      <td className="py-5 pr-4 bg-surface-container/20 group-hover:bg-surface-container/60 transition-all rounded-r-[1.5rem] border-y border-r border-outline-variant/5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                          <button className="p-2.5 rounded-xl bg-white shadow-sm border border-outline-variant/10 hover:border-primary transition-all">
                            <Mail size={14} className="text-outline" />
                          </button>
                          <button className="p-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 transition-all">
                            <ArrowUpRight size={14} />
                          </button>
                        </div>
                      </td>

                      {/* Animated Beam Border (1px) requested in system prompts */}
                      <motion.div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {!loading && candidates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                        <Filter size={40} />
                        <p className="text-xs font-black uppercase tracking-widest leading-relaxed">
                          No talent clusters found in selected parameters
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Content: AI Insights & Pipeline Monitor */}
        <aside className="w-96 flex flex-col gap-8 shrink-0">
          {/* Skill Density Insight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass bg-[#121214] p-10 rounded-[2.5rem] border border-white/5 text-white shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
              <Cpu
                size={140}
                className="group-hover:scale-110 transition-transform duration-700"
              />
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
                <Zap size={14} className="text-primary" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white">
                Scarcity Analytics
              </h3>
            </div>

            <div className="space-y-7 relative z-10">
              {[
                { skill: "Rust Concurrency", scarcity: 92, trend: "up" },
                { skill: "Edge Computing", scarcity: 78, trend: "up" },
                {
                  skill: "Blockchain Architecture",
                  scarcity: 86,
                  trend: "stable",
                },
              ].map((s) => (
                <div key={s.skill} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-white/50">
                      {s.skill}
                    </span>
                    <span className="text-[9px] font-black text-primary px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/10 uppercase tracking-tighter">
                      Critical
                    </span>
                  </div>
                  <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.scarcity}%` }}
                      className="h-full primary-gradient"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-3xl relative z-10 backdrop-blur-md">
              <p className="text-[10px] text-white/40 leading-relaxed font-black uppercase tracking-widest italic flex items-start gap-2">
                <Shield size={12} className="shrink-0 mt-0.5 text-primary" />
                "Strategic deficiency detected in systems engineering. Recommend
                immediate bench hydration."
              </p>
              <button className="w-full mt-6 py-3.5 bg-primary text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
                Initiate Talent Sync
              </button>
            </div>
          </motion.div>

          {/* Pipeline Agent Log */}
          <div className="card bg-white/80 p-8 rounded-[2.5rem] shadow-xl flex-grow overflow-hidden relative">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-outline opacity-60">
                Agent Pipeline
              </h3>
              <MoreHorizontal
                size={14}
                className="text-outline cursor-pointer"
              />
            </div>

            <div className="space-y-6 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {[
                { label: "Parsing Resumes", status: "Active", time: "2m ago" },
                {
                  label: "Cross-matching Skills",
                  status: "Queued",
                  time: "Waiting",
                },
                {
                  label: "Latency Calibration",
                  status: "Completed",
                  time: "12m ago",
                },
                {
                  label: "Talent Ranking Engine",
                  status: "Calibrated",
                  time: "1s ago",
                },
              ].map((log, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-black text-on-surface">
                        {log.label}
                      </div>
                      <div className="text-[8px] font-bold text-outline">
                        {log.time}
                      </div>
                    </div>
                    <div className="text-[9px] text-on-surface-variant font-medium mt-1 leading-relaxed opacity-60">
                      Status: {log.status}
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-outline-variant/10">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary cursor-pointer hover:gap-2 transition-all">
                  View All Calibration Logs <ArrowUpRight size={14} />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 10px; }
        .backdrop-blur-3xl { backdrop-filter: blur(60px); }
      `}</style>
    </div>
  );
}
