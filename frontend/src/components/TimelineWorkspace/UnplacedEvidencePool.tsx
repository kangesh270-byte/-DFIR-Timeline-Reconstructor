import React, { useState } from 'react';
import { Search, Filter, Layers, ArrowRight } from 'lucide-react';
import { EvidenceCard, Category, Severity } from '../../types';
import { EvidenceCardItem } from './EvidenceCardItem';
import { cyberAudio } from '../../utils/audio';

interface UnplacedEvidencePoolProps {
  unplacedCards: EvidenceCard[];
  onPlaceCardOnTimeline: (cardId: string) => void;
  onOpenDetailModal: (card: EvidenceCard) => void;
}

export const UnplacedEvidencePool: React.FC<UnplacedEvidencePoolProps> = ({
  unplacedCards,
  onPlaceCardOnTimeline,
  onOpenDetailModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const filtered = (unplacedCards ?? []).filter((card) => {
    const matchSearch =
      card.title.toLowerCase().includes(search.toLowerCase()) ||
      card.description.toLowerCase().includes(search.toLowerCase()) ||
      card.host.toLowerCase().includes(search.toLowerCase()) ||
      card.user.toLowerCase().includes(search.toLowerCase());

    const matchCat = selectedCategory === 'ALL' || card.category === selectedCategory;
    const matchSev = selectedSeverity === 'ALL' || card.severity === selectedSeverity;

    return matchSearch && matchCat && matchSev;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border-r border-slate-800 font-sans text-slate-100">
      {/* Sidebar Title & Count */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold font-mono text-sm text-cyan-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>UNPLACED EVIDENCE POOL</span>
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono text-xs border border-cyan-500/30">
            {unplacedCards.length} Cards Left
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search artifacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Category & Severity Filter Dropdowns */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-1/2 bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-[11px] focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Windows Logs">Windows Logs</option>
            <option value="Linux Logs">Linux Logs</option>
            <option value="Firewall">Firewall</option>
            <option value="DNS">DNS</option>
            <option value="Email">Email</option>
            <option value="EDR">EDR</option>
            <option value="Registry">Registry</option>
            <option value="PowerShell">PowerShell</option>
            <option value="Memory">Memory</option>
            <option value="Network">Network</option>
            <option value="Cloud">Cloud</option>
            <option value="USB">USB</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-1/2 bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-[11px] focus:outline-none"
          >
            <option value="ALL">All Severity</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Cards List Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-mono">
            {unplacedCards.length === 0
              ? '🎉 All forensic cards placed on timeline!'
              : 'No evidence cards match your search filters.'}
          </div>
        ) : (
          filtered.map((card) => (
            <div key={card.id} className="relative group/pool">
              <EvidenceCardItem
                card={card}
                onOpenDetailModal={onOpenDetailModal}
                isDraggable={true}
              />
              <button
                onClick={() => {
                  cyberAudio.playCardSnap();
                  onPlaceCardOnTimeline(card.id);
                }}
                className="w-full mt-1.5 py-1.5 px-3 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white font-mono text-[11px] flex items-center justify-center space-x-1 transition-colors shadow-sm"
              >
                <span>Add to Timeline</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
