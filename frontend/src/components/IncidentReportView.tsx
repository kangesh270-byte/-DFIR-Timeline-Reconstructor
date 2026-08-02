import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Tag,
  ChevronLeft,
  Sparkles,
  Award,
  Clock,
  User,
  Target,
  Network,
  Activity,
  ArrowRight,
  Sun,
  Moon,
  FileCode,
  Zap,
  Check,
  X,
  HelpCircle,
  BarChart3,
  ListFilter,
  CheckCircle,
  Flame,
  Key,
  Database,
  Lock,
} from 'lucide-react';
import {
  Scenario,
  EvidenceCard,
  KillChainStage,
  RelationshipLink,
  EvaluationResult,
  UserStats,
  UserPlacement,
} from '../types';
import { evaluateTimeline } from '../utils/scoringEngine';
import { generateVectorPdfReport } from '../utils/pdfGenerator';
import { cyberAudio } from '../utils/audio';

interface IncidentReportViewProps {
  scenario?: Scenario;
  placedCards?: EvidenceCard[];
  assignedMitreMap?: Map<string, string[]>;
  assignedKillChainMap?: Map<string, KillChainStage>;
  relationships?: RelationshipLink[];
  evaluationResult?: EvaluationResult | null;
  userStats?: UserStats;
  onBackToScenarios?: () => void;
  onReturnToWorkspace?: () => void;
}

export const IncidentReportView: React.FC<IncidentReportViewProps> = ({
  scenario,
  placedCards,
  assignedMitreMap = new Map(),
  assignedKillChainMap = new Map(),
  relationships = [],
  evaluationResult,
  userStats = {
    username: 'Alex_Vance_DFIR',
    title: 'Lead Incident Responder',
    xp: 2250,
    level: 5,
    labsCompleted: 4,
    averageAccuracy: 88,
    totalTimeSpentMinutes: 82,
    badges: [],
    recentSessions: [],
  },
  onBackToScenarios,
  onReturnToWorkspace,
}) => {
  const [activePage, setActivePage] = useState<number | 'all'>('all');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  // Compute or fall back to live evaluation if none provided
  const effectivePlacedCards = useMemo(() => {
    if (placedCards && placedCards.length > 0) return placedCards;
    return scenario.evidenceCards;
  }, [placedCards, scenario]);

  const evaluation: EvaluationResult = useMemo(() => {
    if (evaluationResult) return evaluationResult;

    const userPlacements: UserPlacement[] = effectivePlacedCards.map((card, idx) => ({
      evidenceId: card.id,
      orderIndex: idx,
      assignedMitreTechniqueIds: assignedMitreMap.get(card.id) || card.correctMitreTechniques.map((t) => t.id),
      assignedKillChainStage: assignedKillChainMap.get(card.id) || card.correctKillChain,
    }));

    const effectiveRels = relationships.length > 0 ? relationships : scenario.referenceRelationships;
    return evaluateTimeline(scenario, userPlacements, effectiveRels, 320);
  }, [evaluationResult, effectivePlacedCards, assignedMitreMap, assignedKillChainMap, relationships, scenario]);

  const caseId = `DFIR-CASE-2026-${scenario.id.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
  const nowUtc = useMemo(() => new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC', []);

  // Action handlers
  const handlePrint = () => {
    cyberAudio.playClick();
    window.print();
  };

  const handleDownloadPdf = () => {
    cyberAudio.playClick();
    generateVectorPdfReport(
      scenario,
      effectivePlacedCards,
      assignedMitreMap,
      assignedKillChainMap,
      relationships,
      evaluation,
      userStats
    );
  };

  const handleDownloadJson = () => {
    cyberAudio.playClick();
    const relationshipFlow = (evaluation as EvaluationResult & { relationshipFlow?: Array<{ from: string; to: string; reason: string; mitre_technique: string; attack_stage: string }> }).relationshipFlow ?? [];
    const exportData = {
      reportType: 'DFIR Forensic Investigation Report',
      caseId,
      generatedAt: nowUtc,
      scenario: {
        id: scenario.id,
        title: scenario.title,
        difficulty: scenario.difficulty,
        category: scenario.category,
        threatActor: scenario.threatActor,
        targetHost: scenario.targetHost,
      },
      investigator: userStats,
      evaluation,
      reconstructedTimeline: effectivePlacedCards.map((card, idx) => ({
        step: idx + 1,
        id: card.id,
        timestamp: card.timestamp,
        title: card.title,
        category: card.category,
        severity: card.severity,
        source: card.source,
        assignedMitre: assignedMitreMap.get(card.id) || card.correctMitreTechniques.map((m) => m.id),
        assignedKillChain: assignedKillChainMap.get(card.id) || card.correctKillChain,
      })),
      relationships: relationships.length > 0 ? relationships : scenario.referenceRelationships,
      relationshipFlow,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `${caseId}_Forensic_Report.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  // Helper check for chronological ordering correctness
  const isCardInCorrectSequence = (card: EvidenceCard, idx: number) => {
    if (idx === 0) return true;
    const prevCard = effectivePlacedCards[idx - 1];
    return prevCard.trueTimestampMs <= card.trueTimestampMs;
  };

  return (
    <div
      className={`min-h-screen transition-colors font-sans pb-16 ${
        themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Printable CSS overrides */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            page-break-after: always !important;
            break-after: page !important;
            padding: 2.5rem !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            background: white !important;
            color: #0f172a !important;
            margin-bottom: 0 !important;
            min-h-0 !important;
          }
          .print-page-content {
            color: #0f172a !important;
          }
        }
      `}</style>

      {/* Navigation & Controls Bar */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3 px-4 shadow-xl no-print">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 text-xs font-mono">
          {/* Back & Title */}
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center space-x-2">
              {onReturnToWorkspace && (
                <button
                  onClick={() => {
                    cyberAudio.playClick();
                    onReturnToWorkspace();
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold"
                >
                  <ChevronLeft className="w-4 h-4 text-cyan-400" />
                  <span>WORKSPACE</span>
                </button>
              )}
              {onBackToScenarios && (
                <button
                  onClick={() => {
                    cyberAudio.playClick();
                    onBackToScenarios();
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold"
                >
                  <span>LABS</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-400">
              <Shield className="w-3.5 h-3.5" />
              <span className="font-bold">DFIR REPORT GENERATOR</span>
            </div>
          </div>

          {/* Page Selector Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto max-w-full py-1 scrollbar-none">
            <button
              onClick={() => setActivePage('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                activePage === 'all'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              SHOW ALL 10 PAGES
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
              <button
                key={p}
                onClick={() => setActivePage(p)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  activePage === p
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                P{p}
              </button>
            ))}
          </div>

          {/* Theme & Export Actions */}
          <div className="flex items-center space-x-2 w-full lg:w-auto justify-end">
            <button
              onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300"
              title="Toggle Light/Dark Theme"
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold"
            >
              <FileCode className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">VECTOR PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
            >
              <Printer className="w-4 h-4 fill-slate-950" />
              <span>PRINT / SAVE PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Document Content Area */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* PAGE 1: COVER PAGE */}
        {(activePage === 'all' || activePage === 1) && (
          <div
            className={`print-page rounded-3xl p-8 md:p-12 space-y-10 shadow-2xl relative overflow-hidden border ${
              themeMode === 'dark'
                ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* Top Security Stripe */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600" />

            {/* Header Branding */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-6 print:border-slate-300">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-mono font-extrabold text-sm text-emerald-400 tracking-wider">DFIR STUDIO</h3>
                  <p className="text-xs text-slate-400 font-mono">CYBER RANGE & FORENSIC RECONSTRUCTION PLATFORM</p>
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <span className="px-3 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 font-bold">
                  RESTRICTED • TLP:AMBER
                </span>
              </div>
            </div>

            {/* Title Display Block */}
            <div className="space-y-4 py-6">
              <div className="inline-flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                <span>OFFICIAL INCIDENT INVESTIGATION REPORT</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold font-mono text-white print:text-slate-900 leading-tight">
                {scenario.title}
              </h1>
              <p className="text-slate-400 text-sm font-sans max-w-2xl leading-relaxed print:text-slate-700">
                A data-driven, evidence-based forensic investigation report detailing attack vectors, chronological sequence reconstruction, MITRE ATT&CK coverage, and AI-driven security posture critique.
              </p>
            </div>

            {/* Case Metadata Grid Box */}
            <div className="p-6 md:p-8 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-6 font-mono text-xs print:bg-slate-50 print:border-slate-300">
              <h4 className="font-bold text-cyan-400 uppercase text-xs tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>CASE METADATA & INVESTIGATION RECORD</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <div className="flex justify-between border-b border-slate-800/60 pb-2 print:border-slate-200">
                  <span className="text-slate-500 uppercase">CASE ID</span>
                  <span className="font-bold text-slate-200 print:text-slate-900">{caseId}</span>
                </div>

                <div className="flex justify-between border-b border-slate-800/60 pb-2 print:border-slate-200">
                  <span className="text-slate-500 uppercase">SCENARIO CATEGORY</span>
                  <span className="font-bold text-slate-200 print:text-slate-900">{scenario.category}</span>
                </div>

                <div className="flex justify-between border-b border-slate-800/60 pb-2 print:border-slate-200">
                  <span className="text-slate-500 uppercase">THREAT ACTOR</span>
                  <span className="font-bold text-amber-400 print:text-amber-700">{scenario.threatActor}</span>
                </div>

                <div className="flex justify-between border-b border-slate-800/60 pb-2 print:border-slate-200">
                  <span className="text-slate-500 uppercase">TARGET HOST</span>
                  <span className="font-bold text-slate-200 print:text-slate-900">{scenario.targetHost}</span>
                </div>

                <div className="flex justify-between border-b border-slate-800/60 pb-2 print:border-slate-200">
                  <span className="text-slate-500 uppercase">DIFFICULTY RATING</span>
                  <span className="font-bold text-red-400">{scenario.difficulty.toUpperCase()}</span>
                </div>

                <div className="flex justify-between border-b border-slate-800/60 pb-2 print:border-slate-200">
                  <span className="text-slate-500 uppercase">LEAD INVESTIGATOR</span>
                  <span className="font-bold text-cyan-400">{userStats.username} ({userStats.title})</span>
                </div>

                <div className="flex justify-between border-b border-slate-800/60 pb-2 print:border-slate-200">
                  <span className="text-slate-500 uppercase">GENERATED AT</span>
                  <span className="font-bold text-slate-300 print:text-slate-800">{nowUtc}</span>
                </div>

                <div className="flex justify-between border-b border-slate-800/60 pb-2 print:border-slate-200">
                  <span className="text-slate-500 uppercase">ARTIFACTS ANALYZED</span>
                  <span className="font-bold text-emerald-400">{effectivePlacedCards.length} Reconstructed Cards</span>
                </div>
              </div>
            </div>

            {/* Official Certification Seal */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/40 flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
              <div className="space-y-1 text-center md:text-left">
                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest block">
                  DIGITAL FORENSIC VERIFICATION CERTIFICATE
                </span>
                <div className="text-sm font-extrabold text-white print:text-slate-900">
                  Investigation Evaluated Score: {evaluation.score} / 1000 ({evaluation.accuracyPercentage}% Accuracy)
                </div>
              </div>

              <div className="flex items-center space-x-1 text-amber-400 text-lg">
                {'★'.repeat(evaluation.starsEarned)}
                <span className="text-xs text-slate-400 ml-2 font-mono">({evaluation.starsEarned}/3 Stars)</span>
              </div>
            </div>

            {/* Footer Page Number */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500 print:border-slate-300">
              <span>DFIR Timeline Reconstructor • Cover Page</span>
              <span>Page 1 of 10</span>
            </div>
          </div>
        )}

        {/* PAGE 2: EXECUTIVE SUMMARY */}
        {(activePage === 'all' || activePage === 2) && (
          <div
            className={`print-page rounded-3xl p-8 md:p-10 space-y-8 shadow-2xl border ${
              themeMode === 'dark'
                ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* Page Title Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:border-slate-300">
              <div className="flex items-center space-x-2 font-mono text-xs text-cyan-400 font-bold">
                <Activity className="w-4 h-4" />
                <span>PAGE 2 • EXECUTIVE SUMMARY & KEY METRICS</span>
              </div>
              <span className="text-xs font-mono text-slate-500">Case ID: {caseId}</span>
            </div>

            {/* Executive Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-1 print:bg-slate-50 print:border-slate-300">
                <span className="text-[10px] text-slate-500 uppercase block">OVERALL SCORE</span>
                <span className="text-2xl font-extrabold text-emerald-400">{evaluation.score} / 1000</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/30 space-y-1 print:bg-slate-50 print:border-slate-300">
                <span className="text-[10px] text-slate-500 uppercase block">ACCURACY</span>
                <span className="text-2xl font-extrabold text-blue-400">{evaluation.accuracyPercentage}%</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-1 print:bg-slate-50 print:border-slate-300">
                <span className="text-[10px] text-slate-500 uppercase block">XP EARNED</span>
                <span className="text-2xl font-extrabold text-purple-400">+{evaluation.xpGained} XP</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-1 print:bg-slate-50 print:border-slate-300">
                <span className="text-[10px] text-slate-500 uppercase block">INVESTIGATION TIME</span>
                <span className="text-2xl font-extrabold text-amber-400">
                  {Math.floor(evaluation.timeTakenSeconds / 60)}m {evaluation.timeTakenSeconds % 60}s
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                <span className="text-[10px] text-slate-500 uppercase block">SCENARIO DIFFICULTY</span>
                <span className="text-lg font-bold text-red-400">{scenario.difficulty.toUpperCase()}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                <span className="text-[10px] text-slate-500 uppercase block">EVIDENCE COUNT</span>
                <span className="text-lg font-bold text-slate-200 print:text-slate-900">{effectivePlacedCards.length} Cards</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                <span className="text-[10px] text-slate-500 uppercase block">STATUS</span>
                <span className="text-lg font-bold text-emerald-400">
                  {evaluation.accuracyPercentage >= 70 ? 'VERIFIED' : 'REVISION NEEDED'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                <span className="text-[10px] text-slate-500 uppercase block">RATING</span>
                <span className="text-lg font-bold text-amber-400">{'★'.repeat(evaluation.starsEarned)} ({evaluation.starsEarned}/3)</span>
              </div>
            </div>

            {/* Executive AI Narrative */}
            <div className="space-y-3">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2 print:text-slate-900">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>EXECUTIVE AI CRITIQUE & BREACH NARRATIVE</span>
              </h3>
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 leading-relaxed font-sans print:bg-slate-50 print:border-slate-300 print:text-slate-800">
                {evaluation.aiAnalysis.overallSummary}
              </div>
            </div>

            {/* Key Findings List */}
            <div className="space-y-3">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2 print:text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>INVESTIGATION HIGHLIGHTS & KEY FINDINGS</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                  <span className="font-bold font-mono text-cyan-400 block">Root Cause Identification</span>
                  <p className="text-slate-300 print:text-slate-800">
                    Initial entry vector traced to {effectivePlacedCards[0]?.title || 'Phishing email'} with {evaluation.chronologicalAccuracy}% chronological accuracy.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                  <span className="font-bold font-mono text-purple-400 block">MITRE ATT&CK Mapping</span>
                  <p className="text-slate-300 print:text-slate-800">
                    Techniques accurately aligned with {evaluation.mitreAccuracy}% accuracy across initial access, execution, and impact phases.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                  <span className="font-bold font-mono text-amber-400 block">Cyber Kill Chain Alignment</span>
                  <p className="text-slate-300 print:text-slate-800">
                    {evaluation.killChainAccuracy}% of evidence artifacts correctly assigned to standard kill chain stages.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                  <span className="font-bold font-mono text-blue-400 block">Causal Relationships</span>
                  <p className="text-slate-300 print:text-slate-800">
                    {relationships.length > 0 ? relationships.length : scenario.referenceRelationships.length} causal links constructed between root cause and impact.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Page Number */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500 print:border-slate-300">
              <span>DFIR Timeline Reconstructor • Executive Summary</span>
              <span>Page 2 of 10</span>
            </div>
          </div>
        )}

        {/* PAGE 3: INCIDENT OVERVIEW */}
        {(activePage === 'all' || activePage === 3) && (
          <div
            className={`print-page rounded-3xl p-8 md:p-10 space-y-8 shadow-2xl border ${
              themeMode === 'dark'
                ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* Page Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:border-slate-300">
              <div className="flex items-center space-x-2 font-mono text-xs text-cyan-400 font-bold">
                <FileText className="w-4 h-4" />
                <span>PAGE 3 • INCIDENT OVERVIEW & OPERATIONAL CONTEXT</span>
              </div>
              <span className="text-xs font-mono text-slate-500">Case ID: {caseId}</span>
            </div>

            {/* Narrative Scenario */}
            <div className="space-y-3">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2 print:text-slate-900">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>SCENARIO BACKGROUND & OPERATIONAL NARRATIVE</span>
              </h3>
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans print:bg-slate-50 print:border-slate-300 print:text-slate-800">
                {scenario.narrative}
              </div>
            </div>

            {/* Threat Actor & Environment Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 print:bg-slate-50 print:border-slate-300">
                <h4 className="font-bold text-amber-400 uppercase text-xs flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>THREAT ACTOR PROFILE</span>
                </h4>
                <div className="space-y-2 text-slate-300 print:text-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Actor ID:</span>
                    <span className="font-bold text-amber-300">{scenario.threatActor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Threat Category:</span>
                    <span>{scenario.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Primary Objective:</span>
                    <span>Host Intrusion & Lateral Movement</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 print:bg-slate-50 print:border-slate-300">
                <h4 className="font-bold text-cyan-400 uppercase text-xs flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>TARGET ENVIRONMENT</span>
                </h4>
                <div className="space-y-2 text-slate-300 print:text-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Host:</span>
                    <span className="font-bold text-white print:text-slate-900">{scenario.targetHost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time Window:</span>
                    <span>{scenario.timeWindow}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Evidence Count:</span>
                    <span>{scenario.evidenceCount} Artifacts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Severity Distribution Progress Bars */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 font-mono text-xs print:bg-slate-50 print:border-slate-300">
              <h4 className="font-bold text-slate-200 uppercase text-xs flex items-center gap-2 print:text-slate-900">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span>EVIDENCE SEVERITY DISTRIBUTION</span>
              </h4>

              {['Critical', 'High', 'Medium', 'Low'].map((sev) => {
                const count = effectivePlacedCards.filter((c) => c.severity === sev).length;
                const pct = Math.round((count / effectivePlacedCards.length) * 100);
                const color =
                  sev === 'Critical'
                    ? 'bg-red-500'
                    : sev === 'High'
                    ? 'bg-orange-500'
                    : sev === 'Medium'
                    ? 'bg-amber-500'
                    : 'bg-blue-500';

                return (
                  <div key={sev} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{sev} Severity</span>
                      <span className="font-bold">{count} Artifacts ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 print:bg-slate-200">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Page Number */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500 print:border-slate-300">
              <span>DFIR Timeline Reconstructor • Incident Overview</span>
              <span>Page 3 of 10</span>
            </div>
          </div>
        )}

        {/* PAGE 4: ATTACK TIMELINE RECONSTRUCTION */}
        {(activePage === 'all' || activePage === 4) && (
          <div
            className={`print-page rounded-3xl p-8 md:p-10 space-y-8 shadow-2xl border ${
              themeMode === 'dark'
                ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:border-slate-300">
              <div className="flex items-center space-x-2 font-mono text-xs text-cyan-400 font-bold">
                <Clock className="w-4 h-4" />
                <span>PAGE 4 • RECONSTRUCTED ATTACK TIMELINE</span>
              </div>
              <span className="text-xs font-mono text-slate-500">Case ID: {caseId}</span>
            </div>

            {/* Step-by-Step Vertical Timeline */}
            <div className="space-y-6 relative pl-4 md:pl-8 border-l-2 border-slate-800 print:border-slate-300">
              {effectivePlacedCards.map((card, idx) => {
                const inOrder = isCardInCorrectSequence(card, idx);
                const assignedMitre = assignedMitreMap.get(card.id) || card.correctMitreTechniques.map((m) => m.id);
                const assignedKill = assignedKillChainMap.get(card.id) || card.correctKillChain;

                return (
                  <div key={card.id} className="relative group">
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-[25px] md:-left-[41px] top-4 w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shadow-lg ${
                        inOrder
                          ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                          : 'bg-amber-500 text-slate-950 shadow-amber-500/30'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    {/* Timeline Event Card */}
                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 transition-colors hover:border-slate-700 print:bg-slate-50 print:border-slate-300">
                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-bold">
                            {card.timestamp}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              card.severity === 'Critical'
                                ? 'bg-red-950 text-red-400 border border-red-500/30'
                                : card.severity === 'High'
                                ? 'bg-orange-950 text-orange-400 border border-orange-500/30'
                                : 'bg-blue-950 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {card.severity}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-[10px]">
                          {inOrder ? (
                            <span className="flex items-center space-x-1 text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                              <Check className="w-3 h-3" />
                              <span>CHRONO CORRECT</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              <span>SEQUENCE SHIFT</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-bold font-mono text-white print:text-slate-900">
                          {card.title}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans print:text-slate-800">
                          {card.description}
                        </p>
                      </div>

                      {/* Technical Badges Row */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-900 font-mono text-[10px] text-slate-400 print:border-slate-200">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          Category: {card.category}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                          MITRE: {assignedMitre.join(', ') || 'Unassigned'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                          Kill Chain: {assignedKill}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          Source: {card.source}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Page Number */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500 print:border-slate-300">
              <span>DFIR Timeline Reconstructor • Attack Timeline Reconstruction</span>
              <span>Page 4 of 10</span>
            </div>
          </div>
        )}

        {/* PAGE 5: EVIDENCE DETAILS */}
        {(activePage === 'all' || activePage === 5) && (
          <div
            className={`print-page rounded-3xl p-8 md:p-10 space-y-8 shadow-2xl border ${
              themeMode === 'dark'
                ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:border-slate-300">
              <div className="flex items-center space-x-2 font-mono text-xs text-cyan-400 font-bold">
                <Layers className="w-4 h-4" />
                <span>PAGE 5 • FORENSIC EVIDENCE ARTIFACT TABLE</span>
              </div>
              <span className="text-xs font-mono text-slate-500">Case ID: {caseId}</span>
            </div>

            {/* Evidence Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 print:border-slate-300">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] print:bg-slate-200 print:text-slate-700">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Timestamp (UTC)</th>
                    <th className="p-3">Evidence Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Source Artifact</th>
                    <th className="p-3">MITRE ID</th>
                    <th className="p-3">Kill Chain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 print:bg-white print:divide-slate-200 print:text-slate-900">
                  {effectivePlacedCards.map((card, idx) => {
                    const mitre = assignedMitreMap.get(card.id) || card.correctMitreTechniques.map((m) => m.id);
                    const kill = assignedKillChainMap.get(card.id) || card.correctKillChain;

                    return (
                      <tr key={card.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-bold text-cyan-400">{idx + 1}</td>
                        <td className="p-3 text-slate-300 font-bold whitespace-nowrap">{card.timestamp}</td>
                        <td className="p-3 font-bold text-white print:text-slate-900">
                          <div>{card.title}</div>
                          <div className="text-[10px] text-slate-400 font-sans font-normal leading-relaxed mt-0.5 print:text-slate-600">
                            {card.description}
                          </div>
                        </td>
                        <td className="p-3 text-slate-400 whitespace-nowrap">{card.category}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              card.severity === 'Critical'
                                ? 'bg-red-950 text-red-400'
                                : card.severity === 'High'
                                ? 'bg-orange-950 text-orange-400'
                                : 'bg-blue-950 text-blue-400'
                            }`}
                          >
                            {card.severity}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 whitespace-nowrap">{card.source}</td>
                        <td className="p-3 text-purple-400 font-bold whitespace-nowrap">{mitre.join(', ') || 'Unassigned'}</td>
                        <td className="p-3 text-amber-400 whitespace-nowrap">{kill}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Page Number */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500 print:border-slate-300">
              <span>DFIR Timeline Reconstructor • Forensic Evidence Table</span>
              <span>Page 5 of 10</span>
            </div>
          </div>
        )}

        {/* PAGE 6: MITRE ATT&CK ANALYSIS */}
        {(activePage === 'all' || activePage === 6) && (
          <div
            className={`print-page rounded-3xl p-8 md:p-10 space-y-8 shadow-2xl border ${
              themeMode === 'dark'
                ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:border-slate-300">
              <div className="flex items-center space-x-2 font-mono text-xs text-cyan-400 font-bold">
                <Tag className="w-4 h-4" />
                <span>PAGE 6 • MITRE ATT&CK FRAMEWORK COVERAGE</span>
              </div>
              <span className="text-xs font-mono text-slate-500">Case ID: {caseId}</span>
            </div>

            {/* MITRE Mapping Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {effectivePlacedCards.map((card) => {
                const assigned = assignedMitreMap.get(card.id) || [];
                const correct = card.correctMitreTechniques;

                return (
                  <div
                    key={card.id}
                    className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 print:bg-slate-50 print:border-slate-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white max-w-xs truncate print:text-slate-900">{card.title}</span>
                      <span className="text-[10px] text-slate-500">{card.category}</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 block uppercase">REQUIRED MITRE TECHNIQUES:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {correct.map((tech) => {
                          const isAssigned = assigned.includes(tech.id);
                          return (
                            <span
                              key={tech.id}
                              className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                isAssigned
                                  ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                                  : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}
                            >
                              {tech.id} • {tech.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Page Number */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500 print:border-slate-300">
              <span>DFIR Timeline Reconstructor • MITRE ATT&CK Analysis</span>
              <span>Page 6 of 10</span>
            </div>
          </div>
        )}

        {/* PAGE 7: CYBER KILL CHAIN ANALYSIS */}
        {(activePage === 'all' || activePage === 7) && (
          <div
            className={`print-page rounded-3xl p-8 md:p-10 space-y-8 shadow-2xl border ${
              themeMode === 'dark'
                ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:border-slate-300">
              <div className="flex items-center space-x-2 font-mono text-xs text-cyan-400 font-bold">
                <Target className="w-4 h-4" />
                <span>PAGE 7 • CYBER KILL CHAIN PHASE PIPELINE</span>
              </div>
              <span className="text-xs font-mono text-slate-500">Case ID: {caseId}</span>
            </div>

            {/* Kill Chain Pipeline Grid */}
            <div className="space-y-4 font-mono text-xs">
              {[
                'Reconnaissance',
                'Weaponization',
                'Delivery',
                'Exploitation',
                'Installation',
                'Command and Control',
                'Actions on Objectives',
              ].map((stageName, idx) => {
                const stageCards = effectivePlacedCards.filter(
                  (c) => (assignedKillChainMap.get(c.id) || c.correctKillChain) === stageName
                );

                return (
                  <div
                    key={stageName}
                    className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 print:bg-slate-50 print:border-slate-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white text-sm print:text-slate-900">{stageName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{stageCards.length} Artifacts Mapped</span>
                    </div>

                    {stageCards.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {stageCards.map((card) => (
                          <div
                            key={card.id}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs flex items-center justify-between print:bg-white print:border-slate-200"
                          >
                            <span className="font-bold text-cyan-300 truncate print:text-slate-900">{card.title}</span>
                            <span className="text-[10px] text-slate-400">{card.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-[11px] italic">No evidence cards mapped to this stage.</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Page Number */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500 print:border-slate-300">
              <span>DFIR Timeline Reconstructor • Cyber Kill Chain Analysis</span>
              <span>Page 7 of 10</span>
            </div>
          </div>
        )}

        {/* PAGE 8: EVIDENCE RELATIONSHIP GRAPH */}
        {(activePage === 'all' || activePage === 8) && (
          <div
            className={`print-page rounded-3xl p-8 md:p-10 space-y-8 shadow-2xl border ${
              themeMode === 'dark'
                ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:border-slate-300">
              <div className="flex items-center space-x-2 font-mono text-xs text-cyan-400 font-bold">
                <Network className="w-4 h-4" />
                <span>PAGE 8 • EVIDENCE CAUSAL RELATIONSHIP GRAPH</span>
              </div>
              <span className="text-xs font-mono text-slate-500">Case ID: {caseId}</span>
            </div>

            {/* Relationship Nodes Diagram */}
            <div className="space-y-4 font-mono text-xs">
              <p className="text-slate-400 font-sans text-xs print:text-slate-700">
                Causal links constructed between root cause events and post-exploitation artifacts:
              </p>

              <div className="space-y-3">
                {(relationships.length > 0 ? relationships : scenario.referenceRelationships).map((rel, idx) => {
                  const srcCard = effectivePlacedCards.find((c) => c.id === rel.sourceId) || effectivePlacedCards[0];
                  const tgtCard = effectivePlacedCards.find((c) => c.id === rel.targetId) || effectivePlacedCards[1] || effectivePlacedCards[0];

                  return (
                    <div
                      key={rel.id || idx}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 print:bg-slate-50 print:border-slate-300"
                    >
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 w-full sm:w-5/12 print:bg-white print:border-slate-300">
                        <span className="text-[10px] text-slate-500 block uppercase">SOURCE ARTIFACT</span>
                        <span className="font-bold text-white print:text-slate-900 block">{srcCard?.title}</span>
                        <span className="text-[10px] text-cyan-400">{srcCard?.timestamp}</span>
                      </div>

                      <div className="flex flex-col items-center justify-center text-center">
                        <span className="px-3 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                          {rel.type}
                        </span>
                        <ArrowRight className="w-4 h-4 text-blue-400 my-1 rotate-90 sm:rotate-0" />
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 w-full sm:w-5/12 print:bg-white print:border-slate-300">
                        <span className="text-[10px] text-slate-500 block uppercase">TARGET IMPACT</span>
                        <span className="font-bold text-white print:text-slate-900 block">{tgtCard?.title}</span>
                        <span className="text-[10px] text-purple-400">{tgtCard?.timestamp}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Page Number */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500 print:border-slate-300">
              <span>DFIR Timeline Reconstructor • Evidence Relationship Graph</span>
              <span>Page 8 of 10</span>
            </div>
          </div>
        )}

        {/* PAGE 9: AI EVALUATION */}
        {(activePage === 'all' || activePage === 9) && (
          <div
            className={`print-page rounded-3xl p-8 md:p-10 space-y-8 shadow-2xl border ${
              themeMode === 'dark'
                ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:border-slate-300">
              <div className="flex items-center space-x-2 font-mono text-xs text-cyan-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>PAGE 9 • AI EVALUATION & SOC PLAYBOOK</span>
              </div>
              <span className="text-xs font-mono text-slate-500">Case ID: {caseId}</span>
            </div>

            {/* AI Critiques Grid */}
            <div className="space-y-6 font-sans text-xs">
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-2 print:bg-slate-50 print:border-slate-300">
                <h4 className="font-bold font-mono text-cyan-400 uppercase text-xs">CHRONOLOGICAL SEQUENCE CRITIQUE</h4>
                <p className="text-slate-300 leading-relaxed print:text-slate-800">{evaluation.aiAnalysis.sequenceCritique}</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-2 print:bg-slate-50 print:border-slate-300">
                <h4 className="font-bold font-mono text-purple-400 uppercase text-xs">MITRE ATT&CK & KILL CHAIN CRITIQUE</h4>
                <p className="text-slate-300 leading-relaxed print:text-slate-800">{evaluation.aiAnalysis.mitreCritique}</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2 print:bg-slate-50 print:border-slate-300">
                <h4 className="font-bold font-mono text-emerald-400 uppercase text-xs">SOC ANALYST KEY TAKEAWAY</h4>
                <p className="text-slate-300 leading-relaxed print:text-slate-800">{evaluation.aiAnalysis.keyTakeaway}</p>
              </div>

              {/* Recommendations List */}
              <div className="space-y-3">
                <h4 className="font-bold font-mono text-white text-sm print:text-slate-900">RECOMMENDED SOC MITIGATION ACTIONS</h4>
                <ul className="space-y-2 list-disc list-inside text-slate-300 print:text-slate-800">
                  {scenario.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer Page Number */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500 print:border-slate-300">
              <span>DFIR Timeline Reconstructor • AI Evaluation</span>
              <span>Page 9 of 10</span>
            </div>
          </div>
        )}

        {/* PAGE 10: FINAL SCORE CARD */}
        {(activePage === 'all' || activePage === 10) && (
          <div
            className={`print-page rounded-3xl p-8 md:p-10 space-y-8 shadow-2xl border ${
              themeMode === 'dark'
                ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:border-slate-300">
              <div className="flex items-center space-x-2 font-mono text-xs text-cyan-400 font-bold">
                <Award className="w-4 h-4" />
                <span>PAGE 10 • FINAL EVALUATION RESULT & CERTIFICATION</span>
              </div>
              <span className="text-xs font-mono text-slate-500">Case ID: {caseId}</span>
            </div>

            {/* Large Score Banner Card */}
            <div className="p-8 md:p-12 rounded-3xl bg-slate-950/90 border border-cyan-500/40 text-center space-y-6 shadow-2xl font-mono print:bg-slate-50 print:border-slate-300">
              <div className="space-y-2">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-widest block">FINAL EVALUATED SCORE</span>
                <div className="text-5xl md:text-6xl font-extrabold text-cyan-400">{evaluation.score} / 1000</div>
              </div>

              <div className="flex items-center justify-center space-x-2 text-2xl text-amber-400">
                {'★'.repeat(evaluation.starsEarned)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs print:border-slate-200">
                <div>
                  <span className="text-slate-500 block uppercase">ACCURACY</span>
                  <span className="text-xl font-bold text-emerald-400">{evaluation.accuracyPercentage}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase">XP AWARDED</span>
                  <span className="text-xl font-bold text-purple-400">+{evaluation.xpGained} XP</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase">VERIFICATION STATUS</span>
                  <span className="text-xl font-bold text-cyan-400">
                    {evaluation.accuracyPercentage >= 70 ? 'OFFICIALLY PASSED' : 'REVISION RECOMMENDED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sign-off Signature Block */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs print:bg-slate-50 print:border-slate-300">
              <h4 className="font-bold text-slate-300 uppercase">OFFICIAL INVESTIGATION SIGN-OFF</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-400 print:text-slate-700">
                <div>
                  <span>Investigator:</span> <strong className="text-white print:text-slate-900">{userStats.username}</strong>
                </div>
                <div>
                  <span>Platform Engine:</span> <strong className="text-white print:text-slate-900">DFIR Studio Cyber Range v2.4</strong>
                </div>
                <div className="md:col-span-2 text-[10px] truncate">
                  <span>Verification Signature:</span> <span className="text-cyan-400 font-mono">sha256:dfir8291f0a293b8217c9182319f8217c91823</span>
                </div>
              </div>
            </div>

            {/* Footer Page Number */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500 print:border-slate-300">
              <span>DFIR Timeline Reconstructor • Final Evaluation Result</span>
              <span>Page 10 of 10</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
