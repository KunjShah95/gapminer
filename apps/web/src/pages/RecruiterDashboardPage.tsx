import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, UserPlus, Search, Filter, 
  BarChart4, ArrowUpRight, TrendingUp,
  Cpu, Zap, Briefcase, Globe, Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MOCK_CANDIDATES = [
  { id: '1', name: 'Alex Rivera', role: 'Fullstack Engineer', score: 94, potential: 98, status: 'Internal', skills: ['React', 'Node.js', 'Go'] },
  { id: '2', name: 'Jordan Smith', role: 'DevOps Lead', score: 88, potential: 92, status: 'Candidate', skills: ['Kubernetes', 'AWS', 'Terraform'] },
  { id: '3', name: 'Sarah Chen', role: 'Data Scientist', score: 91, potential: 95, status: 'Internal', skills: ['Python', 'PyTorch', 'SQL'] },
  { id: '4', name: 'Michael Brown', role: 'Backend Dev', score: 76, potential: 89, status: 'External', skills: ['Java', 'Spring', 'PostgreSQL'] },
]

export default function RecruiterDashboardPage() {
  const [activeTab, setActiveTab] = useState('ranking')

  return (
    <div className="flex flex-col h-full bg-surface-container-low p-8 font-body overflow-hidden">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tight skew-x-[-2deg]">Talent Intelligence <span className="text-primary italic">Enterprise</span></h1>
          <p className="text-on-surface-variant font-medium text-xs uppercase tracking-[0.2em] mt-2">Aggregate Bench Strength & Talent Ranking</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-outline-variant/15 shadow-sm">
             <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Worker status: Online</span>
           </div>
           <button className="primary-gradient text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
             Batch Upload (1000+)
           </button>
        </div>
      </div>

      {/* ── Statistics ─────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Scanned', value: '4,281', icon: Users, color: 'primary' },
          { label: 'Internal Potentials', value: '182', icon: TrendingUp, color: 'tertiary' },
          { label: 'Project Readiness', value: '72%', icon: BarChart4, color: 'success' },
          { label: 'Avg Skill Gap', value: '14%', icon: ArrowUpRight, color: 'error' },
        ].map((stat) => (
          <div key={stat.label} className="glass bg-surface-container-high p-8 rounded-[2.5rem] border border-outline-variant/10 group hover:border-primary/20 transition-all">
             <div className="flex items-center justify-between mb-4">
               <div className={`w-10 h-10 rounded-xl bg-${stat.color}/10 flex items-center justify-center text-${stat.color}`}>
                 <stat.icon size={20} />
               </div>
               <TrendingUp size={16} className="text-success opacity-40" />
             </div>
             <div className="text-2xl font-black tracking-tight">{stat.value}</div>
             <div className="text-[10px] font-black uppercase tracking-widest text-outline mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main View ──────────────────────────────────────── */}
      <div className="flex-grow flex gap-8 overflow-hidden">
        {/* Left: Talent List */}
        <div className="flex-grow flex flex-col glass bg-white p-10 rounded-[3rem] border border-outline-variant/10 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               {['Talent Ranking', 'Bench Strength', 'Network Map'].map((t) => (
                 <button 
                  key={t}
                  onClick={() => setActiveTab(t.toLowerCase().split(' ')[0])}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === t.toLowerCase().split(' ')[0] ? "bg-surface-container-highest text-on-surface shadow-sm ring-1 ring-outline-variant/20" : "text-outline hover:text-on-surface"
                  )}
                 >
                   {t}
                 </button>
               ))}
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <input 
                className="bg-surface-container rounded-2xl pl-12 pr-6 py-2.5 text-xs outline-none border border-outline-variant/10 focus:border-primary transition-all w-64"
                placeholder="Search talent cluster..."
              />
            </div>
          </div>

          <div className="flex-grow overflow-auto custom-scrollbar pr-2">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/10 h-14">
                  <th className="text-[10px] font-black uppercase tracking-widest text-outline pl-4">Talent Profile</th>
                  <th className="text-[10px] font-black uppercase tracking-widest text-outline">Matching Score</th>
                  <th className="text-[10px] font-black uppercase tracking-widest text-outline">Up-skill Potential</th>
                  <th className="text-[10px] font-black uppercase tracking-widest text-outline">Status</th>
                  <th className="pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CANDIDATES.map((c) => (
                  <tr key={c.id} className="group border-b border-outline-variant/5 hover:bg-surface-container/30 transition-all rounded-2xl">
                    <td className="py-6 pl-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center text-primary font-black">
                           {c.name.charAt(0)}
                         </div>
                         <div>
                            <div className="text-sm font-bold tracking-tight">{c.name}</div>
                            <div className="text-[10px] font-medium text-outline">{c.role}</div>
                         </div>
                       </div>
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-surface-container rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${c.score}%` }} className="h-full bg-primary" />
                        </div>
                        <span className="text-xs font-black">{c.score}%</span>
                      </div>
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-2">
                         <div className="px-3 py-1 bg-tertiary/10 border border-tertiary/20 text-[9px] font-bold text-tertiary rounded-full uppercase">
                           Level: {c.potential > 94 ? 'Critical' : 'High'}
                         </div>
                         <span className="text-xs font-black">{c.potential}%</span>
                      </div>
                    </td>
                    <td className="py-6">
                       <div className={cn(
                         "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border inline-block",
                         c.status === 'Internal' ? "bg-success/10 border-success/30 text-success" : "bg-primary/10 border-primary/30 text-primary"
                       )}>
                         {c.status}
                       </div>
                    </td>
                    <td className="py-6 pr-4 text-right">
                       <button className="p-2 text-outline hover:text-primary transition-colors">
                          <ArrowUpRight size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Insights & Bench Intelligence */}
        <aside className="w-96 flex flex-col gap-8 shrink-0">
           <div className="glass bg-[#1a1a1a] p-10 rounded-[3rem] border border-white/5 text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10">
               <Zap size={100} className="group-hover:scale-110 transition-transform duration-700" />
             </div>
             
             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-8">Skill Scarcity Map</h3>
             <div className="space-y-6">
                {[
                  { skill: 'Rust (Concurrency)', scarcity: 92 },
                  { skill: 'gRPC/Protobuf', scarcity: 78 },
                  { skill: 'Solana Dev', scarcity: 86 },
                ].map((s) => (
                  <div key={s.skill} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white/60">{s.skill}</span>
                      <span className="text-xs font-black text-primary">{s.scarcity}% Scarcity</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[92%]" />
                    </div>
                  </div>
                ))}
             </div>
             
             <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-3xl">
                <p className="text-[10px] text-white/40 leading-relaxed font-medium italic">
                  "Critical scarcity detected in Rust systems. 14 internal candidates identified with 85% up-skilling potential."
                </p>
                <button className="w-full mt-6 py-3 bg-primary text-white font-black text-[9px] uppercase tracking-widest rounded-xl">
                   Identify Internal Bench
                </button>
             </div>
           </div>

           <div className="glass bg-white p-10 rounded-[3rem] border border-outline-variant/10 shadow-2xl flex-grow">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-outline mb-8">Pipeline Activity</h3>
              <div className="space-y-6">
                 {[1,2,3].map((_, i) => (
                   <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline">
                        <Cpu size={14} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold">Resumes processing...</div>
                        <div className="text-[9px] text-on-surface-variant font-medium mt-1">Status: Agent workflow active</div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </aside>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .primary-gradient { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); }
      `}</style>
    </div>
  )
}
