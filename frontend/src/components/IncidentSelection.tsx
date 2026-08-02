import React, { useState } from 'react';
import {
  Shield,
  Search,
  Filter,
  Play,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  Server,
  UserX,
  FileCode,
} from 'lucide-react';
import { Scenario } from '../types';
import { cyberAudio } from '../utils/audio';

interface IncidentSelectionProps {
  scenarios: Scenario[];
  onSelectScenario: (scenarioId: string) => void;
}

export const IncidentSelection: React.FC<IncidentSelectionProps> = ({
  scenarios,
  onSelectScenario,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  const filteredScenarios = scenarios.filter((scen) => {
    const matchesSearch =
      scen.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scen.threatActor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scen.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDiff = selectedDifficulty === 'ALL' || scen.difficulty.toUpperCase() === selectedDifficulty;

    return matchesSearch && matchesDiff;
  });

  const handleLaunch = (id: string) => {
    cyberAudio.playClick();
    onSelectScenario(id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-slate-100 font-sans">
      {/* Header Banner */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>CYBER RANGE • INCIDENT SELECTION MATRIX</span>
        </div>
        <h1 className="text-3xl font-extrabold font-mono tracking-tight text-white">
          Select a Forensic Attack Scenario
        </h1>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          Choose a fictional cyber incident. Each scenario loads raw forensic logs, endpoint telemetry, network captures, and memory dumps. Reconstruct the attack sequence, map MITRE ATT&CK techniques, and uncover the threat actor&apos;s narrative.
        </p>
      </div>

      {/* Search & Difficulty Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-md">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search scenario, threat actor, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0 mr-1" />
          {['ALL', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'].map((diff) => (
            <button
              key={diff}
              onClick={() => {
                cyberAudio.playClick();
                setSelectedDifficulty(diff);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedDifficulty === diff
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredScenarios.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">
            No Scenarios Available
          </div>
        ) : (
          filteredScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all shadow-xl hover:shadow-cyan-950/40 flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                {/* Category & Difficulty Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400 font-bold px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/30">
                    {scenario.category}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-md text-xs font-mono font-bold ${
                      scenario.difficulty === 'Easy'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : scenario.difficulty === 'Medium'
                        ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                        : 'bg-red-950 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {scenario.difficulty.toUpperCase()}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="space-y-2">
                  <h2 className="text-xl font-bold font-mono text-white group-hover:text-cyan-300 transition-colors">
                    {scenario.title}
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{scenario.description}</p>
                </div>

                {/* Metadata Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center space-x-2">
                    <UserX className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">THREAT ACTOR</span>
                      <span className="text-slate-200 truncate block text-[11px]">{scenario.threatActor}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center space-x-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">TARGET HOST</span>
                      <span className="text-slate-200 truncate block text-[11px]">{scenario.targetHost}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center space-x-2 col-span-2 sm:col-span-1">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">EVIDENCE CARDS</span>
                      <span className="text-amber-300 font-bold text-[11px]">{scenario.evidenceCount} Artifacts</span>
                    </div>
                  </div>
                </div>

                {/* Time Window */}
                <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                  <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="truncate">Time Window: {scenario.timeWindow}</span>
                </div>
              </div>

              {/* Launch Lab Action */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>Deterministic Scoring Ready</span>
                </span>

                <button
                  onClick={() => handleLaunch(scenario.id)}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>RECONSTRUCT TIMELINE</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
