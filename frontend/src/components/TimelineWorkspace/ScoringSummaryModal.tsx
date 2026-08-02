import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Star, Sparkles, CheckCircle2, AlertTriangle, FileText, RotateCcw, ArrowRight } from 'lucide-react';
import { EvaluationResult, Scenario } from '../../types';
import { cyberAudio } from '../../utils/audio';

interface ScoringSummaryModalProps {
  evaluation: EvaluationResult;
  scenario: Scenario;
  onViewReport: () => void;
  onRetry: () => void;
}

export const ScoringSummaryModal: React.FC<ScoringSummaryModalProps> = ({
  evaluation,
  scenario,
  onViewReport,
  onRetry,
}) => {
  useEffect(() => {
    cyberAudio.playSuccessChime();
    if (evaluation.accuracyPercentage >= 65) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [evaluation]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl font-sans text-slate-100 my-8">
        {/* Modal Header & Stars */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>DETERMINISTIC EVALUATION COMPLETE</span>
          </div>

          <h2 className="text-3xl font-extrabold font-mono text-white">Lab Evaluation Summary</h2>

          {/* Stars Row */}
          <div className="flex items-center justify-center space-x-2 pt-1">
            {[1, 2, 3].map((starNum) => (
              <Star
                key={starNum}
                className={`w-8 h-8 ${
                  starNum <= evaluation.starsEarned
                    ? 'text-amber-400 fill-amber-400 animate-bounce'
                    : 'text-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main Score Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl text-center font-mono">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">FINAL SCORE</span>
            <div className="text-3xl font-extrabold text-cyan-400">{evaluation.score} / 1000</div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">ACCURACY</span>
            <div className="text-3xl font-extrabold text-emerald-400">{evaluation.accuracyPercentage}%</div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">XP GAINED</span>
            <div className="text-3xl font-extrabold text-amber-400">+{evaluation.xpGained} XP</div>
          </div>
        </div>

        {/* Accuracy Category Progress Bars */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 font-mono text-xs">
          <h4 className="font-bold text-slate-300 uppercase text-[11px]">SCORING BREAKDOWN</h4>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>Chronological Sequence</span>
                <span className="text-cyan-400">{evaluation.chronologicalAccuracy}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${evaluation.chronologicalAccuracy}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>MITRE ATT&CK Mapping</span>
                <span className="text-purple-400">{evaluation.mitreAccuracy}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${evaluation.mitreAccuracy}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>Cyber Kill Chain Stages</span>
                <span className="text-amber-400">{evaluation.killChainAccuracy}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${evaluation.killChainAccuracy}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>Causal Relationships</span>
                <span className="text-blue-400">{evaluation.relationshipAccuracy}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${evaluation.relationshipAccuracy}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Local AI Critique Box */}
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-2 text-xs">
          <div className="font-bold font-mono text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI DFIR MENTOR FEEDBACK</span>
          </div>
          <p className="text-slate-200 leading-relaxed">{evaluation.aiAnalysis.overallSummary}</p>
          <p className="text-slate-400 text-[11px] italic">&quot;{evaluation.aiAnalysis.keyTakeaway}&quot;</p>
        </div>

        {/* Mistakes List */}
        {evaluation.mistakes.length > 0 && (
          <div className="space-y-2 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 max-h-40 overflow-y-auto">
            <h4 className="font-mono font-bold text-amber-400 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>DETECTED MISTAKES ({evaluation.mistakes.length})</span>
            </h4>
            <ul className="space-y-1 text-slate-300 text-[11px] font-mono list-disc list-inside">
              {evaluation.mistakes.slice(0, 4).map((m, idx) => (
                <li key={idx} className="line-clamp-2">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
          <button
            onClick={() => {
              cyberAudio.playClick();
              onRetry();
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center space-x-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RETRY LAB</span>
          </button>

          <button
            onClick={() => {
              cyberAudio.playClick();
              onViewReport();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-500/20"
          >
            <FileText className="w-4 h-4 fill-slate-950" />
            <span>VIEW FULL INCIDENT REPORT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
