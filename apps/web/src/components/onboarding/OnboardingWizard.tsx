import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuthStore } from "@/stores/authStore";

interface OnboardingWizardProps {
  open: boolean;
}

export default function OnboardingWizard({ open }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const { completeWizard, completeStep } = useOnboardingStore();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    currentRole: "",
    experienceLevel: "",
    targetRole: "",
    topSkills: "",
    linkedInUrl: "",
  });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSkip = () => {
    completeWizard();
  };

  const handleFinish = (action?: string) => {
    completeWizard();
    if (action === "analyze") navigate("/analyze");
    else if (action === "market") navigate("/market-demand");
  };

  const handleNext = () => {
    if (step < 3) setStep((s) => s + 1);
  };

  const saveProfile = async () => {
    try {
      const token = useAuthStore.getState().token;
      const body: Record<string, string> = {};
      if (profile.currentRole) body.currentRole = profile.currentRole;
      if (profile.experienceLevel)
        body.experienceLevel = profile.experienceLevel;
      if (profile.targetRole) body.targetRole = profile.targetRole;
      if (profile.topSkills) body.topSkills = profile.topSkills;
      if (profile.linkedInUrl) body.linkedInUrl = profile.linkedInUrl;
      if (Object.keys(body).length === 0) return;
      setSaving(true);
      await fetch("/api/v1/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    } catch {
      /* silent fail */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface-container-high border border-outline-variant/20 rounded-[2.5rem] p-10 max-w-lg w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-outline/20"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="text-center">
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="text-2xl font-extrabold tracking-tighter mb-3 font-headline">
              Bridge your skills to market demand
            </h2>
            <p className="text-on-surface-variant font-light leading-relaxed mb-8">
              AI-powered analysis. Personalized roadmaps. Real-time market
              intelligence.
            </p>
            <div className="flex gap-4 justify-center mb-8">
              <div className="bg-surface-container rounded-2xl p-4 flex-1 max-w-[140px]">
                <div className="text-primary text-2xl font-black">93%</div>
                <div className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1">
                  Match Accuracy
                </div>
              </div>
              <div className="bg-surface-container rounded-2xl p-4 flex-1 max-w-[140px]">
                <div className="text-primary text-2xl font-black">5K+</div>
                <div className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1">
                  Roles Indexed
                </div>
              </div>
            </div>
            <button
              onClick={handleNext}
              className="primary-gradient text-on-primary-fixed px-8 py-3.5 rounded-2xl font-bold shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
            >
              Get Started
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-extrabold tracking-tighter mb-2 font-headline">
              Set up your profile
            </h2>
            <p className="text-on-surface-variant font-light text-sm mb-6">
              Help us personalize your analysis. You can skip or change these
              later.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
                  Current Role
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 mt-1 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
                  placeholder="e.g. Software Engineer"
                  value={profile.currentRole}
                  onChange={(e) =>
                    setProfile({ ...profile, currentRole: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
                  Experience Level
                </label>
                <select
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 mt-1 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface"
                  value={profile.experienceLevel}
                  onChange={(e) =>
                    setProfile({ ...profile, experienceLevel: e.target.value })
                  }
                >
                  <option value="">Select level</option>
                  <option value="entry">Entry (0-2 years)</option>
                  <option value="mid">Mid (3-5 years)</option>
                  <option value="senior">Senior (6-9 years)</option>
                  <option value="lead">Lead (10+ years)</option>
                  <option value="exec">Executive</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
                  Target Role
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 mt-1 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
                  placeholder="e.g. Senior Software Engineer"
                  value={profile.targetRole}
                  onChange={(e) =>
                    setProfile({ ...profile, targetRole: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
                  Top Skills
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 mt-1 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
                  placeholder="React, Node.js, TypeScript"
                  value={profile.topSkills}
                  onChange={(e) =>
                    setProfile({ ...profile, topSkills: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
                  LinkedIn Profile URL
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 mt-1 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={profile.linkedInUrl}
                  onChange={(e) =>
                    setProfile({ ...profile, linkedInUrl: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSkip}
                className="flex-1 glass border border-outline-variant/20 py-3.5 rounded-2xl font-bold text-sm hover:bg-surface-container-highest transition-all"
              >
                Skip
              </button>
              <button
                onClick={async () => {
                  await saveProfile();
                  completeStep(1);
                  handleNext();
                }}
                disabled={saving}
                className="flex-[2] primary-gradient text-on-primary-fixed py-3.5 rounded-2xl font-bold shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50"
              >
                {saving ? "Saving..." : "Continue"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-extrabold tracking-tighter mb-2 font-headline text-center">
              What would you like to do first?
            </h2>
            <p className="text-on-surface-variant font-light text-sm mb-8 text-center">
              Pick a starting point — you can always change later.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleFinish("analyze")}
                className="w-full glass border border-outline-variant/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-surface-container-higher transition-all text-left group"
              >
                <span className="text-2xl">📄</span>
                <div>
                  <div className="font-bold group-hover:text-primary transition-colors">
                    Upload resume &amp; run analysis
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    See how your skills match today's market
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleFinish("market")}
                className="w-full glass border border-outline-variant/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-surface-container-higher transition-all text-left group"
              >
                <span className="text-2xl">🔍</span>
                <div>
                  <div className="font-bold group-hover:text-primary transition-colors">
                    Explore market demand
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    See which skills are trending in your field
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleFinish()}
                className="w-full glass border border-outline-variant/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-surface-container-higher transition-all text-left group"
              >
                <span className="text-2xl">🤷</span>
                <div>
                  <div className="font-bold group-hover:text-primary transition-colors">
                    Just show me the dashboard
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    I'll explore on my own
                  </div>
                </div>
              </button>
            </div>
            <div className="text-center mt-6">
              <button
                onClick={handleSkip}
                className="text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                Skip tour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
