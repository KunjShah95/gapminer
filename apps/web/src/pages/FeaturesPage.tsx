import { Link } from "react-router-dom";
import { ArrowRight, Zap, Target, BarChart3, FileText } from "lucide-react";

function RadarGlyph() {
  const skills = [78, 91, 64, 88, 73, 82];
  const labels = [
    "Frontend",
    "Execution",
    "Data",
    "Backend",
    "Soft",
    "Strategy",
  ];
  const n = skills.length,
    cx = 120,
    cy = 120,
    r = 90;
  const pt = (v: number, i: number, rad = r) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const d = (v / 100) * rad + (rad === r ? 12 : 0);
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
  };
  const poly = skills.map((v, i) => pt(v, i).join(",")).join(" ");
  return (
    <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden>
      {[0.3, 0.55, 0.78, 1].map((ring) => (
        <polygon
          key={ring}
          points={skills
            .map((_, i) => pt(100 * ring, i, r * ring).join(","))
            .join(" ")}
          fill="none"
          stroke="rgba(59,91,219,0.15)"
          strokeWidth="1"
        />
      ))}
      {skills.map((_, i) => {
        const [x2, y2] = pt(100, i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke="rgba(59,91,219,0.12)"
          />
        );
      })}
      <polygon
        points={poly}
        fill="rgba(59,91,219,0.18)"
        stroke="#3B5BDB"
        strokeWidth="2"
      />
      {skills.map((v, i) => {
        const [x, y] = pt(v, i);
        return <circle key={i} cx={x} cy={y} r="3.5" fill="#6A85F6" />;
      })}
      {labels.map((l, i) => {
        const [x, y] = pt(100, i, r + 18);
        return (
          <text
            key={l}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fontWeight="700"
            fill="rgba(249,245,253,0.55)"
          >
            {l}
          </text>
        );
      })}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fontSize="22"
        fontWeight="900"
        fill="#6A85F6"
      >
        82
      </text>
    </svg>
  );
}

const AGENTS = [
  ["01", "Parser", "PDF structure, hierarchy, density signals."],
  ["02", "Extractor", "10,000+ skill taxonomy mapping."],
  ["03", "Analyst", "Gap matrix with severity scores."],
  ["04", "Pathfinder", "ROI-ordered learning roadmap."],
  ["05", "Market Intel", "Salary bands and demand velocity."],
] as const;

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

export default function FeaturesPage() {
  return (
    <>
      <section className="bg-surface-container-low px-6 pb-28 pt-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Label n="002" t="The Engine" />
          <h2
            className="mb-3 font-black tracking-tight"
            style={{ fontSize: "clamp(30px, 4vw, 56px)" }}
          >
            Five agents. <span className="text-gradient">One verdict.</span>
          </h2>
          <p className="mb-12 max-w-lg text-on-surface-variant">
            Full professional audit in under 60 seconds.
          </p>
          <div className="grid gap-4 lg:grid-cols-5">
            {AGENTS.map(([num, name, desc]) => (
              <div
                key={num}
                className="glass-card p-5 transition hover:border-primary/30"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 text-xs font-black text-primary">
                  {num}
                </div>
                <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-primary/80">
                  {name}
                </div>
                <p className="text-sm text-on-surface-variant">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <div className="glass-card p-6">
              <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-primary/70">
                Live preview
              </div>
              <div className="mx-auto aspect-square max-w-[260px]">
                <RadarGlyph />
              </div>
            </div>
            <div className="glass-card p-6 font-mono text-sm">
              <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-primary/70">
                Terminal
              </div>
              {[
                "> Parsing resume...",
                "  ✓ 847 tokens",
                "  ✗ Kubernetes: MISSING",
                "  ✓ React: STRONG",
                "> Score: 82/100",
              ].map((l) => (
                <div
                  key={l}
                  className={`mb-1 ${l.includes("✗") ? "text-error" : l.includes("✓") ? "text-emerald-400" : l.includes("82") ? "text-primary" : "text-on-surface-variant"}`}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Label n="003" t="The Arsenal" />
          <div className="grid grid-cols-12 gap-4">
            {[
              {
                icon: Target,
                title: "Career Path Predictor",
                desc: "Probability-weighted roles with timelines.",
                span: "col-span-12 lg:col-span-7 row-span-2",
              },
              {
                icon: FileText,
                title: "ATS Optimizer",
                desc: "Bullets matched to ATS linguistic patterns.",
                span: "col-span-12 lg:col-span-5",
              },
              {
                icon: BarChart3,
                title: "Demand Heatmap",
                desc: "Live skill velocity by role and region.",
                span: "col-span-12 lg:col-span-5",
              },
              {
                icon: Zap,
                title: "LaTeX Editor",
                desc: "ATS-proof resumes with live PDF preview.",
                span: "col-span-12 lg:col-span-4 row-span-2",
                link: "/latex",
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`glass-card flex flex-col justify-between p-7 hover:border-primary/30 ${f.span}`}
              >
                <div>
                  <f.icon className="mb-3 text-primary" size={20} />
                  <h3 className="mb-2 text-xl font-black">{f.title}</h3>
                  <p className="text-sm text-on-surface-variant">{f.desc}</p>
                </div>
                {"link" in f && f.link && (
                  <Link
                    to={f.link}
                    className="mt-4 flex items-center gap-2 text-sm font-bold text-primary"
                  >
                    Open Editor <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
