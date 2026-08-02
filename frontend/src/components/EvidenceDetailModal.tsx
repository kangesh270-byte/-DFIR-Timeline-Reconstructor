import React from 'react';
import { EvidenceCard } from '../types';
import { X, Copy, Terminal, Shield, Cpu, Tag, ExternalLink, Check } from 'lucide-react';
import { cyberAudio } from '../utils/audio';

interface EvidenceDetailModalProps {
  card: EvidenceCard | null;
  onClose: () => void;
}

export const EvidenceDetailModal: React.FC<EvidenceDetailModalProps> = ({ card, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!card) return null;

  const copyRawLog = () => {
    navigator.clipboard.writeText(card.rawLog);
    setCopied(true);
    cyberAudio.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl font-sans text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">{card.category}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                  {card.source}
                </span>
              </div>
              <h2 className="text-xl font-bold font-mono text-white">{card.title}</h2>
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

        {/* Timestamp & Host/User Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs bg-slate-950/80 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 block">TIMESTAMP (UTC)</span>
            <span className="text-cyan-300 font-bold">{card.timestamp}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block">HOST MACHINE</span>
            <span className="text-slate-200">{card.host}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block">ACCOUNT USER</span>
            <span className="text-slate-200">{card.user}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block">SEVERITY LEVEL</span>
            <span className="text-amber-400 font-bold">{card.severity}</span>
          </div>
        </div>

        {/* Narrative Description */}
        <div className="space-y-1">
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">FORENSIC ANALYSIS SUMMARY</h4>
          <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
            {card.description}
          </p>
        </div>

        {/* Hash Details */}
        {card.hash && card.hash !== 'N/A' && (
          <div className="space-y-1 font-mono text-xs">
            <span className="text-[10px] text-slate-500 block uppercase">SHA256 / MD5 ARTIFACT HASH</span>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 break-all select-all text-[11px]">
              {card.hash}
            </div>
          </div>
        )}

        {/* Raw Log Payload Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" /> RAW FORENSIC LOG PAYLOAD
            </span>
            <button
              onClick={copyRawLog}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'COPIED' : 'COPY LOG'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/20 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed border-l-4 border-l-cyan-500">
            <code>{card.rawLog}</code>
          </div>
        </div>

        {/* Correct MITRE Techniques */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">ASSOCIATED MITRE ATT&CK TECHNIQUES</h4>
          <div className="space-y-2">
            {card.correctMitreTechniques.map((tech) => (
              <div key={tech.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-xs">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
                    {tech.id}
                  </span>
                  <span className="text-white font-bold">{tech.name}</span>
                  <span className="text-[10px] text-slate-400">({tech.tactic})</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end font-mono text-xs">
          <button
            onClick={() => {
              cyberAudio.playClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
