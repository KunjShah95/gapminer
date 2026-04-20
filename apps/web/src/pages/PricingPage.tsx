import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Check, Sparkles, ArrowRight, Zap, Building2, Users, CheckCircle, HelpCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { safeReadJson } from '@/lib/authFetch'

const PLANS = [
  {
    id: 'free', name: 'Free', price: 0, period: 'forever',
    desc: 'For engineers exploring their career gaps.',
    features: [
      '3 analyses per month',
      'Basic skill gap report',
      'Radar chart visualization',
      'Skill tag breakdown (matched / missing)',
      'Email support',
    ],
    cta: 'Get started free', highlighted: false, icon: Sparkles,
  },
  {
    id: 'pro', name: 'Pro', price: 12, period: 'month',
    desc: 'For engineers actively leveling up their careers.',
    features: [
      'Unlimited analyses',
      'Full personalized roadmap',
      'Market intelligence per skill',
      'Peer benchmarking',
      'PDF export + shareable link',
      'ATS keyword optimizer',
      'Progress tracker (Learning / Done)',
      'Resume strength score',
      'Priority support',
    ],
    cta: 'Start Pro Trial', highlighted: true, icon: Zap,
  },
  {
    id: 'teams', name: 'Teams', price: 49, period: 'month',
    desc: 'For engineering teams and hiring managers.',
    features: [
      '5 seats included',
      'Everything in Pro',
      'Shared team dashboard',
      'API access',
      'Resume vault (team)',
      'Analytics dashboard',
      'Slack integration',
    ],
    cta: 'Start Team Trial', highlighted: false, icon: Users,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: null, period: 'custom',
    desc: 'For companies scaling technical hiring and L&D.',
    features: [
      'Unlimited seats',
      'On-prem deployment option',
      'SSO (SAML/OIDC)',
      'Custom skill taxonomy',
      'ATS integrations',
      'SLA & uptime guarantees',
      '24/7 dedicated support',
    ],
    cta: 'Contact Sales', highlighted: false, icon: Building2,
  },
]

const COMPARISON = [
  { feature: 'Analyses / month', free: '1', pro: 'Unlimited', teams: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Skill gap report', free: 'Basic', pro: 'Full + confidence', teams: 'Full + confidence', enterprise: 'Full + confidence' },
  { feature: 'Roadmap generation', free: '❌', pro: '✅', teams: '✅', enterprise: '✅' },
  { feature: 'Market intelligence', free: '❌', pro: '✅', teams: '✅', enterprise: '✅' },
  { feature: 'Peer benchmarking', free: '❌', pro: '✅', teams: '✅', enterprise: '✅' },
  { feature: 'PDF export', free: '❌', pro: '✅', teams: '✅', enterprise: '✅' },
  { feature: 'ATS optimizer', free: '❌', pro: '✅', teams: '✅', enterprise: '✅' },
  { feature: 'Progress tracker', free: '❌', pro: '✅', teams: '✅', enterprise: '✅' },
  { feature: 'Team dashboard', free: '❌', pro: '❌', teams: '✅', enterprise: '✅' },
  { feature: 'API access', free: '❌', pro: '❌', teams: '✅', enterprise: '✅' },
  { feature: 'SSO', free: '❌', pro: '❌', teams: '❌', enterprise: '✅' },
  { feature: 'On-prem', free: '❌', pro: '❌', teams: '❌', enterprise: '✅' },
]

const FAQS = [
  {
    q: 'Is the free plan really free forever?',
    a: 'Yes. The Free plan has no time limit. You get 3 analyses per month, every month.',
  },
  {
    q: 'Does GapMiner share my resume data?',
    a: 'No. We use local AI models (Ollama). Your resume data is encrypted and never shared with external API providers like OpenAI.',
  },
  {
    q: 'How accurate is the gap analysis?',
    a: 'Our benchmark shows 94% precision. We use advanced semantic embeddings to understand the "meaning" of skills, not just keyword matching.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. Cancel anytime from your account settings. No cancellation fees, no questions asked.',
  },
]

export default function PricingPage() {
  const { user, token } = useAuthStore()
  const navigate = useNavigate()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      navigate('/auth?signup=true')
      return
    }

    if (!user || !token) {
      navigate(`/auth?signup=true&plan=${planId}`)
      return
    }

    setLoadingPlan(planId)
    try {
      const response = await fetch('/api/v1/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      })

      const data = await safeReadJson<any>(response, {})
      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to start checkout session')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert('An error occurred. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      {/* Fixed Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#19191f]/80 backdrop-blur-xl border-b border-[#48474d]/15">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <Link to="/" className="text-2xl font-semibold tracking-tighter text-[#f9f5fd] flex items-center gap-2">
            <Sparkles className="text-primary" size={24} />
            Gapminer
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/auth" className="text-[#acaab1] hover:text-[#f9f5fd] transition-colors font-medium px-4">Login</Link>
            <Link to="/auth?signup=true" className="primary-gradient text-on-primary-fixed px-6 py-2.5 rounded-full font-semibold">Start Free</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="text-primary font-bold tracking-widest uppercase text-sm">Pricing</span>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-tight mt-4 mb-6 font-headline">
              Simple, Transparent <br />
              <span className="text-gradient">Career Intelligence</span>
            </h1>
            <p className="text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed font-light">
              Choose the plan that fits your career stage. No hidden fees, cancel anytime.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid lg:grid-cols-4 gap-8 mb-32">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`glass bg-surface-container-high p-8 rounded-3xl border ${plan.highlighted ? 'border-primary ring-4 ring-primary/5' : 'border-outline-variant/15'} flex flex-col relative group hover:-translate-y-2 transition-transform duration-300`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary-fixed px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Most Popular</div>
                )}
                <div className="w-12 h-12 rounded-2xl bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center mb-6 text-primary">
                  <plan.icon size={24} />
                </div>
                <h3 className="font-bold text-2xl mb-2">{plan.name}</h3>
                <div className="mb-4">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tighter">${plan.price}</span>
                      <span className="text-outline text-sm">/{plan.period}</span>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold tracking-tighter">Custom</div>
                  )}
                </div>
                <p className="text-on-surface-variant text-sm mb-8 leading-relaxed font-light">{plan.desc}</p>
                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-on-surface-variant">
                      <CheckCircle className="text-primary shrink-0 mt-0.5" size={16} />
                      <span className="leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.id === 'enterprise' ? (
                  <Link
                    to="/contact"
                    className="w-full py-4 rounded-full font-bold text-center transition-all flex items-center justify-center gap-2 group/btn glass border border-outline-variant/20 hover:bg-surface-container-highest"
                  >
                    {plan.cta}
                    <ArrowRight className="group-hover/btn:translate-x-1 transition-transform" size={18} />
                  </Link>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loadingPlan !== null}
                    className={`w-full py-4 rounded-full font-bold text-center transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-50 ${
                      plan.highlighted 
                        ? 'primary-gradient text-on-primary-fixed shadow-lg hover:shadow-primary/20' 
                        : 'glass border border-outline-variant/20 hover:bg-surface-container-highest'
                    }`}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight className="group-hover/btn:translate-x-1 transition-transform" size={18} />
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <section className="mb-32">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight font-headline">Full Feature Comparison</h2>
              <p className="text-on-surface-variant mt-2 font-light">Deep dive into every capability across our tiers.</p>
            </div>
            <div className="glass bg-surface-container-highest/50 rounded-[2rem] border border-outline-variant/15 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-highest border-b border-outline-variant/20">
                      <th className="px-8 py-6 font-bold text-sm uppercase tracking-widest text-outline">Capability</th>
                      <th className="px-8 py-6 font-bold text-sm uppercase tracking-widest text-outline text-center">Free</th>
                      <th className="px-8 py-6 font-bold text-sm uppercase tracking-widest text-primary text-center">Pro</th>
                      <th className="px-8 py-6 font-bold text-sm uppercase tracking-widest text-outline text-center">Teams</th>
                      <th className="px-8 py-6 font-bold text-sm uppercase tracking-widest text-outline text-center">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-on-surface-variant">
                    {COMPARISON.map((row) => (
                      <tr key={row.feature} className="hover:bg-primary/5 transition-colors">
                        <td className="px-8 py-6 font-medium text-on-surface">{row.feature}</td>
                        <td className="px-8 py-6 text-center">{row.free}</td>
                        <td className="px-8 py-6 text-center font-bold text-on-surface border-x border-primary/10 bg-primary/2">{row.pro}</td>
                        <td className="px-8 py-6 text-center">{row.teams}</td>
                        <td className="px-8 py-6 text-center">{row.enterprise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                <HelpCircle size={24} />
              </div>
              <h2 className="text-3xl font-bold font-headline">Have Questions?</h2>
              <p className="text-on-surface-variant font-light mt-2">Everything you need to know about our service.</p>
            </div>
            <div className="grid gap-4">
              {FAQS.map((faq, i) => (
                <div key={i} className="glass bg-surface-container border border-outline-variant/15 p-8 rounded-3xl hover:border-primary/30 transition-colors">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    {faq.q}
                  </h3>
                  <p className="text-on-surface-variant leading-relaxed font-light">{faq.a}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center text-outline text-sm">
              Still have questions? <Link to="/contact" className="text-primary hover:underline">Contact our support team →</Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer (Simplified) */}
      <footer className="border-t border-outline-variant/10 py-12 bg-surface-container-lowest/50">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-on-surface font-bold">
            <Sparkles className="text-primary" size={20} />
            Gapminer
          </div>
          <div className="text-sm text-outline font-light">
            © 2024 Gapminer. All rights reserved. Precision Career Intelligence.
          </div>
          <div className="flex gap-6 text-sm text-outline">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
