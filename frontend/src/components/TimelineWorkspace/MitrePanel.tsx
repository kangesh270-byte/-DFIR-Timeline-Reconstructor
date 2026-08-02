import React, { useState } from 'react';
import { Tag, Search, Check, Plus, Shield, X, ExternalLink } from 'lucide-react';
import { MITRE_TECHNIQUES, ALL_MITRE_TACTICS } from '../../data/mitreData';
import { EvidenceCard, MitreTactic } from '../../types';
import { cyberAudio } from '../../utils/audio';

interface MitrePanelProps {
  selectedCard: EvidenceCard | null;
  assignedMitreIds: string[];
  onToggleMitreTechnique: (cardId: string, techniqueId: string) => void;
  onClosePanel?: () => void;
}

export const MitrePanel: React.FC<MitrePanelProps> = ({
  selectedCard,
  assignedMitreIds,
  onToggleMitreTechnique,
  onClosePanel,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTactic, setSelectedTactic] = useState<string>('ALL');

  const filteredTechniques = MITRE_TECHNIQUES.filter((tech) => {
    const matchSearch =
      tech.id.toLowerCase().includes(search.toLowerCase()) ||
      tech.name.toLowerCase().includes(search.toLowerCase()) ||
      tech.description.toLowerCase().includes(search.toLowerCase());

    const matchTactic = selectedTactic === 'ALL' || tech.tactic === selectedTactic;

    return matchSearch && matchTactic;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/95 border-l border-slate-800 font-sans text-slate-100">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold font-mono text-sm text-cyan-400 flex items-center gap-2">
            <Tag className="w-4 h-4 text-cyan-400" />
            <span>MITRE ATT&CK NAVIGATOR</span>
          </h3>
          {onClosePanel && (
            <button
              onClick={() => {
                cyberAudio.playClick();
                onClosePanel();
              }}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selected Card Context Indicator */}
        {selectedCard ? (
          <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-xs font-mono space-y-1">
            <span className="text-[10px] text-cyan-400 uppercase font-bold block">TARGET CARD SELECTED</span>
            <div className="text-white font-bold truncate">{selectedCard.title}</div>
            <div className="text-[10px] text-slate-400">{selectedCard.category}</div>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-amber-400/90 flex items-center space-x-2">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>Select an evidence card on the timeline to assign MITRE techniques.</span>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search technique ID or name (e.g. T1566)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Tactic Filter Selector */}
        <select
          value={selectedTactic}
          onChange={(e) => setSelectedTactic(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none"
        >
          <option value="ALL">All Tactics ({ALL_MITRE_TACTICS.length})</option>
          {ALL_MITRE_TACTICS.map((tac) => (
            <option key={tac} value={tac}>
              {tac}
            </option>
          ))}
        </select>
      </div>

      {/* Technique List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredTechniques.map((tech) => {
          const isAssigned = assignedMitreIds.includes(tech.id);

          return (
            <div
              key={tech.id}
              onClick={() => {
                if (selectedCard) {
                  cyberAudio.playClick();
                  onToggleMitreTechnique(selectedCard.id, tech.id);
                }
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none space-y-1.5 text-xs ${
                isAssigned
                  ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between font-mono">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-cyan-400 text-xs">{tech.id}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {tech.tactic}
                  </span>
                </div>

                {selectedCard && (
                  <span
                    className={`p-1 rounded ${
                      isAssigned ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAssigned ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </span>
                )}
              </div>

              <div className="font-bold font-mono text-white text-xs">{tech.name}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{tech.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
