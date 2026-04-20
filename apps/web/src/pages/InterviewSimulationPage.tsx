import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  BarChart3,
  Clock,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Play,
  Volume2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthToken, safeReadJson } from "@/lib/authFetch";

export default function InterviewSimulationPage() {
  const [isStarted, setIsStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes
  const [transcript, setTranscript] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(
    "Could you explain how you've used Kubernetes in a production environment to solve scalability issues?",
  );

  const [jdUrl, setJdUrl] = useState("");
  const [jdText, setJdText] = useState("");
  const [jdData, setJdData] = useState<any>(null);
  const [isScraping, setIsScraping] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Simulation Logic
  useEffect(() => {
    let interval: any;
    if (isStarted && !isPaused && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      handleEndSession();
    }
    return () => clearInterval(interval);
  }, [isStarted, isPaused, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleScrape = async () => {
    if (!jdUrl) return;
    setIsScraping(true);
    try {
      const token = getAuthToken() || "";
      const res = await fetch("/api/v1/scrape/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: jdUrl }),
      });
      const data = await safeReadJson<any>(res, {});
      if (data.description) {
        setJdText(data.description);
        setJdData(data);
      }
    } catch (err) {
      console.error("Scrape failed:", err);
    } finally {
      setIsScraping(false);
    }
  };

  const handleStartSession = async () => {
    setLoading(true);
    try {
      const token = getAuthToken() || "";
      const response = await fetch("/api/v1/interview/next-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transcript: [],
          resumeData: {}, // In a real app we'd get this from the store
          jdData: jdData || { title: "Custom Role", description: jdText },
        }),
      });
      const data = await safeReadJson<any>(response, {});
      setCurrentQuestion(data.question);
      setTranscript(["AI: " + data.question]);
      setIsStarted(true);
    } catch (err) {
      console.error("Failed to start session:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = () => {
    setIsStarted(false);
    setShowResults(true);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // STOP RECORDING
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      // START RECORDING
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          handleTranscription(audioBlob);
          stream.getTracks().forEach((track) => track.stop());
        };

        recorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Audio access denied:", err);
      }
    }
  };

  const handleTranscription = async (blob: Blob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "interview.webm");

      const token = getAuthToken() || "";
      const response = await fetch("/api/v1/interview/transcribe", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const { text } = await safeReadJson<any>(response, {});

      if (text) {
        setTranscript((prev) => [...prev, "User: " + text]);
        // Trigger next question
        const nextRes = await fetch("/api/v1/interview/next-question", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            transcript: [...transcript, "User: " + text],
            resumeData: {},
            jdData: { title: "Senior Software Engineer" },
          }),
        });
        const { question } = await safeReadJson<any>(nextRes, {});
        setTranscript((prev) => [...prev, "AI: " + question]);
        setCurrentQuestion(question);
      }
    } catch (err) {
      console.error("Transcription failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (showResults) {
    return (
      <InterviewResults
        scorecard={{ confidence: 8.5, clarity: 9.0, technicalCorrectness: 7.8 }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white font-body overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a1a2e_0%,_transparent_50%)] op-20 pointer-events-none" />

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="h-20 flex items-center justify-between px-12 border-b border-white/5 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight skew-x-[-2deg]">
              Gapminer Live Screening
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Enterprise Session Active
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-2xl">
            <Clock size={16} className="text-primary" />
            <span className="text-sm font-black tabular-nums tracking-widest">
              {formatTime(timer)}
            </span>
          </div>
          <button
            onClick={handleEndSession}
            className="px-6 py-2 bg-error/10 border border-error/30 text-error rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-error hover:text-white transition-all"
          >
            End Session
          </button>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="flex-grow flex p-12 gap-12 overflow-hidden">
        {/* Left Side: Video/Voice Visualizer */}
        <section className="flex-grow flex flex-col gap-8 relative group">
          <div className="flex-grow relative rounded-[3rem] overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-2xl">
            {/* The "Interviewer" */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center relative mb-8">
                <div className="absolute inset-0 border-2 border-primary rounded-full animate-ping opacity-20" />
                <div className="absolute inset-4 border border-primary/30 rounded-full animate-pulse" />
                <div className="w-24 h-24 rounded-full primary-gradient flex items-center justify-center shadow-2xl shadow-primary/40">
                  <Bot size={48} className="text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-black mb-4 tracking-tight">
                AI Technical Specialist
              </h2>
              <p className="text-white/40 text-sm max-w-sm leading-relaxed font-medium">
                I'll be conducting your technical screening today. Let's focus
                on your recent experience with distributed systems.
              </p>
            </div>

            {/* Current Question Overlay */}
            <AnimatePresence mode="wait">
              {isStarted && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="absolute bottom-12 left-12 right-12 glass bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-3xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <MessageSquare size={16} />
                    </div>
                    <p className="text-lg font-bold leading-relaxed tracking-tight italic">
                      "{currentQuestion}"
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video Preview (User) */}
            <div className="absolute top-8 right-8 w-64 aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl group-hover:scale-105 transition-transform duration-500 shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <VideoOff size={32} className="text-white/20" />
              </div>
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-error" />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                  Camera Off
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="h-24 flex items-center justify-center gap-6">
            <button className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <VideoOff size={24} />
            </button>
            <button
              onClick={toggleRecording}
              className={cn(
                "w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all shadow-2xl shadow-primary/20 hover:scale-110 active:scale-95",
                isRecording
                  ? "bg-error text-white animate-pulse"
                  : "primary-gradient text-white",
              )}
            >
              {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
            </button>
            <button className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <Volume2 size={24} />
            </button>
          </div>
        </section>

        {/* Right Side: Transcript & Real-time Feedback */}
        <aside className="w-[400px] flex flex-col gap-6 shrink-0 z-10">
          <div className="flex-grow flex flex-col border border-white/5 bg-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Session Transcript
              </h3>
              <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-[9px] font-bold text-primary uppercase tracking-widest">
                Real-time
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {!isStarted && (
                <div className="h-full flex flex-col p-4 overflow-y-auto custom-scrollbar">
                  <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6 animate-pulse mx-auto">
                    <Shield size={32} />
                  </div>
                  <h4 className="text-lg font-black tracking-tight mb-2 text-center">
                    Setup your session
                  </h4>
                  <p className="text-xs text-white/40 leading-relaxed mb-8 text-center">
                    Enter a job posting URL or paste the description to tailor
                    your interview.
                  </p>

                  <div className="space-y-4">
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="LinkedIn / Indeed / Glassdoor URL"
                        value={jdUrl}
                        onChange={(e) => setJdUrl(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold focus:border-primary/50 outline-none transition-all pr-24"
                      />
                      <button
                        onClick={handleScrape}
                        disabled={isScraping || !jdUrl}
                        className="absolute right-2 top-2 bottom-2 px-4 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all"
                      >
                        {isScraping ? "Scraping..." : "Fetch"}
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        placeholder="Or paste Job Description here..."
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[11px] leading-relaxed font-medium focus:border-primary/50 outline-none transition-all resize-none custom-scrollbar"
                      />
                      {jdData && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-success/10 border border-success/20 rounded-md text-[8px] font-black text-success uppercase tracking-widest">
                          Parsed: {jdData.title}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleStartSession}
                      disabled={loading || (!jdUrl && !jdText)}
                      className="w-full py-4 primary-gradient rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {loading
                        ? "Initializing AI Specialist..."
                        : "Start Interview"}
                    </button>
                  </div>
                </div>
              )}
              {transcript.map((line, idx) => (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  key={idx}
                  className={cn(
                    "p-5 rounded-3xl text-xs leading-relaxed font-medium",
                    line.startsWith("AI:")
                      ? "bg-white/5 border border-white/5 text-white/60"
                      : "bg-primary/20 border border-primary/20 text-white ml-8 shadow-lg shadow-black/20",
                  )}
                >
                  <span className="font-black text-[9px] uppercase tracking-widest block mb-2 opacity-40">
                    {line.startsWith("AI:")
                      ? "AI Specialist"
                      : "Candidate Response"}
                  </span>
                  {line.replace("AI: ", "").replace("User: ", "")}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="glass bg-primary/10 border border-primary/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BarChart3 size={64} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">
              Initial Indicators
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white/60">
                  Clarity
                </span>
                <span className="text-[11px] font-black text-primary">
                  SCANNING...
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  animate={{ x: [-100, 100] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-full bg-primary"
                />
              </div>
            </div>
          </div>
        </aside>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(108,71,255,0.1); border-radius: 10px; }
        .primary-gradient { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); }
      `}</style>
    </div>
  );
}

function InterviewResults({ scorecard }: { scorecard: any }) {
  return (
    <div className="flex flex-col h-full bg-[#050505] text-white p-12 overflow-hidden items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a1a2e_0%,_transparent_70%)] opacity-30" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-5xl glass bg-white/5 border border-white/10 rounded-[4rem] p-16 relative overflow-hidden backdrop-blur-3xl z-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
          <BarChart3 size={300} />
        </div>

        <div className="flex items-center gap-6 mb-12">
          <div className="w-16 h-16 rounded-3xl bg-success/20 flex items-center justify-center text-success border border-success/30">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tight skew-x-[-2deg]">
              Session Completed
            </h2>
            <p className="text-white/40 font-semibold tracking-widest text-xs uppercase mt-2">
              Enterprise-Grade Performance Scorecard
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 mb-16">
          {[
            {
              label: "Confidence",
              value: scorecard.confidence,
              color: "primary",
            },
            { label: "Clarity", value: scorecard.clarity, color: "tertiary" },
            {
              label: "Technical depth",
              value: scorecard.technicalCorrectness,
              color: "success",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] relative group hover:bg-white/10 transition-all"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-2">
                {stat.label}
              </span>
              <div className="text-5xl font-black tabular-nums">
                {stat.value}
                <span className="text-xl text-white/20">/10</span>
              </div>
              <div className="absolute bottom-6 right-6 opacity-20 group-hover:opacity-100 transition-opacity">
                <ChevronRight />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-8">
          <div className="p-10 border border-primary/30 bg-primary/5 rounded-[2.5rem]">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6">
              Gapminer Strategic Feedback
            </h4>
            <p className="text-lg font-medium leading-relaxed italic text-white/90">
              "Your explanation of horizontal pod autoscaling was technically
              precise, though you could strengthen your performance by detailing
              how you've handled database migrations during cluster rollouts.
              Your confidence remains high throughout architectural deep-dives."
            </p>
          </div>

          <div className="flex items-center justify-between gap-8 pt-8">
            <button className="flex-grow py-5 bg-white/5 border border-white/10 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
              Download Full Report
            </button>
            <button className="flex-grow py-5 primary-gradient text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">
              Update my career roadmap
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Bot(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}
