import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Plus, Sparkles, Layers, ArrowRight } from 'lucide-react';
import { EvidenceCard, RelationshipLink, KillChainStage } from '../../types';
import { EvidenceCardItem } from './EvidenceCardItem';
import { cyberAudio } from '../../utils/audio';

interface TimelineCanvasProps {
  placedCards: EvidenceCard[];
  relationships: RelationshipLink[];
  selectedCardIdsForLink: string[];
  highlightedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  onToggleSelectForLink: (cardId: string) => void;
  onOpenDetailModal: (card: EvidenceCard) => void;
  onRemoveCardFromTimeline: (cardId: string) => void;
  onReorderTimeline: (startIndex: number, endIndex: number) => void;
  onDropUnplacedCard: (cardId: string, dropIndex?: number) => void;
  assignedMitreMap: Map<string, string[]>;
  assignedKillChainMap: Map<string, KillChainStage>;
}

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({
  placedCards = [],
  relationships = [],
  selectedCardIdsForLink = [],
  highlightedCardId = null,
  onSelectCard,
  onToggleSelectForLink,
  onOpenDetailModal,
  onRemoveCardFromTimeline,
  onReorderTimeline,
  onDropUnplacedCard,
  assignedMitreMap = new Map(),
  assignedKillChainMap = new Map(),
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 50% to 200%
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    cyberAudio.playClick();
    setZoomLevel((prev) => Math.min(180, prev + 15));
  };

  const handleZoomOut = () => {
    cyberAudio.playClick();
    setZoomLevel((prev) => Math.max(60, prev - 15));
  };

  const handleResetZoom = () => {
    cyberAudio.playClick();
    setZoomLevel(100);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (index?: number) => {
    if (typeof index === 'number') {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDropOnCanvas = (e: React.DragEvent, targetIndex?: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    const cardId = e.dataTransfer.getData('text/plain')?.toString();
    if (!cardId) return;

    cyberAudio.playCardSnap();

    const currentPlaced = placedCards ?? [];
    const existingIdx = currentPlaced.findIndex((c) => c.id === cardId);
    if (existingIdx >= 0) {
      if (typeof targetIndex === 'number' && targetIndex !== existingIdx) {
        onReorderTimeline(existingIdx, targetIndex);
      }
      return;
    }

    onDropUnplacedCard(cardId, targetIndex);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans text-slate-100 relative overflow-hidden">
      {/* Canvas Top Bar: Controls, Zoom, Relationship Counter */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-3">
          <span className="text-cyan-400 font-bold flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" /> TIMELINE CANVAS ({placedCards.length} PLACED)
          </span>

          {selectedCardIdsForLink.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-500/40 text-[11px] animate-pulse">
              {selectedCardIdsForLink.length} Selected for Relationship Link
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            title="Zoom Out Canvas"
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-slate-400 text-[11px] font-bold w-12 text-center">{zoomLevel}%</span>

          <button
            onClick={handleZoomIn}
            title="Zoom In Canvas"
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetZoom}
            title="Reset Zoom"
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDrop={(e) => {
          e.stopPropagation();
          handleDropOnCanvas(e);
        }}
        className="flex-1 overflow-x-auto overflow-y-auto p-6 relative select-none"
      >
        {/* Time Ruler Line */}
        <div className="mb-6 pb-2 border-b-2 border-cyan-500/30 flex items-center justify-between text-[11px] font-mono text-cyan-400/80">
          <span>START OF INCIDENT (T-0)</span>
          <span className="tracking-widest">CHRONOLOGICAL INCIDENT FLOW →</span>
          <span>IMPACT & EXFILTRATION</span>
        </div>

        {placedCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30 p-8">
            <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold font-mono text-white text-base">Timeline Canvas Empty</h3>
              <p className="text-slate-400 text-xs max-w-md">
                Drag and drop forensic evidence cards from the left panel onto this timeline or click &quot;Add to Timeline&quot;. Arrange them chronologically to reconstruct the attack.
              </p>
            </div>
          </div>
        ) : (
          /* Cards Grid / Slot Layout */
          <div
            className="flex items-start space-x-4 pb-12 transition-all duration-300 min-w-max"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
          >
            {(placedCards ?? []).map((card, index) => {
              const assignedMitre = assignedMitreMap.get(card.id) || [];
              const assignedKillChain = assignedKillChainMap.get(card.id);
              const isSelectedForLink = (selectedCardIdsForLink ?? []).includes(card.id);
              const isHighlighted = highlightedCardId === card.id;
              const isDragOver = dragOverIndex === index;

              return (
                <div
                  key={card.id}
                  onDragOver={handleDragOver}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDropOnCanvas(e, index)}
                  onClick={() => {
                    cyberAudio.playClick();
                    onSelectCard(card.id);
                  }}
                  className={`w-72 flex-shrink-0 relative group transition-all ${
                    isDragOver ? 'scale-105 opacity-80' : ''
                  }`}
                >
                  <EvidenceCardItem
                    card={card}
                    orderIndex={index}
                    assignedMitreIds={assignedMitre}
                    assignedKillChainStage={assignedKillChain}
                    isSelectedForLink={isSelectedForLink}
                    onToggleSelectForLink={onToggleSelectForLink}
                    onOpenDetailModal={onOpenDetailModal}
                    onRemoveFromTimeline={onRemoveCardFromTimeline}
                    isDraggable={true}
                    isReplayHighlighted={isHighlighted}
                  />

                  {/* Drag-over indicator */}
                  {isDragOver && (
                    <div className="absolute inset-0 rounded-xl border-2 border-emerald-400 pointer-events-none animate-pulse" />
                  )}

                  {/* Connecting Arrow between adjacent cards */}
                  {index < placedCards.length - 1 && (
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-10 pointer-events-none">
                      <ArrowRight className="w-4 h-4 text-cyan-500/60" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Existing Relationship Vector Badges Box */}
        {relationships.length > 0 && (
          <div className="mt-8 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 font-mono text-xs max-w-2xl">
            <h4 className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> ESTABLISHED CAUSAL RELATIONSHIP LINKS ({relationships.length})
            </h4>

            <div className="flex flex-wrap gap-2 pt-1">
              {relationships.map((rel) => (
                <span
                  key={rel.id}
                  className="px-2.5 py-1 rounded bg-slate-950 border border-cyan-500/30 text-[11px] text-slate-300 flex items-center space-x-1.5"
                >
                  <span className="text-cyan-400 font-bold">{rel.type}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
