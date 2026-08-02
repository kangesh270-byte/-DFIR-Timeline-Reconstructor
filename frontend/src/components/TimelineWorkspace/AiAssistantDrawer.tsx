import React from 'react';
import { Bot, Sparkles, X, CheckCircle2, AlertTriangle, Lightbulb, Shield, HelpCircle } from 'lucide-react';
import { Scenario, EvidenceCard } from '../../types';
import { cyberAudio } from '../../utils/audio';

interface AiAssistantDrawerProps {
  scenario: Scenario;
  placedCards: EvidenceCard[];
  onClose: () => void;
  onRequestHint?: () => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  scenario,
  placedCards,
  onClose,
  onRequestHint,
}) => {
  // Offline heuristic analyzer for current timeline state
  const totalCards = scenario.evidenceCards.length;
  const placedCount = placedCards.length;

  let outOfOrderCount = 0;
  for (let i = 0; i < placedCards.length - 1; i++) {
    if (placedCards[i].trueTimestampMs > placedCards[i + 1].trueTimestampMs) {
      outOfOrderCount++;
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/95 border-l border-cyan-500/30 font-sans text-slate-100 shadow-2xl">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40">
            <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold font-mono text-sm text-white flex items-center gap-1.5">
              <span>LOCAL DFIR ASSISTANT</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                OFFLINE AI
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Heuristic Incident Response Mentor</p>
          </div>
        </div>

        <button
          onClick={() => {
            cyberAudio.playClick();
            onClose();
          }}
          className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
        {/* Real-Time Health Diagnostic */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between font-mono">
            <span className="text-slate-400 uppercase text-[10px] font-bold">TIMELINE DIAGNOSTIC</span>
            <span className="text-cyan-400 font-bold">
              {placedCount} / {totalCards} Placed
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center font-mono">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">SEQUENCE ERRORS</span>
              <span
                className={`text-base font-extrabold ${outOfOrderCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}
              >
                {outOfOrderCount}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">REMAINING POOL</span>
              <span className="text-base font-extrabold text-cyan-300">{totalCards - placedCount}</span>
            </div>
          </div>
        </div>

        {/* AI Forensic Guidance */}
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-cyan-300 font-bold font-mono">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>INCIDENT MENTOR ANALYSIS</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans">
            {outOfOrderCount > 0
              ? `I detected ${outOfOrderCount} chronological placement discrepancies. Check the timestamp fields in UTC format. Forensic timeline building requires strictly non-decreasing timestamp sequence.`
              : placedCount === 0
              ? 'Begin by placing the Initial Access artifact (e.g. inbound email or exploit log) on the timeline first.'
              : 'Your sequence order currently aligns with log timestamps! Continue assigning MITRE ATT&CK techniques and drawing causal links.'}
          </p>
        </div>

        {/* SOC Analyst Principles */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-slate-200 font-bold font-mono">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>HOW SOC ANALYSTS THINK</span>
          </div>

          <ul className="space-y-2 text-slate-300 text-[11px] leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-cyan-300 font-mono">Causal Chains:</strong> Ask yourself: &quot;What tool or process was required to spawn this event?&quot;
            </li>
            <li>
              <strong className="text-cyan-300 font-mono">MITRE Tagging:</strong> Match the exact command-line flags (e.g. <code>vssadmin delete shadows</code> maps to T1490).
            </li>
            <li>
              <strong className="text-cyan-300 font-mono">Lateral Movement:</strong> Security Event 4624 (Type 3) on a Domain Controller indicates remote logon across workstations.
            </li>
          </ul>
        </div>

        {/* Request Hint Action */}
        {onRequestHint && (
          <button
            onClick={() => {
              cyberAudio.playClick();
              onRequestHint();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>REQUEST FORENSIC HINT</span>
          </button>
        )}
      </div>
    </div>
  );
};
