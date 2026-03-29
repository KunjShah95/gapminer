import { create } from 'zustand'
import type { Analysis, AnalysisStep, AnalysisStatus } from '@gapminer/types'

interface AnalysisState {
  currentAnalysis: Analysis | null
  liveSteps: AnalysisStep[]
  analyses: Analysis[]
  isAnalyzing: boolean
  setCurrentAnalysis: (a: Analysis) => void
  updateStep: (stepId: string, updates: Partial<AnalysisStep>) => void
  setAnalyses: (list: Analysis[]) => void
  setIsAnalyzing: (v: boolean) => void
  updateStatus: (status: AnalysisStatus) => void
  reset: () => void
}

const DEFAULT_STEPS: AnalysisStep[] = [
  { id: 'parse',   label: 'Parsing Documents',        status: 'pending' },
  { id: 'extract', label: 'Extracting Skills',         status: 'pending' },
  { id: 'compare', label: 'Analyzing Gaps',            status: 'pending' },
  { id: 'market',  label: 'Market Intelligence',       status: 'pending' },
  { id: 'bench',   label: 'Bench Strength',            status: 'pending' },
  { id: 'eval',    label: 'Interview Readiness',       status: 'pending' },
  { id: 'roadmap', label: 'Generating Roadmap',        status: 'pending' },
]

export const useAnalysisStore = create<AnalysisState>((set) => ({
  currentAnalysis: null,
  liveSteps: [...DEFAULT_STEPS],
  analyses: [],
  isAnalyzing: false,
  setCurrentAnalysis: (a) => set({ currentAnalysis: a }),
  updateStep: (stepId, updates) =>
    set((s) => ({
      liveSteps: s.liveSteps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
    })),
  setAnalyses: (list) => set({ analyses: list }),
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  updateStatus: (status) =>
    set((s) => ({
      currentAnalysis: s.currentAnalysis
        ? { ...s.currentAnalysis, status }
        : null,
    })),
  reset: () =>
    set({
      currentAnalysis: null,
      liveSteps: [...DEFAULT_STEPS],
      isAnalyzing: false,
    }),
}))
