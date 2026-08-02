import React, { useState } from 'react';
import {
  Scenario,
  EvidenceCard,
  RelationshipLink,
  KillChainStage,
  EvaluationResult,
  UserPlacement,
} from '../../types';
import { TimelineCanvas } from './TimelineCanvas';
import { UnplacedEvidencePool } from './UnplacedEvidencePool';
import { MitrePanel } from './MitrePanel';
import { KillChainPanel } from './KillChainPanel';
import { AttackReplayPlayer } from './AttackReplayPlayer';
import { AiAssistantDrawer } from './AiAssistantDrawer';
import { RelationshipModal } from './RelationshipModal';
import { ScoringSummaryModal } from './ScoringSummaryModal';
import { submitTimelineEvaluation } from '../../services/api';
import {
  Tag,
  Network,
  Bot,
  Play,
  CheckCircle2,
  Lightbulb,
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { cyberAudio } from '../../utils/audio';

interface TimelineWorkspaceProps {
  scenario: Scenario | null;
  isLoading?: boolean;
  error?: string | null;
  onViewReport: (data?: {
    placedCards: EvidenceCard[];
    assignedMitreMap: Map<string, string[]>;
    assignedKillChainMap: Map<string, KillChainStage>;
    relationships: RelationshipLink[];
    evaluationResult: EvaluationResult | null;
  }) => void;
  onBackToScenarios: () => void;
  onOpenDetailModal: (card: EvidenceCard) => void;
}

export const TimelineWorkspace: React.FC<TimelineWorkspaceProps> = ({
  scenario,
  isLoading = false,
  error = null,
  onViewReport,
  onBackToScenarios,
  onOpenDetailModal,
}) => {
  // State: placed cards on timeline vs unplaced pool
  const [placedCards, setPlacedCards] = useState<EvidenceCard[]>([]);
  const [unplacedCards, setUnplacedCards] = useState<EvidenceCard[]>([]);

  // Mappings & Selections
  const [assignedMitreMap, setAssignedMitreMap] = useState<Map<string, string[]>>(new Map());
  const [assignedKillChainMap, setAssignedKillChainMap] = useState<Map<string, KillChainStage>>(new Map());
  const [relationships, setRelationships] = useState<RelationshipLink[]>([]);

  // Active selections
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCardIdsForLink, setSelectedCardIdsForLink] = useState<string[]>([]);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);

  // Sidebar Toggles
  const [isMitreOpen, setIsMitreOpen] = useState(true);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);

  // Evaluation & Timer
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // Initialize timeline on first scenario load
  React.useEffect(() => {
    if (!scenario?.id) return;

    // Try to load saved timeline state from localStorage
    const savedState = localStorage.getItem(`timeline-${scenario.id}`);
    if (savedState) {
      try {
        const {
          placedCardIds,
          mitreMap,
          killChainMap,
          relationships: savedRelationships,
        } = JSON.parse(savedState);

        // Restore placed cards from current scenario evidence
        const currentCards = scenario.evidenceCards ?? [];
        const restoredPlaced = currentCards.filter((c) => placedCardIds.includes(c.id));
        const restoredUnplaced = currentCards.filter((c) => !placedCardIds.includes(c.id));

        setPlacedCards(restoredPlaced);
        setUnplacedCards(restoredUnplaced);

        // Restore MITRE and Kill Chain mappings
        const restoredMitreMap = new Map<string, string[]>();
        Object.entries(mitreMap).forEach(([key, value]: [string, any]) => {
          restoredMitreMap.set(key, value);
        });
        setAssignedMitreMap(restoredMitreMap);

        const restoredKillChainMap = new Map<string, KillChainStage>();
        Object.entries(killChainMap).forEach(([key, value]: [string, any]) => {
          restoredKillChainMap.set(key, value);
        });
        setAssignedKillChainMap(restoredKillChainMap);

        setRelationships(savedRelationships || []);
        setSelectedCardId(null);
        setSelectedCardIdsForLink([]);
        setHighlightedCardId(null);
      } catch (err) {
        console.error('Failed to restore timeline state:', err);
        // Fall back to fresh start
        setPlacedCards([]);
        setUnplacedCards(scenario?.evidenceCards ?? []);
        setAssignedMitreMap(new Map());
        setAssignedKillChainMap(new Map());
        setRelationships([]);
        setSelectedCardId(null);
        setSelectedCardIdsForLink([]);
        setHighlightedCardId(null);
      }
    } else {
      // Fresh start for new scenario
      setPlacedCards([]);
      setUnplacedCards(scenario?.evidenceCards ?? []);
      setAssignedMitreMap(new Map());
      setAssignedKillChainMap(new Map());
      setRelationships([]);
      setSelectedCardId(null);
      setSelectedCardIdsForLink([]);
      setHighlightedCardId(null);
    }
  }, [scenario?.id]);

  // Auto-save timeline state to localStorage whenever it changes
  React.useEffect(() => {
    if (!scenario?.id) return;

    const state = {
      placedCardIds: placedCards.map((c) => c.id),
      mitreMap: Object.fromEntries(assignedMitreMap),
      killChainMap: Object.fromEntries(assignedKillChainMap),
      relationships,
    };

    localStorage.setItem(`timeline-${scenario.id}`, JSON.stringify(state));
  }, [scenario?.id, placedCards, assignedMitreMap, assignedKillChainMap, relationships]);

  // Detect when new evidence is added and merge it into unplaced pool
  React.useEffect(() => {
    if (!scenario?.id) return;

    const allScenarioCards = scenario.evidenceCards ?? [];
    const currentPlacedIds = new Set(placedCards.map((c) => c.id));

    // Find new evidence that wasn't in the current pool
    const newEvidence = allScenarioCards.filter(
      (card) => !currentPlacedIds.has(card.id) && !unplacedCards.some((c) => c.id === card.id)
    );

    // If there's new evidence, add it to unplaced pool
    if (newEvidence.length > 0) {
      setUnplacedCards((prev) => [...prev, ...newEvidence]);
    }
  }, [scenario?.evidenceCards]);

  // Cards map for quick lookups
  const cardsMap = new Map<string, EvidenceCard>();
  (scenario?.evidenceCards ?? []).forEach((c) => cardsMap.set(c.id, c));

  // Card Placement Handlers
  const handlePlaceCardOnTimeline = (cardId: string) => {
    const card = (unplacedCards ?? []).find((c) => c.id === cardId);
    if (!card) return;

    setPlacedCards((prev) => {
      const current = prev ?? [];
      if (current.some((c) => c.id === cardId)) return current;
      return [...current, card];
    });
    setUnplacedCards((prev) => (prev ?? []).filter((c) => c.id !== cardId));
    setSelectedCardId(cardId);
  };

  const handleRemoveCardFromTimeline = (cardId: string) => {
    const card = (placedCards ?? []).find((c) => c.id === cardId);
    if (!card) return;

    setPlacedCards((prev) => (prev ?? []).filter((c) => c.id !== cardId));
    setUnplacedCards((prev) => {
      const current = prev ?? [];
      if (current.some((c) => c.id === cardId)) return current;
      return [...current, card];
    });
    if (selectedCardId === cardId) setSelectedCardId(null);
  };

  const handleReorderTimeline = (startIndex: number, endIndex: number) => {
    setPlacedCards((prev) => {
      const current = prev ?? [];
      if (
        !Number.isInteger(startIndex) ||
        !Number.isInteger(endIndex) ||
        startIndex < 0 ||
        endIndex < 0 ||
        startIndex >= current.length ||
        endIndex > current.length ||
        startIndex === endIndex
      ) {
        return current;
      }
      const updated = [...current];
      const [removed] = updated.splice(startIndex, 1);
      if (!removed) return current;
      updated.splice(endIndex, 0, removed);
      return updated;
    });
  };

  const handleDropUnplacedCard = (cardId: string, dropIndex?: number) => {
    const card = (unplacedCards ?? []).find((c) => c.id === cardId);
    if (!card) return;

    setUnplacedCards((prev) => (prev ?? []).filter((c) => c.id !== cardId));
    setPlacedCards((prev) => {
      const current = prev ?? [];
      if (current.some((c) => c.id === cardId)) return current;
      const next = [...current];
      const index = Number.isInteger(dropIndex) ? Math.max(0, Math.min(dropIndex, next.length)) : next.length;
      next.splice(index, 0, card);
      return next;
    });
    setSelectedCardId(cardId);
  };

  // MITRE & Kill Chain Assignment
  const handleToggleMitreTechnique = (cardId: string, techniqueId: string) => {
    setAssignedMitreMap((prev) => {
      const next = new Map<string, string[]>(prev);
      const current: string[] = next.get(cardId) || [];
      if (current.includes(techniqueId)) {
        next.set(
          cardId,
          current.filter((t) => t !== techniqueId)
        );
      } else {
        next.set(cardId, [...current, techniqueId]);
      }
      return next;
    });
  };

  const handleAssignKillChainStage = (cardId: string, stage: KillChainStage) => {
    setAssignedKillChainMap((prev) => {
      const next = new Map<string, KillChainStage>(prev);
      next.set(cardId, stage);
      return next;
    });
  };

  // Relationship Links
  const handleToggleSelectForLink = (cardId: string) => {
    setSelectedCardIdsForLink((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      } else {
        if (prev.length >= 2) return [prev[1], cardId];
        return [...prev, cardId];
      }
    });
  };

  const handleAddRelationship = (rel: RelationshipLink) => {
    setRelationships((prev) => [...prev, rel]);
    setIsRelationshipModalOpen(false);
  };

  const handleDeleteRelationship = (relId: string) => {
    setRelationships((prev) => prev.filter((r) => r.id !== relId));
  };

  // Auto-populate / Quick Solve for testing
  const handleResetTimeline = () => {
    cyberAudio.playClick();
    setPlacedCards([]);
    setUnplacedCards(scenario?.evidenceCards ?? []);
    setAssignedMitreMap(new Map());
    setAssignedKillChainMap(new Map());
    setRelationships([]);
    setSelectedCardId(null);
    setSelectedCardIdsForLink([]);
  };

  // Evaluation Submit
  const handleEvaluate = async () => {
    cyberAudio.playClick();
    setIsEvaluating(true);

    const userPlacements: UserPlacement[] = placedCards.map((c, index) => ({
      evidenceId: c.id,
      orderIndex: index,
      assignedMitreTechniqueIds: assignedMitreMap.get(c.id) || [],
      assignedKillChainStage: assignedKillChainMap.get(c.id),
    }));

    try {
      const { reportId, evaluation } = await submitTimelineEvaluation(
        scenario?.id ?? '',
        userPlacements,
        relationships,
        300
      );
      setEvaluationResult(evaluation);
    } catch (err) {
      console.error('Failed to submit evaluation:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const activeCard = selectedCardId ? cardsMap.get(selectedCardId) || null : null;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-65px)] items-center justify-center bg-slate-950 text-slate-300">
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-6 py-4 text-center">
          <p className="font-semibold text-white">Loading scenario workspace...</p>
          <p className="mt-2 text-sm text-slate-400">Preparing the timeline and evidence pool.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-65px)] items-center justify-center bg-slate-950 text-slate-300">
        <div className="max-w-md rounded-lg border border-amber-500/30 bg-slate-900/80 px-6 py-5 text-center">
          <p className="font-semibold text-amber-300">We couldn't load this scenario</p>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button
            onClick={onBackToScenarios}
            className="mt-4 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200"
          >
            Back to scenarios
          </button>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="flex h-[calc(100vh-65px)] items-center justify-center bg-slate-950 text-slate-300">
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-6 py-4 text-center">
          <p className="font-semibold text-white">No scenario selected</p>
          <p className="mt-2 text-sm text-slate-400">Choose a lab to begin reconstructing the timeline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-950 font-sans text-slate-100 overflow-hidden">
      {/* Top Control Bar */}
      <div className="bg-slate-900 border-b border-cyan-500/30 p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-md z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              cyberAudio.playClick();
              onBackToScenarios();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>LABS</span>
          </button>

          <div>
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <span>{scenario.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono">
                {scenario.difficulty}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-sans">{scenario.timeWindow}</p>
          </div>
        </div>

        {/* Action Controls & Evaluate */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRelationshipModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-300 font-bold"
          >
            <Network className="w-3.5 h-3.5" />
            <span>RELATIONSHIP BUILDER</span>
            {relationships.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-blue-500 text-slate-950 text-[10px]">
                {relationships.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              cyberAudio.playClick();
              setIsMitreOpen(!isMitreOpen);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-bold ${
              isMitreOpen
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>MITRE ATT&CK</span>
          </button>

          <button
            onClick={() => {
              cyberAudio.playClick();
              setIsAiDrawerOpen(!isAiDrawerOpen);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-bold ${
              isAiDrawerOpen
                ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span>AI ASSISTANT</span>
          </button>

          <button
            onClick={handleResetTimeline}
            title="Reset Timeline"
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleEvaluate}
            disabled={isEvaluating || placedCards.length === 0}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-slate-950 font-bold font-mono text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 fill-slate-950" />
            <span>EVALUATE TIMELINE</span>
          </button>
        </div>
      </div>

      {/* Attack Replay Bar */}
      <AttackReplayPlayer
        placedCards={placedCards}
        highlightedCardId={highlightedCardId}
        setHighlightedCardId={setHighlightedCardId}
      />

      {/* Main Workspace Split View */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Unplaced Evidence Pool Sidebar (Left) */}
        <div className="w-80 flex-shrink-0 hidden md:block">
          <UnplacedEvidencePool
            unplacedCards={unplacedCards}
            onPlaceCardOnTimeline={handlePlaceCardOnTimeline}
            onOpenDetailModal={onOpenDetailModal}
          />
        </div>

        {/* Central Timeline Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
          <TimelineCanvas
            placedCards={placedCards}
            relationships={relationships}
            selectedCardIdsForLink={selectedCardIdsForLink}
            highlightedCardId={highlightedCardId}
            onSelectCard={setSelectedCardId}
            onToggleSelectForLink={handleToggleSelectForLink}
            onOpenDetailModal={onOpenDetailModal}
            onRemoveCardFromTimeline={handleRemoveCardFromTimeline}
            onReorderTimeline={handleReorderTimeline}
            onDropUnplacedCard={handleDropUnplacedCard}
            assignedMitreMap={assignedMitreMap}
            assignedKillChainMap={assignedKillChainMap}
          />

          {/* Bottom Kill Chain Stage Selector */}
          <KillChainPanel
            selectedCardId={selectedCardId}
            assignedStage={selectedCardId ? assignedKillChainMap.get(selectedCardId) : undefined}
            onAssignKillChainStage={handleAssignKillChainStage}
          />
        </div>

        {/* MITRE ATT&CK Navigator Sidebar (Right) */}
        {isMitreOpen && (
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <MitrePanel
              selectedCard={activeCard}
              assignedMitreIds={selectedCardId ? assignedMitreMap.get(selectedCardId) || [] : []}
              onToggleMitreTechnique={handleToggleMitreTechnique}
              onClosePanel={() => setIsMitreOpen(false)}
            />
          </div>
        )}

        {/* AI Assistant Drawer Overlay */}
        {isAiDrawerOpen && (
          <div className="w-80 flex-shrink-0 absolute right-0 top-0 bottom-0 z-30 shadow-2xl">
            <AiAssistantDrawer
              scenario={scenario}
              placedCards={placedCards}
              onClose={() => setIsAiDrawerOpen(false)}
              onRequestHint={() => {
                const hint = activeCard?.hint || scenario.evidenceCards[0]?.hint || 'Look at the timestamp logs.';
                setHintMessage(hint);
              }}
            />
          </div>
        )}
      </div>

      {/* Relationship Modal */}
      {isRelationshipModalOpen && (
        <RelationshipModal
          selectedCardIds={selectedCardIdsForLink}
          cardsMap={cardsMap}
          existingRelationships={relationships}
          onAddRelationship={handleAddRelationship}
          onDeleteRelationship={handleDeleteRelationship}
          onClose={() => setIsRelationshipModalOpen(false)}
        />
      )}

      {/* Scoring Evaluation Modal */}
      {evaluationResult && (
        <ScoringSummaryModal
          evaluation={evaluationResult}
          scenario={scenario}
          onViewReport={() => {
            const currentEval = evaluationResult;
            setEvaluationResult(null);
            onViewReport({
              placedCards,
              assignedMitreMap,
              assignedKillChainMap,
              relationships,
              evaluationResult: currentEval,
            });
          }}
          onRetry={() => {
            setEvaluationResult(null);
            handleResetTimeline();
          }}
        />
      )}
    </div>
  );
};
