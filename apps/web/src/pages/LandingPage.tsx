import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, Sparkles } from "lucide-react";

function Typewriter({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const w = words[idx % words.length];
    if (!del && text.length < w.length) {
      const t = setTimeout(() => setText(w.slice(0, text.length + 1)), 80);
      return () => clearTimeout(t);
    }
    if (!del && text.length === w.length) {
      const t = setTimeout(() => setDel(true), 2000);
      return () => clearTimeout(t);
    }
    if (del && text.length) {
      const t = setTimeout(() => setText(text.slice(0, -1)), 45);
      return () => clearTimeout(t);
    }
    if (del && !text.length) {
      setDel(false);
      setIdx((i) => i + 1);
    }
  }, [text, del, idx, words]);
  return (
    <span className="text-gradient">
      {text}
      <span className="animate-pulse text-primary">|</span>
    </span>
  );
}

function Tape({ items }: { items: string[] }) {
  const row = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-outline-variant/15 bg-surface-container/40 py-3">
      <div
        className="flex gap-12 whitespace-nowrap"
        style={{ animation: "marquee 28s linear infinite" }}
      >
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-12 text-[11px] font-bold uppercase tracking-[0.28em] text-on-surface-variant"
          >
            {item}
            <span className="text-primary/40">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Label({ n, t }: { n: string; t: string }) {
  return (
    <div className="mb-14 flex items-center gap-6">
      <span className="text-[11px] font-black uppercase tracking-[0.35em] text-primary/70">
        {n}
      </span>
      <div className="h-px flex-1 bg-outline-variant/20" />
      <span className="text-[11px] font-black uppercase tracking-[0.35em] text-outline">
        {t}
      </span>
    </div>
  );
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col justify-end overflow-hidden pb-24 pt-28 mesh-bg">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,91,219,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,91,219,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 font-black text-primary/[0.04]"
          style={{
            opacity: Math.max(0, 1 - scrollY / 400),
            fontSize: "clamp(140px, 26vw, 320px)",
          }}
        >
          73%
        </div>
        <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-8 bg-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
              Gapminer Career OS
            </span>
          </div>
          <h1
            className="max-w-5xl font-black leading-[0.92] tracking-tight"
            style={{ fontSize: "clamp(42px, 7vw, 92px)" }}
          >
            <span className="block">Close the gap between</span>
            <span>
              where you are and{" "}
              <Typewriter
                words={[
                  "Staff Engineer",
                  "Tech Lead",
                  "your dream role",
                  "market demand",
                ]}
              />
            </span>
          </h1>
          <div className="mt-10 grid gap-8 border-t border-outline-variant/15 pt-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <p className="max-w-xl text-lg font-light text-on-surface-variant">
              Five AI agents audit your resume against every job — then deliver
              a surgical roadmap.{" "}
              <span className="font-medium text-on-surface">
                Precision career intelligence.
              </span>
            </p>
            <div className="flex min-w-[220px] flex-col gap-3">
              <Link
                to="/analyze"
                className="primary-gradient group flex items-center justify-between rounded-2xl px-6 py-4 font-bold text-on-primary-fixed shadow-xl shadow-primary/25"
              >
                Analyse My Resume{" "}
                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
              <Link
                to="/auth?mode=signup"
                className="glass-card rounded-2xl py-3.5 text-center text-sm font-semibold hover:border-primary/40"
              >
                Create free account
              </Link>
              <span className="text-center text-[11px] uppercase tracking-wider text-outline">
                Free · No card · ~60s
              </span>
            </div>
          </div>
          <div className="mt-12 hidden gap-4 lg:flex">
            {[
              ["73%", "ATS rejections"],
              ["6s", "recruiter scan"],
              ["82", "avg fit score"],
            ].map(([v, l]) => (
              <div key={l} className="glass-card rounded-2xl px-5 py-3">
                <div className="text-2xl font-black text-gradient">{v}</div>
                <div className="text-xs text-on-surface-variant">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 opacity-40">
          <span className="text-[10px] uppercase tracking-widest text-outline">
            Scroll
          </span>
          <ChevronDown size={16} className="animate-bounce text-primary" />
        </div>
      </section>

      <Tape
        items={[
          "Skill Gap Analysis",
          "AI Roadmap",
          "ATS Optimizer",
          "Career Path",
          "Peer Benchmarking",
          "LaTeX Editor",
          "Market Intel",
          "Negotiation Coach",
        ]}
      />

      {/* Proof */}
      <section className="bg-surface-container-low px-6 py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Label n="004" t="Proof" />
          <blockquote
            className="mb-12 max-w-3xl font-black leading-tight"
            style={{ fontSize: "clamp(22px, 3vw, 40px)" }}
          >
            &ldquo;Gapminer showed my resume targeted a role from{" "}
            <span className="text-gradient">two years ago</span>. Offer in 3
            weeks.&rdquo;
          </blockquote>
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              [
                'The pipeline caught "responsible for" 14 times.',
                "Sarah J.",
                "Figma",
              ],
              [
                "Paid a coach $400 for what Gapminer gave free.",
                "Mark T.",
                "Datadog",
              ],
              [
                "40% to Staff Eng — gaps written out made it real.",
                "Priya S.",
                "Vercel",
              ],
            ].map(([q, n, co]) => (
              <div key={n} className="glass-card p-7">
                <p className="mb-6 text-sm italic text-on-surface-variant">
                  &ldquo;{q}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg primary-gradient text-xs font-black text-on-primary-fixed">
                    {n[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{n}</div>
                    <div className="text-[11px] uppercase text-outline">
                      {co}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-surface-container-low px-6 py-28 text-center lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-black text-outline/[0.05]"
          style={{ fontSize: "clamp(72px, 14vw, 180px)" }}
        >
          BRIDGE IT
        </div>
        <div className="relative mx-auto max-w-2xl">
          <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-primary/70">
            Your move
          </p>
          <h2
            className="mb-6 font-black tracking-tight"
            style={{ fontSize: "clamp(36px, 6vw, 72px)" }}
          >
            The gap is real. <span className="text-gradient">Close it.</span>
          </h2>
          <p className="mb-8 text-on-surface-variant">
            60 seconds. Five agents. One roadmap.
          </p>
          <Link
            to="/analyze"
            className="primary-gradient inline-flex items-center gap-2 rounded-2xl px-10 py-4 font-bold text-on-primary-fixed shadow-xl shadow-primary/25"
          >
            Analyse My Resume <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
