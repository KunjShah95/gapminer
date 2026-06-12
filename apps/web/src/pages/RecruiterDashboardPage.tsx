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
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Badge,
  Input,
  StatCard,
} from "@/components/ui";

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

  const statIconColors: Record<string, string> = {
    primary: "text-primary",
    tertiary: "text-violet-300",
    success: "text-emerald-400",
    info: "text-sky-400",
  };

  return (
    <PageShell maxWidth="full" className="flex h-full flex-col overflow-hidden">
      <PageHeader
        badge="Enterprise"
        title="Recruiter Intelligence Hub"
        description="Optimize pipelines with precision and predictive insights."
        icon={<Cpu className="h-6 w-6" />}
        actions={
          <>
            <div className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                Min Score
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-12 bg-transparent text-center text-sm font-black text-primary outline-none"
              />
              <span className="text-[10px] text-outline">%</span>
            </div>
            <Button size="lg" onClick={() => setShowNewJobModal(true)}>
              <Briefcase className="h-4 w-4" />
              Post New Position
            </Button>
          </>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
          >
            <StatCard
              label={stat.label}
              value={stat.value}
              icon={
                <stat.icon
                  className={cn("h-5 w-5", statIconColors[stat.color] || "text-primary")}
                />
              }
              className="border-primary/10 hover:border-primary/30"
            />
          </motion.div>
        ))}
      </div>

      {/* ── Main Operations View ────────────────────────────── */}
      <div className="flex-grow flex flex-col gap-8 overflow-hidden items-stretch lg:flex-row">
        <Card padding="lg" className="flex flex-grow flex-col overflow-hidden">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-1 rounded-xl border border-outline-variant/15 bg-surface-container-low p-1 overflow-x-auto">
              {[
                { id: "ranking", label: "Talent Ranking" },
                { id: "jobs", label: "Managed Jobs" },
                { id: "analytics", label: "Market Analytics" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "rounded-lg px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all shrink-0",
                    activeTab === t.id
                      ? "primary-gradient text-on-primary-fixed shadow-lg shadow-primary/20"
                      : "text-on-surface-variant hover:text-on-surface",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
              <input
                className="gm-input w-full pl-10 text-sm"
                placeholder="Global talent search..."
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 -mr-4">
            {activeTab === "ranking" && (
              <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3 min-w-[600px]">
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
                              <Badge key={skill} tone="default" className="text-[8px]">
                                {skill}
                              </Badge>
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
                            <Button variant="outline" size="sm">
                              <Mail size={14} />
                            </Button>
                            <Button size="sm">
                              <ArrowUpRight size={14} />
                            </Button>
                          </div>
                        </td>
                        <motion.div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              </div>
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
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
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

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUploadModal({ jobId: job.id, jobTitle: job.title })}
                      >
                        <Upload size={14} />
                        Upload
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => runShortlist(job.id)}
                        loading={shortlistLoading}
                      >
                        {!shortlistLoading && <Cpu size={14} />}
                        Run AI
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedJob(job)}
                      >
                        <MoreHorizontal size={16} />
                      </Button>
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
                            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-container-highest">
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
                        <div key={b.role} className="flex items-center justify-between rounded-2xl border border-outline-variant/15 bg-surface-container-low p-4">
                          <span className="text-[11px] font-black text-on-surface">{b.role}</span>
                          <span className="text-[11px] font-black text-violet-300">{b.range}</span>
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
        </Card>

        <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-96">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
          <Card
            padding="lg"
            className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/15 via-surface-container to-surface-container-low"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/20">
                <Cpu size={14} className="text-primary" />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface">
                Hiring AI Advisor
              </h3>
            </div>
            <p className="mb-6 text-xs italic leading-relaxed text-on-surface-variant">
              Market demand for <strong className="text-on-surface">Fullstack Engineers</strong> with{" "}
              <strong className="text-primary">Rust</strong> expertise is at an all-time high. Your
              pipeline is 20% ahead of competitors in this segment.
            </p>
            <div className="space-y-5">
              {[
                { label: "Talent Liquidity", val: 84 },
                { label: "Competitive Pull", val: 62 },
                { label: "Predictive Fill Time", val: 45 },
              ].map((r) => (
                <div key={r.label}>
                  <div className="mb-2 flex justify-between text-[9px] font-bold uppercase tracking-wider text-outline">
                    <span>{r.label}</span>
                    <span>{r.val}%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-surface-container-highest">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${r.val}%` }}
                      className="h-full primary-gradient"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          </motion.div>

          <Card padding="md" className="flex flex-grow flex-col gap-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-outline">
              Candidate Sourcing Log
            </h3>
            <div className="custom-scrollbar flex-grow space-y-4 overflow-y-auto pr-2">
              {[
                "New candidate applied for Tech Lead",
                "Interview scheduled with Alex Rivera",
                "Automated screening completed for job #42",
                "Talent cluster refreshed for 'Data Science'",
              ].map((log, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 border-b border-outline-variant/10 pb-3 last:border-0"
                >
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-xs text-on-surface-variant">{log}</span>
                </div>
              ))}
            </div>
            <Button variant="secondary" className="w-full text-[10px] uppercase tracking-wider">
              Deep Audit History
            </Button>
          </Card>
        </aside>
      </div>

      {/* ── Shortlist Results Panel ─────────────────────────── */}
      <AnimatePresence>
        {shortlistResults.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-8 left-1/2 z-50 max-h-[65vh] w-[900px] -translate-x-1/2 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-high/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
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
              className="glass-card relative w-full max-w-[640px] overflow-hidden rounded-3xl p-10"
            >
              <div className="absolute right-4 top-4">
                <Button variant="ghost" size="sm" onClick={() => setShowNewJobModal(false)}>
                  <XCircle size={20} />
                </Button>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-black tracking-tight text-on-surface">Post New Position</h3>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-outline">
                  Initialize AI screening parameters
                </p>
              </div>

              <form onSubmit={createJob} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input name="title" label="Position Title" required placeholder="e.g. Senior Rust Engineer" />
                  <Input name="company" label="Company" required placeholder="e.g. Acme Intelligence" />
                </div>
                <Input name="location" label="Location" required placeholder="Remote, New York, etc." />
                <div>
                  <label className="gm-label">Job Description</label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    className="gm-textarea resize-none"
                    placeholder="Paste full JD here for AI alignment..."
                  />
                </div>
                <Button type="submit" size="lg" className="mt-2 w-full">
                  Deploy Position & Start AI Analysis
                </Button>
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
              className="glass-card relative flex max-h-[85vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-3xl p-10"
            >
              <div className="mb-8 flex shrink-0 flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-on-surface">{selectedJob.title}</h3>
                  <div className="mt-2 flex items-center gap-3">
                    <Badge tone="primary">{selectedJob.company}</Badge>
                    <span className="text-xs text-outline">{selectedJob.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowUploadModal({ jobId: selectedJob.id, jobTitle: selectedJob.title });
                      setSelectedJob(null);
                    }}
                  >
                    <Upload size={14} />
                    Add Resumes
                  </Button>
                  <Button size="sm" onClick={() => runShortlist(selectedJob.id)}>
                    <Cpu size={14} />
                    Run AI Shortlist
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedJob(null)}>
                    <XCircle size={20} />
                  </Button>
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
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 font-black text-primary">
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
                            <Badge tone="default">{app.status}</Badge>
                          </td>
                          <td className="py-4 bg-surface-container/20 group-hover:bg-surface-container/40">
                            <div className="flex gap-1 flex-wrap max-w-[200px]">
                              {(app.skills || []).slice(0, 3).map(s => (
                                <span key={s} className="px-2 py-0.5 rounded bg-primary/5 text-[8px] font-black text-primary uppercase">{s}</span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 pr-4 bg-surface-container/20 group-hover:bg-surface-container/40 rounded-r-2xl text-right">
                            <Button size="sm">
                              <ArrowUpRight size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}              </tbody>
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
      <div className="pointer-events-none fixed inset-0 z-[-1] opacity-[0.04]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "100px 100px",
          }}
        />
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
              className="glass-card w-full max-w-[520px] rounded-3xl p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-on-surface">Bulk Upload Resumes</h3>
                  <p className="mt-1 text-xs text-outline">
                    for <span className="font-bold text-primary">{showUploadModal.jobTitle}</span>
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(null)}>
                  <XCircle size={18} />
                </Button>
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

              <Button
                variant="secondary"
                className="mt-6 w-full"
                onClick={() => setShowUploadModal(null)}
              >
                Cancel
              </Button>
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 10px; }
      `}</style>
    </PageShell>
  );
}
