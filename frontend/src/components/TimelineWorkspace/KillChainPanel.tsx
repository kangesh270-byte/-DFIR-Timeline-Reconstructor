import React from 'react';
import { Layers } from 'lucide-react';
import { KillChainStage } from '../../types';
import { ALL_KILL_CHAIN_STAGES } from '../../data/mitreData';
import { cyberAudio } from '../../utils/audio';

interface KillChainPanelProps {
  selectedCardId: string | null;
  assignedStage?: KillChainStage;
  onAssignKillChainStage: (cardId: string, stage: KillChainStage) => void;
}

export const KillChainPanel: React.FC<KillChainPanelProps> = ({
  selectedCardId,
  assignedStage,
  onAssignKillChainStage,
}) => {
  if (!selectedCardId) return null;

  return (
    <div className="bg-slate-900/90 border-t border-slate-800 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
      <div className="flex items-center space-x-2 text-purple-400 font-bold flex-shrink-0">
        <Layers className="w-4 h-4 text-purple-400" />
        <span>KILL CHAIN ASSIGNMENT:</span>
      </div>

      <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
        {ALL_KILL_CHAIN_STAGES.map((stage) => {
          const isSelected = assignedStage === stage;
          return (
            <button
              key={stage}
              onClick={() => {
                cyberAudio.playClick();
                onAssignKillChainStage(selectedCardId, stage);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-purple-950 text-purple-300 border-purple-400 font-bold shadow-sm shadow-purple-500/20'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {stage}
            </button>
          );
        })}
      </div>
    </div>
  );
};
