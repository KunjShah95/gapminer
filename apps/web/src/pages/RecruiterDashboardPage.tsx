import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Filter,
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
  Download,
  FilterX,
  Upload,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { getAuthToken } from "@/lib/authFetch";

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

interface ShortlistResult {
  applicationId: string;
  candidateId: string;
  name: string;
  email?: string;
  matchScore: number;
  status: string;
  skills?: string[];
  parsedData?: any;
}

interface UploadModal {
  jobId: string;
  jobTitle: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  status: string;
  _count?: { applications: number };
}

export default function RecruiterDashboardPage() {
  const [activeTab, setActiveTab] = useState("ranking");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState<UploadModal | null>(null);
  const [shortlistResults, setShortlistResults] = useState<ShortlistResult[]>([]);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [shortlistError, setShortlistError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(60);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobApplications, setJobApplications] = useState<ShortlistResult[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = useAuthStore((state) => state.token);

  // ── Fetch Data ──────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const headers = {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        };

        const [statsRes, candidatesRes, jobsRes] = await Promise.all([
          fetch("/api/v1/recruiter/stats", { headers }),
          fetch("/api/v1/recruiter/candidates", { headers }),
          fetch("/api/v1/recruiter/jobs", { headers }),
        ]);

        if (!statsRes.ok || !candidatesRes.ok || !jobsRes.ok) {
          const errorDetails = await Promise.all([
            statsRes.text().catch(() => ""),
            candidatesRes.text().catch(() => ""),
            jobsRes.text().catch(() => ""),
          ]);
          throw new Error(
            `Failed to fetch dashboard intelligence: ${errorDetails.filter(Boolean).join(", ") || "Check your role permissions"}`,
          );
        }

        const statsData = await statsRes.json().catch(() => null);
        const candidatesData = await candidatesRes.json().catch(() => []);
        const jobsData = await jobsRes.json().catch(() => []);

        setStats(statsData);
        setCandidates(candidatesData);
        setJobs(jobsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (token) fetchData();
  }, [token]);

  useEffect(() => {
    if (selectedJob) {
      fetchJobApplications(selectedJob.id);
    }
  }, [selectedJob]);

  // ─── Run Shortlist ──────────────────────────────────────────
  async function runShortlist(jobId: string) {
    setShortlistLoading(true);
    setShortlistError(null);
    setShortlistResults([]);
    try {
      const res = await fetch(`/api/v1/recruiter/jobs/${jobId}/shortlist`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ matchThreshold: threshold }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setShortlistResults(data.shortlisted || []);
      
      // Refresh current job details if open
      if (selectedJob && selectedJob.id === jobId) {
        fetchJobApplications(jobId);
      }
    } catch (err: any) {
      setShortlistError(err.message);
    } finally {
      setShortlistLoading(false);
    }
  }

  // ─── Fetch Job Applications ──────────────────────────────────
  async function fetchJobApplications(jobId: string) {
    setApplicationsLoading(true);
    try {
      const res = await fetch(`/api/v1/recruiter/jobs/${jobId}/shortlist`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setJobApplications(data.candidates || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplicationsLoading(false);
    }
  }

  // ─── Bulk Upload ───────────────────────────────────────────
  async function handleBulkUpload(jobId: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    setShortlistLoading(true);
    setShortlistError(null);
    try {
      const formData = new FormData();
      formData.append("jobId", jobId);
      Array.from(files).forEach((f) => formData.append("resumes", f));
      const res = await fetch("/api/v1/recruiter/bulk-upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // Refresh jobs to show updated applicant counts
      const jobsRes = await fetch("/api/v1/recruiter/jobs", { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (jobsRes.ok) setJobs(await jobsRes.json());
      setShowUploadModal(null);
      alert(`Uploaded ${data.candidates?.length || 0} resumes. Now run shortlist to score them.`);
    } catch (err: any) {
      setShortlistError(err.message);
    } finally {
      setShortlistLoading(false);
    }
  }

  const statCards: Stat[] = [
    {
      label: "Open Job Positions",
      value: stats?.activeJobs || "0",
      icon: Briefcase,
      color: "primary",
    },
    {
      label: "Total Candidates",
      value: stats?.totalCandidates?.toLocaleString() || "0",
      icon: Users,
      color: "tertiary",
    },
    {
      label: "Avg Match Score",
      value: `${stats?.avgMatchScore || "0"}%`,
      icon: Zap,
      color: "success",
    },
    {
      label: "Interviews Scheduled",
      value: stats?.interviewsScheduled || "0",
      icon: CheckCircle,
      color: "info",
    },
  ];

  async function createJob(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      company: formData.get("company"),
      location: formData.get("location"),
      description: formData.get("description"),
    };

    try {
      setLoading(true);
      const res = await fetch("/api/v1/recruiter/jobs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(await res.text());
      
      const newJob = await res.json();
      setJobs([newJob, ...jobs]);
      setShowNewJobModal(false);
      
      // Update stats
      const statsRes = await fetch("/api/v1/recruiter/stats", { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (statsRes.ok) setStats(await statsRes.json());
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
            Recruiter <span className="text-primary italic">Intelligence</span>{" "}
            Hub
            <div className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md text-[9px] uppercase tracking-tighter italic">
              AI Powered Hiring
            </div>
          </h1>
          <p className="text-on-surface-variant font-black text-[10px] uppercase tracking-[0.3em] mt-3 opacity-60">
            Optimize pipelines with precision and predictive insights
          </p>
        </motion.div>

        <div className="flex items-center gap-4">
          {/* Match threshold control */}
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-container/40 rounded-2xl border border-outline-variant/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-outline">Min Score</span>
            <input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-14 bg-transparent text-[13px] font-black text-primary outline-none text-center"
            />
            <span className="text-[10px] text-outline">%</span>
          </div>
          <button
            onClick={() => setShowNewJobModal(true)}
            className="btn btn-primary px-8 py-3.5 rounded-2xl shadow-2xl shadow-primary/30 active:scale-95"
          >
            <Briefcase size={14} />
            Post New Position
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
            <div className="absolute -inset-10 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-5 relative z-10">
              <div
                className={`p-2.5 rounded-xl bg-${stat.color}/10 flex items-center justify-center text-${stat.color} border border-${stat.color}/10`}
              >
                <stat.icon size={20} />
              </div>
            </div>
            <div className="text-3xl font-black tracking-tight relative z-10">
              {" "}
              {stat.value}{" "}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-outline mt-1.5 relative z-10 opacity-70">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Main Operations View ────────────────────────────── */}
      <div className="flex-grow flex gap-8 overflow-hidden items-stretch">
        <div className="flex-grow flex flex-col glass bg-white/70 p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl overflow-hidden backdrop-blur-3xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 p-1 bg-surface-container/40 rounded-[1.25rem] border border-outline-variant/10">
              {[
                { id: "ranking", label: "Talent Ranking" },
                { id: "jobs", label: "Managed Jobs" },
                { id: "analytics", label: "Market Analytics" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all",
                    activeTab === t.id
                      ? "bg-white text-primary shadow-lg shadow-black/5 ring-1 ring-outline-variant/10"
                      : "text-outline hover:text-on-surface",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary"
                />
                <input
                  className="bg-surface-container/40 rounded-2xl pl-11 pr-6 py-2.5 text-[11px] font-medium outline-none border border-outline-variant/10 focus:border-primary focus:bg-white transition-all w-64"
                  placeholder="Global talent search..."
                />
              </div>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 -mr-4">
            {activeTab === "ranking" && (
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
                      Focus Area
                    </th>
                    <th className="text-[10px] font-black uppercase tracking-widest text-outline opacity-50">
                      Pipeline State
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
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-black text-lg">
                              {c.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-[13px] font-black tracking-tight text-on-surface">
                                {c.name}
                              </div>
                              <div className="text-[9px] font-bold text-outline uppercase tracking-wider flex items-center gap-2 mt-1">
                                {c.role}{" "}
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
                            <span className="text-[11px] font-black">
                              {c.matchScore}%
                            </span>
                          </div>
                        </td>
                        <td className="py-5 bg-surface-container/20 group-hover:bg-surface-container/60 transition-all border-y border-outline-variant/5">
                          <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                            {c.skills.map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 rounded-md bg-white border border-outline-variant/10 text-[8px] font-black uppercase tracking-tighter text-outline"
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
                              c.status === "Interviewed"
                                ? "bg-warning/10 border-warning/30 text-warning"
                                : "bg-primary/10 border-primary/30 text-primary",
                            )}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            {c.status}
                          </div>
                        </td>
                        <td className="py-5 pr-4 bg-surface-container/20 group-hover:bg-surface-container/60 transition-all rounded-r-[1.5rem] border-y border-r border-outline-variant/5 text-right">
                          <div className="flex items-center justify-end gap-2 pr-2">
                            <button className="p-2.5 rounded-xl bg-white border border-outline-variant/10 hover:border-primary transition-all">
                              {" "}
                              <Mail size={14} className="text-outline" />{" "}
                            </button>
                            <button className="p-2.5 rounded-xl bg-primary text-white hover:scale-110 transition-all">
                              {" "}
                              <ArrowUpRight size={14} />{" "}
                            </button>
                          </div>
                        </td>
                        <motion.div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
            {activeTab === "jobs" && (
              <div className="grid grid-cols-1 gap-4">
                {jobs.map((job) => (
                  <motion.div
                    key={job.id}
                    layoutId={job.id}
                    className="group bg-surface-container/20 hover:bg-surface-container/40 border border-outline-variant/10 rounded-[2rem] p-6 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-outline-variant/10 flex items-center justify-center text-primary">
                        <Briefcase size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-on-surface">{job.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">{job.location}</span>
                          <div className="w-1 h-1 rounded-full bg-outline/20" />
                          <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                            {job._count?.applications || 0} Candidates
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setShowUploadModal({ jobId: job.id, jobTitle: job.title })}
                        className="btn bg-white border border-outline-variant/10 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-outline hover:border-primary hover:text-primary transition-all flex items-center gap-2"
                      >
                        <Upload size={14} />
                        Upload
                      </button>
                      <button 
                        onClick={() => runShortlist(job.id)}
                        className="btn bg-primary/10 border border-primary/20 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                      >
                        {shortlistLoading ? <Loader2 size={14} className="animate-spin" /> : <Cpu size={14} />}
                        Run AI
                      </button>
                      <button 
                        onClick={() => setSelectedJob(job)}
                        className="btn bg-surface-container px-4 py-2.5 rounded-xl text-outline hover:text-on-surface transition-all"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                {jobs.length === 0 && (
                  <div className="py-20 text-center">
                    <Briefcase size={48} className="mx-auto text-outline/20 mb-4" />
                    <p className="text-sm font-black text-outline uppercase tracking-widest">No positions active</p>
                    <button onClick={() => setShowNewJobModal(true)} className="text-[10px] font-black text-primary uppercase tracking-widest mt-2 underline">Post your first job</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-12">
                <div className="grid grid-cols-2 gap-8">
                  <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">Talent Availability Index</h4>
                    <div className="flex items-end gap-4 mb-6">
                      <div className="text-4xl font-black tracking-tighter">8.4<span className="text-sm opacity-40">/10</span></div>
                      <div className="text-[10px] font-bold text-success mb-2 flex items-center gap-1">
                        <ArrowUpRight size={12} /> +12% vs last month
                      </div>
                    </div>
                    <div className="space-y-4">
                      {['Engineering', 'Design', 'Product', 'Marketing'].map(cat => (
                        <div key={cat} className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-outline uppercase tracking-wider">{cat}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-1.5 bg-white/50 rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${Math.random() * 40 + 60}%` }} />
                            </div>
                            <span className="text-[10px] font-black">High</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-8 rounded-[2rem] bg-tertiary/5 border border-tertiary/10">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-tertiary mb-6">Salary Benchmarks (Aggregated)</h4>
                    <div className="space-y-6">
                      {[
                        { role: 'Senior Frontend', range: '$140k - $185k' },
                        { role: 'Fullstack Rust', range: '$160k - $210k' },
                        { role: 'Product Manager', range: '$130k - $175k' },
                      ].map(b => (
                        <div key={b.role} className="flex justify-between items-center p-4 rounded-2xl bg-white/40 border border-white/60">
                          <span className="text-[11px] font-black text-on-surface">{b.role}</span>
                          <span className="text-[11px] font-black text-tertiary">{b.range}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="p-8 rounded-[2.5rem] bg-surface-container/20 border border-outline-variant/10">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-outline mb-8">AI Predictive Hiring Timeline</h4>
                  <div className="h-48 flex items-end justify-between px-4">
                    {[45, 62, 58, 75, 90, 82, 70].map((h, i) => (
                      <div key={i} className="flex flex-col items-center gap-3 w-12">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          className="w-full bg-primary/20 rounded-t-xl relative group"
                        >
                          <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
                        </motion.div>
                        <span className="text-[8px] font-bold text-outline">WEEK {i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="w-96 flex flex-col gap-8 shrink-0">
          {/* Market Insight HUD */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass bg-[#121214] p-10 rounded-[2.5rem] border border-white/5 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20 flex-shrink-0">
                <Cpu size={14} className="text-primary" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em]">
                Hiring AI Advisor
              </h3>
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed mb-8 italic">
              "Market demand for <b>Fullstack Engineers</b> with <b>Rust</b>{" "}
              expertise is currently at an all-time high. Your pipeline is 20%
              ahead of competitors in this segment."
            </p>
            <div className="space-y-6">
              {[
                { label: "Talent Liquidity", val: 84 },
                { label: "Competitive Pull", val: 62 },
                { label: "Predictive Fill Time", val: 45 },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-40 mb-2">
                    <span>{r.label}</span>
                    <span>{r.val}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${r.val}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="card bg-white/80 p-8 rounded-[2.5rem] shadow-xl flex-grow flex flex-col gap-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-outline opacity-60">
              Candidate Sourcing Log
            </h3>
            <div className="flex-grow space-y-5 overflow-y-auto custom-scrollbar pr-2">
              {[
                "New candidate applied for Tech Lead",
                "Interview scheduled with Alex Rivera",
                "Automated screening completed for job #42",
                "Talent cluster refreshed for 'Data Science'",
              ].map((log, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start pb-4 border-b border-outline-variant/10 last:border-0"
                >
                  <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-[11px] font-medium text-on-surface opacity-80">
                    {log}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full py-4 bg-surface-container rounded-2xl text-[9px] font-black uppercase tracking-widest text-outline hover:bg-primary/10 hover:text-primary transition-all">
              Deep Audit History
            </button>
          </div>
        </aside>
      </div>

      {/* ── Shortlist Results Panel ─────────────────────────── */}
      <AnimatePresence>
        {shortlistResults.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[900px] max-h-[65vh] glass bg-white/90 backdrop-blur-3xl rounded-[2rem] border border-outline-variant/20 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <CheckCircle size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-on-surface">AI Shortlist Results</h3>
                  <p className="text-[10px] text-outline">{shortlistResults.length} candidates ranked by match score</p>
                </div>
              </div>
              <button onClick={() => setShortlistResults([])} className="p-2 rounded-xl hover:bg-surface-container transition-all">
                <XCircle size={18} className="text-outline" />
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar max-h-[calc(65vh-80px)]">
              {shortlistResults.map((c, i) => (
                <div key={c.applicationId} className="flex items-center gap-6 px-8 py-4 border-b border-outline-variant/5 last:border-0 hover:bg-surface-container/20 transition-all">
                  <div className="w-8 text-center">
                    <span className={`text-lg font-black ${i === 0 ? "text-primary" : "text-outline"}`}>#{i + 1}</span>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-black text-sm">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-grow">
                    <div className="text-[13px] font-black text-on-surface">{c.name}</div>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {(c.skills || []).slice(0, 4).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-surface-container text-[8px] font-black uppercase tracking-tighter text-outline">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="w-48">
                    <div className="flex justify-between text-[10px] font-black mb-1">
                      <span className="text-outline uppercase tracking-wider">Match</span>
                      <span className={c.matchScore >= threshold ? "text-success" : "text-warning"}>{c.matchScore}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${c.matchScore}%` }}
                        className={`h-full ${c.matchScore >= threshold ? "bg-success" : "bg-warning"}`}
                      />
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-[0.1em] border ${
                    c.status === "REVIEWING" ? "bg-success/10 border-success/30 text-success" : "bg-warning/10 border-warning/30 text-warning"
                  }`}>
                    {c.status}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New Job Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {showNewJobModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
            onClick={() => setShowNewJobModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[3rem] p-12 w-[640px] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setShowNewJobModal(false)} className="p-3 rounded-2xl hover:bg-surface-container transition-all">
                  <XCircle size={24} className="text-outline" />
                </button>
              </div>

              <div className="mb-10">
                <h3 className="text-3xl font-black tracking-tight">Post New Position</h3>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-outline mt-2">Initialize AI screening parameters</p>
              </div>

              <form onSubmit={createJob} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline">Position Title</label>
                    <input name="title" required className="w-full bg-surface-container/40 rounded-2xl px-6 py-4 text-[13px] font-black border border-outline-variant/10 focus:border-primary outline-none transition-all" placeholder="e.g. Senior Rust Engineer" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline">Company</label>
                    <input name="company" required className="w-full bg-surface-container/40 rounded-2xl px-6 py-4 text-[13px] font-black border border-outline-variant/10 focus:border-primary outline-none transition-all" placeholder="e.g. Acme Intelligence" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline">Location</label>
                  <input name="location" required className="w-full bg-surface-container/40 rounded-2xl px-6 py-4 text-[13px] font-black border border-outline-variant/10 focus:border-primary outline-none transition-all" placeholder="Remote, New York, etc." />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline">Job Description</label>
                  <textarea name="description" required rows={4} className="w-full bg-surface-container/40 rounded-[1.5rem] px-6 py-4 text-[13px] font-medium border border-outline-variant/10 focus:border-primary outline-none transition-all resize-none" placeholder="Paste full JD here for AI alignment..." />
                </div>

                <button type="submit" className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all mt-4">
                  Deploy Position & Start AI Analysis
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[3rem] p-12 w-[1000px] max-h-[85vh] shadow-2xl relative overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-10 shrink-0">
                <div>
                  <h3 className="text-3xl font-black tracking-tight">{selectedJob.title}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">{selectedJob.company}</span>
                    <div className="w-1 h-1 rounded-full bg-outline/20" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-outline">{selectedJob.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setShowUploadModal({ jobId: selectedJob.id, jobTitle: selectedJob.title });
                      setSelectedJob(null);
                    }}
                    className="btn bg-surface-container/40 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-outline hover:text-primary transition-all flex items-center gap-2"
                  >
                    <Upload size={14} />
                    Add Resumes
                  </button>
                  <button 
                    onClick={() => runShortlist(selectedJob.id)}
                    className="btn btn-primary px-8 py-3 rounded-2xl flex items-center gap-2"
                  >
                    <Cpu size={14} />
                    Run AI Shortlist
                  </button>
                  <button onClick={() => setSelectedJob(null)} className="p-3 rounded-2xl hover:bg-surface-container transition-all">
                    <XCircle size={24} className="text-outline" />
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 -mr-4">
                {applicationsLoading ? (
                  <div className="py-20 text-center">
                    <Loader2 size={32} className="animate-spin mx-auto text-primary opacity-20 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline">Fetching intelligence...</p>
                  </div>
                ) : jobApplications.length > 0 ? (
                  <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                      <tr>
                        <th className="text-[10px] font-black uppercase tracking-widest text-outline pl-4 opacity-50">Candidate</th>
                        <th className="text-[10px] font-black uppercase tracking-widest text-outline opacity-50">Score</th>
                        <th className="text-[10px] font-black uppercase tracking-widest text-outline opacity-50">Status</th>
                        <th className="text-[10px] font-black uppercase tracking-widest text-outline opacity-50">Skills</th>
                        <th className="pr-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobApplications.map((app) => (
                        <tr key={app.applicationId} className="group cursor-pointer">
                          <td className="py-4 pl-4 bg-surface-container/20 group-hover:bg-surface-container/40 rounded-l-2xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-outline-variant/10 flex items-center justify-center text-primary font-black">
                                {app.name.charAt(0)}
                              </div>
                              <span className="text-[13px] font-black">{app.name}</span>
                            </div>
                          </td>
                          <td className="py-4 bg-surface-container/20 group-hover:bg-surface-container/40">
                            <span className={cn(
                              "text-[12px] font-black",
                              app.matchScore >= threshold ? "text-success" : "text-warning"
                            )}>{app.matchScore}%</span>
                          </td>
                          <td className="py-4 bg-surface-container/20 group-hover:bg-surface-container/40">
                            <span className="px-3 py-1 rounded-lg bg-white border border-outline-variant/10 text-[9px] font-black uppercase">{app.status}</span>
                          </td>
                          <td className="py-4 bg-surface-container/20 group-hover:bg-surface-container/40">
                            <div className="flex gap-1 flex-wrap max-w-[200px]">
                              {(app.skills || []).slice(0, 3).map(s => (
                                <span key={s} className="px-2 py-0.5 rounded bg-primary/5 text-[8px] font-black text-primary uppercase">{s}</span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 pr-4 bg-surface-container/20 group-hover:bg-surface-container/40 rounded-r-2xl text-right">
                            <button className="p-2 rounded-xl bg-primary text-white hover:scale-110 transition-all">
                              <ArrowUpRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-20 text-center">
                    <Users size={48} className="mx-auto text-outline/20 mb-4" />
                    <p className="text-sm font-black text-outline uppercase tracking-widest">No applicants yet</p>
                    <p className="text-[10px] text-outline mt-2">Upload resumes to begin AI screening</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Background Grid ───────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.03]">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '100px 100px' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      </div>
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowUploadModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-10 w-[520px] shadow-2xl border border-outline-variant/10"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-on-surface">Bulk Upload Resumes</h3>
                  <p className="text-[11px] text-outline mt-1">for <span className="text-primary font-black">{showUploadModal.jobTitle}</span></p>
                </div>
                <button onClick={() => setShowUploadModal(null)} className="p-2 rounded-xl hover:bg-surface-container">
                  <XCircle size={18} className="text-outline" />
                </button>
              </div>

              <div className="border-2 border-dashed border-primary/20 rounded-[1.5rem] p-10 text-center hover:border-primary/40 transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}>
                <Upload size={32} className="mx-auto mb-4 text-primary/50" />
                <p className="text-[13px] font-black text-on-surface mb-1">Drop resumes here or click to browse</p>
                <p className="text-[10px] text-outline">PDF, DOCX, TXT — up to 50 files, 10MB each</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                  onChange={(e) => handleBulkUpload(showUploadModal.jobId, e.target.files)}
                />
              </div>

              {shortlistLoading && (
                <div className="flex items-center justify-center gap-3 mt-6 text-[11px] font-black text-outline">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  Processing resumes...
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setShowUploadModal(null)}
                  className="flex-1 py-3 rounded-2xl bg-surface-container text-[11px] font-black uppercase tracking-widest text-outline hover:bg-surface-container/60 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error Toast ─────────────────────────────────── */}
      <AnimatePresence>
        {shortlistError && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 bg-error/10 border border-error/20 rounded-2xl text-error"
          >
            <XCircle size={16} />
            <span className="text-[11px] font-black">{shortlistError}</span>
            <button onClick={() => setShortlistError(null)} className="p-1"><XCircle size={12} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 10px; }
        .backdrop-blur-3xl { backdrop-filter: blur(60px); }
      `}</style>
    </div>
  );
}
