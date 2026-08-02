import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, SkipBack, SkipForward, Volume2, Sparkles } from 'lucide-react';
import { EvidenceCard } from '../../types';
import { cyberAudio } from '../../utils/audio';

interface AttackReplayPlayerProps {
  placedCards: EvidenceCard[];
  highlightedCardId: string | null;
  setHighlightedCardId: (id: string | null) => void;
}

export const AttackReplayPlayer: React.FC<AttackReplayPlayerProps> = ({
  placedCards,
  highlightedCardId,
  setHighlightedCardId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isPlaying && placedCards.length > 0) {
      const currentCard = placedCards[currentIndex];
      if (currentCard) {
        setHighlightedCardId(currentCard.id);
        cyberAudio.playReplayPulse(400 + currentIndex * 30);
      }

      timer = setTimeout(() => {
        if (currentIndex < placedCards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 2000 / speedMultiplier);
    }

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, placedCards, speedMultiplier, setHighlightedCardId]);

  const togglePlay = () => {
    cyberAudio.playClick();
    if (!isPlaying && currentIndex >= placedCards.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    cyberAudio.playClick();
    setIsPlaying(false);
    setCurrentIndex(0);
    setHighlightedCardId(placedCards[0]?.id || null);
  };

  const handlePrev = () => {
    cyberAudio.playClick();
    const nextIdx = Math.max(0, currentIndex - 1);
    setCurrentIndex(nextIdx);
    setHighlightedCardId(placedCards[nextIdx]?.id || null);
  };

  const handleNext = () => {
    cyberAudio.playClick();
    const nextIdx = Math.min(placedCards.length - 1, currentIndex + 1);
    setCurrentIndex(nextIdx);
    setHighlightedCardId(placedCards[nextIdx]?.id || null);
  };

  if (placedCards.length === 0) return null;

  const activeCard = placedCards[currentIndex];

  return (
    <div className="bg-slate-950/95 border-b border-cyan-500/30 p-3 px-4 flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs text-slate-100 shadow-md">
      {/* Player Controls */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
          <button
            onClick={handleReset}
            title="Reset to start"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handlePrev}
            title="Previous Step"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={togglePlay}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
            <span>{isPlaying ? 'PAUSE' : 'REPLAY ATTACK'}</span>
          </button>

          <button
            onClick={handleNext}
            title="Next Step"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Toggle */}
        <div className="flex items-center space-x-1">
          <span className="text-[10px] text-slate-400">SPEED:</span>
          {[1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => {
                cyberAudio.playClick();
                setSpeedMultiplier(spd);
              }}
              className={`px-2 py-0.5 rounded text-[10px] ${
                speedMultiplier === spd ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-500'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Step Info Narration */}
      {activeCard && (
        <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-xl max-w-xl truncate">
          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold text-[10px] border border-cyan-500/30 flex-shrink-0">
            STEP {currentIndex + 1} / {placedCards.length}
          </span>
          <span className="text-slate-200 font-bold truncate text-[11px]">{activeCard.title}</span>
          <span className="text-cyan-400/80 truncate text-[10px] hidden sm:inline">{activeCard.timestamp}</span>
        </div>
      )}
    </div>
  );
};
