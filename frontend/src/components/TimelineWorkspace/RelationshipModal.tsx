import React, { useState } from 'react';
import { Network, ArrowRight, X, Trash2, Sparkles } from 'lucide-react';
import { RelationshipLink, RelationshipType, EvidenceCard } from '../../types';
import { cyberAudio } from '../../utils/audio';

interface RelationshipModalProps {
  selectedCardIds: string[];
  cardsMap: Map<string, EvidenceCard>;
  existingRelationships: RelationshipLink[];
  onAddRelationship: (rel: RelationshipLink) => void;
  onDeleteRelationship: (relId: string) => void;
  onClose: () => void;
}

const RELATIONSHIP_TYPES: RelationshipType[] = [
  'Caused By',
  'Triggered',
  'Downloaded',
  'Executed',
  'Connected',
  'Created',
  'Modified',
  'Deleted',
];

export const RelationshipModal: React.FC<RelationshipModalProps> = ({
  selectedCardIds,
  cardsMap,
  existingRelationships,
  onAddRelationship,
  onDeleteRelationship,
  onClose,
}) => {
  const [sourceId, setSourceId] = useState<string>(selectedCardIds[0] || '');
  const [targetId, setTargetId] = useState<string>(selectedCardIds[1] || '');
  const [relType, setRelType] = useState<RelationshipType>('Triggered');

  const cardList: EvidenceCard[] = Array.from(cardsMap.values());

  const handleCreate = () => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    cyberAudio.playCardSnap();
    const newRel: RelationshipLink = {
      id: `rel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sourceId,
      targetId,
      type: relType,
    };

    onAddRelationship(newRel);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl font-sans text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-mono text-white">EVIDENCE RELATIONSHIP BUILDER</h3>
              <p className="text-xs text-slate-400">Connect causal forensic vectors between events</p>
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

        {/* Create Link Controls */}
        <div className="space-y-4 bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
          <h4 className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> CREATE NEW CAUSAL LINK
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            {/* Source Card Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">SOURCE CARD (CAUSE)</label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select Source...</option>
                {cardList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Relationship Type Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">RELATIONSHIP TYPE</label>
              <select
                value={relType}
                onChange={(e) => setRelType(e.target.value as RelationshipType)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
              >
                {RELATIONSHIP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Card Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">TARGET CARD (EFFECT)</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select Target...</option>
                {cardList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!sourceId || !targetId || sourceId === targetId}
            className="w-full py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-500/20"
          >
            <span>ADD CAUSAL RELATIONSHIP LINK</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Links List */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold text-slate-400">
            EXISTING CAUSAL LINKS ({existingRelationships.length})
          </h4>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {existingRelationships.length === 0 ? (
              <div className="text-center py-6 text-xs font-mono text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
                No relationship connections drawn yet. Select source and target cards above.
              </div>
            ) : (
              existingRelationships.map((rel) => {
                const src = cardsMap.get(rel.sourceId);
                const tgt = cardsMap.get(rel.targetId);

                return (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono"
                  >
                    <div className="flex items-center space-x-2 truncate max-w-md">
                      <span className="text-slate-200 font-bold truncate">{src?.title || rel.sourceId}</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                        {rel.type}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="text-slate-200 font-bold truncate">{tgt?.title || rel.targetId}</span>
                    </div>

                    <button
                      onClick={() => {
                        cyberAudio.playClick();
                        onDeleteRelationship(rel.id);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              cyberAudio.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-mono text-xs text-white"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
