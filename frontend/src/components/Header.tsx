import React, { useState } from 'react';
import {
  Shield,
  Search,
  Bot,
  Bell,
  X,
  Award,
  ChevronDown,
  Activity,
  Database,
  Tag,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';
import { UserStats, Scenario } from '../types';
import { cyberAudio } from '../utils/audio';

interface HeaderProps {
  userStats: UserStats;
  scenarios: Scenario[];
  selectedScenarioId?: string | null;
  onSelectScenario: (id: string) => void;
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  userStats,
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  isAiAssistantOpen,
  setIsAiAssistantOpen,
  isNotificationsOpen,
  setIsNotificationsOpen,
  searchQuery,
  setSearchQuery,
  onNavigateTab,
}) => {
  const [isSearchActive, setIsSearchActive] = useState(false);

  const activeScenario =
    (selectedScenarioId && scenarios.find((scenario) => scenario.id === selectedScenarioId)) ||
    (scenarios && scenarios.length > 0 ? scenarios[0] : null);
  const scenarioEvidence = activeScenario?.evidenceCards || [];

  // Filter evidence for global search
const safeSearchQuery = searchQuery ?? '';

const filteredEvidence = safeSearchQuery.trim()
  ? scenarioEvidence.filter(
      (card) =>
        card?.title?.toLowerCase().includes(safeSearchQuery.toLowerCase()) ||
        card?.description?.toLowerCase().includes(safeSearchQuery.toLowerCase()) ||
        card?.category?.toLowerCase().includes(safeSearchQuery.toLowerCase()) ||
        card?.source?.toLowerCase().includes(safeSearchQuery.toLowerCase())
    )
  : scenarioEvidence;

  const mockNotifications = [
    {
      id: '1',
      title: 'New Artifact Imported',
      desc: 'WinEvt Security 4624 (Logon) added to Case DFIR-2026-001.',
      time: '2 mins ago',
      type: 'info',
    },
    {
      id: '2',
      title: 'High Severity Anomaly',
      desc: 'vssadmin.exe shadow copy deletion detected on Host WS-FIN-042.',
      time: '14 mins ago',
      type: 'warning',
    },
    {
      id: '3',
      title: 'MITRE Mapping Updated',
      desc: 'T1059.001 mapped to Evidence EV-104 with 95% confidence.',
      time: '1 hour ago',
      type: 'success',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/90 px-4 md:px-6 py-2.5 text-[#E4E4E7] font-mono text-xs shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div
          onClick={() => {
            cyberAudio.playClick();
            onNavigateTab('dashboard');
          }}
          className="flex items-center space-x-3 cursor-pointer group flex-shrink-0"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 shadow-sm group-hover:border-emerald-400 transition-colors">
            <Shield className="w-4 h-4 text-emerald-400" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm tracking-wider text-white font-mono">
                DFIR STUDIO
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold">
                SOC PLATFORM
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans hidden sm:block">
              Forensic Timeline & Incident Reconstruction
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
<input
  type="text"
  value={safeSearchQuery}
  onChange={(e) => {
    setSearchQuery(e.target.value);
    setIsSearchActive(true);
  }}
  onFocus={() => setIsSearchActive(true)}
  placeholder="Case search evidence, TTPs, logs... (Ctrl + K)"
  className="w-full bg-slate-950 border border-slate-800/90 rounded-lg pl-9 pr-12 py-1.5 text-xs text-[#E4E4E7] placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all font-mono"
/>

<span className="absolute right-2.5 top-1.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
  ⌘K
</span>
          </div>

          {/* Quick Search Dropdown Overlay */}
      {isSearchActive && safeSearchQuery.trim() && (
            <div className="absolute top-11 left-0 right-0 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 space-y-2 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                <span>EVIDENCE RESULTS ({filteredEvidence.length})</span>
                <button onClick={() => setIsSearchActive(false)} className="hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {filteredEvidence.length > 0 ? (
                filteredEvidence.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      cyberAudio.playClick();
                      setIsSearchActive(false);
                      if (activeScenario) onSelectScenario(activeScenario.id);
                    }}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 cursor-pointer space-y-1 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400">{ev.title}</span>
                      <span className="text-[10px] text-slate-400">{ev.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 font-sans">{ev.description}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 text-xs">No matching artifacts found.</div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls: AI Assistant, Notifications, Profile */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* AI Assistant Button */}
          <button
            onClick={() => {
              cyberAudio.playClick();
              setIsAiAssistantOpen((prev) => !prev);
            }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-bold transition-all duration-150 ${
              isAiAssistantOpen
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-emerald-400'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">AI Assistant</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => {
              cyberAudio.playClick();
              setIsNotificationsOpen((prev) => !prev);
            }}
            className="relative p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-colors"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
            <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center font-bold text-emerald-400 text-[11px]">
              AV
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-bold text-slate-200 text-xs leading-none">{userStats.username}</span>
              <span className="text-[9px] text-emerald-400 leading-tight">Lvl {userStats.level} • {userStats.xp} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Popover */}
      {isNotificationsOpen && (
        <div className="absolute top-12 right-6 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" /> SOC ALERTS & NOTIFICATIONS
            </span>
            <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {mockNotifications.map((notif) => (
              <div
                key={notif.id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>{notif.title}</span>
                  <span className="text-[10px] text-slate-500">{notif.time}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-snug">{notif.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
