import { useState, useEffect, useRef } from "react";

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / 1800, 1);
          setCount(Math.floor((1 - Math.pow(1 - p, 4)) * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
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

export default function AboutPage() {
  return (
    <section className="px-6 pt-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Label n="001" t="The Problem" />
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-12">
            <h2
              className="mb-8 font-black leading-tight tracking-tight"
              style={{ fontSize: "clamp(32px, 5vw, 64px)" }}
            >
              Resumes written for the{" "}
              <span className="text-gradient">wrong reader.</span>
            </h2>
            <p className="mx-auto max-w-2xl text-on-surface-variant leading-relaxed">
              You obsess over fonts; the ATS already filtered you out. Gapminer
              surfaces the precise delta and a plan to close it.{" "}
              <span className="font-medium text-on-surface">
                The gap was always there.
              </span>
            </p>
          </div>
          <div className="mx-auto max-w-xl">
            {(
              [
                [73, "%", "Never reach a human", "LinkedIn 2024"],
                [6, "s", "Recruiter scan time", "Ladders study"],
                [250, "+", "Apps per role", "SHRM"],
                [11, "%", "Know their skill gaps", "Gapminer benchmark"],
              ] as const
            ).map(([n, u, l, note]) => (
              <div
                key={l}
                className="grid grid-cols-[90px_1fr] gap-4 border-b border-outline-variant/15 py-6"
              >
                <div className="text-4xl font-black text-primary">
                  <Counter target={n} suffix={u} />
                </div>
                <div>
                  <div className="text-sm font-semibold">{l}</div>
                  <div className="text-[11px] uppercase tracking-wider text-outline">
                    {note}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
