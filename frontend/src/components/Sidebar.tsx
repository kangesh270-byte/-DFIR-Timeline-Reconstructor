import React from 'react';
import {
  Shield,
  FolderKanban,
  Box,
  Clock,
  Tag,
  GitCommit,
  FileText,
  Trophy,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cyberAudio } from '../utils/audio';

export type SidebarTab =
  | 'dashboard'
  | 'scenarios'
  | 'cases'
  | 'workspace'
  | 'mitre'
  | 'graph'
  | 'report'
  | 'leaderboard'
  | 'settings';

interface SidebarProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
}) => {
  const handleItemClick = (tab: SidebarTab) => {
    cyberAudio.playClick();
    setActiveTab(tab);
  };

  const navItems = [
    { id: 'dashboard' as SidebarTab, label: 'Dashboard', icon: Shield, badge: null },
    { id: 'scenarios' as SidebarTab, label: 'Incident Labs', icon: FolderKanban, badge: '4' },
    { id: 'cases' as SidebarTab, label: 'Cases', icon: Box, badge: '1' },
    { id: 'workspace' as SidebarTab, label: 'Timeline', icon: Clock, badge: '24' },
    { id: 'mitre' as SidebarTab, label: 'MITRE ATT&CK', icon: Tag, badge: '18' },
    { id: 'graph' as SidebarTab, label: 'Evidence Graph', icon: GitCommit, badge: null },
    { id: 'report' as SidebarTab, label: 'Reports', icon: FileText, badge: 'PDF' },
    { id: 'leaderboard' as SidebarTab, label: 'Leaderboard', icon: Trophy, badge: '#3' },
    { id: 'settings' as SidebarTab, label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <aside
      className={`bg-slate-900/90 border-r border-slate-800/90 flex flex-col justify-between transition-all duration-200 z-30 select-none flex-shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-3 space-y-4">
        {/* Collapse Toggle & Title */}
        <div className="flex items-center justify-between px-2 py-1">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                SOC NAVIGATION
              </span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors mx-auto"
            title={isCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Menu Items */}
        <nav className="space-y-1 font-mono text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                  isActive
                    ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 font-bold shadow-sm shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-[#E4E4E7] hover:bg-slate-800/60'
                }`}
                title={item.label}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Status */}
      <div className="p-3 border-t border-slate-800/80 font-mono text-[11px] text-slate-400">
        {!isCollapsed ? (
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500 uppercase">SOC SYSTEM</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <div className="text-slate-300 font-bold">DFIR Core v2.4</div>
            <div className="text-[10px] text-slate-500">Latency: 12ms • TLS 1.3</div>
          </div>
        ) : (
          <div className="flex justify-center" title="SOC Online • 12ms">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
};
