import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Target,
  Trophy,
  Clock,
  ArrowRight,
  Sparkles,
  Search,
  LockOpen,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Play,
  TrendingUp,
  Award,
  FileText,
  Layers,
  Activity,
  Bell,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Database,
  Network,
  Cpu,
  AlertTriangle,
  Check,
  ExternalLink,
  Filter,
  BarChart3,
  HelpCircle,
  RefreshCw,
  FileCode,
  Share2,
  Eye,
  Terminal,
  FolderKanban,
  Box,
  GitCommit,
  Flame,
  Bot,
  Send,
  MessageSquare,
  ListFilter,
} from 'lucide-react';
import { UserStats, LeaderboardEntry, Scenario, EvidenceCard } from '../types';
import { cyberAudio } from '../utils/audio';

interface DashboardProps {
  userStats: UserStats;
  leaderboard: LeaderboardEntry[];
  scenarios: Scenario[];
  selectedScenarioId?: string | null;
  onSelectScenario: (scenarioId: string) => void;
  onNavigateTab?: (tab: 'dashboard' | 'scenarios' | 'workspace' | 'report' | 'upload') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userStats,
  leaderboard,
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onNavigateTab,
}) => {
  // Navigation & UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    'dashboard' | 'labs' | 'cases' | 'timeline' | 'mitre' | 'graph' | 'reports' | 'leaderboard' | 'upload' | 'settings'
  >('dashboard');

  // Modal / Drawer States
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedCaseFilter, setSelectedCaseFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<
    { sender: 'ai' | 'user'; text: string; time: string }[]
  >([
    {
      sender: 'ai',
      text: 'SOC Assistant online. I have analyzed Case DFIR-2026-001 (Play Ransomware). 35 evidence artifacts registered with 91% timeline confidence.',
      time: 'Just now',
    },
  ]);

  // Active Scenario focus
  const activeScenario =
    (selectedScenarioId && scenarios.find((scenario) => scenario.id === selectedScenarioId)) ||
    (scenarios && scenarios.length > 0 ? scenarios[0] : null);

  const scenarioEvidence = activeScenario?.evidenceCards || [];

  // Helper actions
  const handleLaunchLab = (id: string) => {
    cyberAudio.playClick();
    onSelectScenario(id);
  };

  const handleTabClick = (tabKey: typeof activeSidebarTab) => {
    cyberAudio.playClick();
    setActiveSidebarTab(tabKey);

    if (tabKey === 'labs' && onNavigateTab) {
      onNavigateTab('scenarios');
    } else if (tabKey === 'timeline' && onNavigateTab) {
      onNavigateTab('workspace');
    } else if (tabKey === 'reports' && onNavigateTab) {
      onNavigateTab('report');
    } else if (tabKey === 'upload' && onNavigateTab) {
      onNavigateTab('upload');
    }
  };

  const handleSendAiMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiChatInput.trim()) return;

    cyberAudio.playClick();
    const newMsg = { sender: 'user' as const, text: aiChatInput, time: 'Just now' };
    setAiChatMessages((prev) => [...prev, newMsg]);
    const userQuery = aiChatInput;
    setAiChatInput('');

    // Simulate AI Copilot Response
    setTimeout(() => {
      let response = 'Analyzing telemetry across endpoints...';
      if (userQuery.toLowerCase().includes('powershell')) {
        response = 'PowerShell execution detected at 08:22 UTC. Command contains base64 encoded string executing Mimikatz payload targeting LSASS memory.';
      } else if (userQuery.toLowerCase().includes('mitre') || userQuery.toLowerCase().includes('ttp')) {
        response = 'Identified TTPs: T1566.001 (Spearphishing Attachment), T1059.001 (PowerShell), T1003.001 (LSASS Memory), T1486 (Data Encrypted for Impact).';
      } else {
        response = `Understood analyst query: "${userQuery}". Correlating timeline cards EV-101 through EV-108. Sequence confidence remains 91%.`;
      }
      setAiChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: response, time: 'Just now' },
      ]);
    }, 600);
  };

  // Mock Notifications
  const mockNotifications = [
    {
      id: '1',
      title: 'New Artifact Imported',
      desc: 'WinEvt Security 4624 (Logon) added to Case DFIR-2026-001.',
      time: '2 mins ago',
      unread: true,
      type: 'info',
    },
    {
      id: '2',
      title: 'High Severity Anomaly',
      desc: 'vssadmin.exe shadow copy deletion detected on Host WS-FIN-042.',
      time: '14 mins ago',
      unread: true,
      type: 'warning',
    },
    {
      id: '3',
      title: 'MITRE Mapping Updated',
      desc: 'T1059.001 mapped to Evidence EV-104 with 95% confidence.',
      time: '1 hour ago',
      unread: false,
      type: 'success',
    },
  ];

  // Filtered evidence items for search modal
  const filteredEvidence = searchQuery.trim()
    ? scenarioEvidence.filter(
        (card) =>
          card?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card?.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card?.source?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : scenarioEvidence;

  return (
    <div className="flex min-h-[calc(100vh-65px)] bg-slate-950 text-[#E4E4E7] font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* ========================================== */}
      {/* 1. LEFT COLLAPSIBLE NAVIGATION SIDEBAR     */}
      {/* ========================================== */}
      <aside
        className={`bg-slate-900/90 border-r border-slate-800/90 flex flex-col justify-between transition-all duration-200 z-30 select-none ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="p-3 space-y-6">
          {/* Header Branding & Collapse Toggle */}
          <div className="flex items-center justify-between px-2 py-1">
            {!isSidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-widest">
                  DFIR STUDIO SOC
                </span>
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors mx-auto"
              title={isSidebarCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="space-y-1 font-mono text-xs">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Shield, badge: null },
              { id: 'labs', label: 'Incident Labs', icon: FolderKanban, badge: '4' },
              { id: 'cases', label: 'Cases', icon: Box, badge: '1' },
              { id: 'timeline', label: 'Timeline', icon: Clock, badge: '24' },
              { id: 'mitre', label: 'MITRE ATT&CK', icon: Tag, badge: '18' },
              { id: 'graph', label: 'Evidence Graph', icon: GitCommit, badge: null },
              { id: 'upload', label: 'Upload Evidence', icon: Database, badge: null },
              { id: 'reports', label: 'Reports', icon: FileText, badge: 'PDF' },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, badge: '#3' },
              { id: 'settings', label: 'Settings', icon: Settings, badge: null },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeSidebarTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id as typeof activeSidebarTab)}
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
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isSidebarCollapsed && item.badge && (
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

        {/* Sidebar Footer SOC Status */}
        <div className="p-3 border-t border-slate-800/80 font-mono text-[11px] text-slate-400">
          {!isSidebarCollapsed ? (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500 uppercase">SOC SYSTEM STATUS</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <div className="text-slate-300 font-bold">DFIR Core v2.4</div>
              <div className="text-[10px] text-slate-500">Latency: 12ms • Encryption: TLS 1.3</div>
            </div>
          ) : (
            <div className="flex justify-center" title="SOC Online • 12ms">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}
        </div>
      </aside>

      {/* ========================================== */}
      {/* MAIN WORKSPACE BODY AREA                    */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ========================================== */}
        {/* MAIN DASHBOARD CONTENT GRID (12-COLUMNS)   */}
        {/* ========================================== */}
        <main className="flex-1 p-4 md:p-5 lg:p-6 space-y-5 max-w-[1600px] mx-auto w-full">
          {/* 1. INVESTIGATION OVERVIEW (Replaces old welcome banner) */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800/90 p-5 md:p-6 shadow-md hover:border-slate-700/80 transition-all duration-150 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 font-mono text-xs">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-bold text-[10px]">
                    ACTIVE CASE • DFIR-2026-001
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/30 text-[10px] font-bold">
                    DIFFICULTY: HIGH / CRITICAL
                  </span>
                  <span className="text-slate-400 text-[10px]">Target Host: {activeScenario?.targetHost || 'WS-FIN-042'}</span>
                </div>
                <h1 className="text-xl md:text-2xl font-extrabold text-white font-mono tracking-tight pt-1">
                  {activeScenario?.title || 'Play Ransomware Outbreak'}
                </h1>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => activeScenario && handleLaunchLab(activeScenario.id)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>RESUME INVESTIGATION</span>
                </button>
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      cyberAudio.playClick();
                      onNavigateTab('scenarios');
                    }}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-xs font-bold"
                  >
                    <span>SWITCH CASE</span>
                  </button>
                )}
              </div>
            </div>

            {/* Overview Spec Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 font-mono text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase block">THREAT ACTOR</span>
                <span className="font-bold text-amber-400">{activeScenario?.threatActor || 'Play Ransomware Group'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase block">INVESTIGATION STATUS</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  IN PROGRESS (88%)
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase block">TIME WINDOW</span>
                <span className="font-bold text-slate-200">{activeScenario?.timeWindow || '2026-07-14 08:00 - 10:30 UTC'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase block">INVESTIGATION TIME</span>
                <span className="font-bold text-slate-200">{userStats.totalTimeSpentMinutes}m Elapsed</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase block">ANALYST ASSIGNED</span>
                <span className="font-bold text-cyan-400">{userStats.username}</span>
              </div>
            </div>
          </div>

          {/* 2. FOUR KPI CARDS (12-Column Responsive Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Evidence */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 md:p-5 space-y-2 hover:border-emerald-500/40 transition-all duration-150 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 font-mono text-xs">
                <span className="uppercase tracking-wider">EVIDENCE ARTIFACTS</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold font-mono text-white">35</span>
                <span className="text-xs text-slate-400 font-mono">Cards Mapped</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>14 Logs • 8 Net • 7 Mem</span>
                <span className="text-emerald-400 font-bold">100% Raw Verified</span>
              </div>
            </div>

            {/* KPI 2: Timeline Events */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 md:p-5 space-y-2 hover:border-emerald-500/40 transition-all duration-150 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 font-mono text-xs">
                <span className="uppercase tracking-wider">TIMELINE EVENTS</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold font-mono text-cyan-400">24</span>
                <span className="text-xs text-slate-400 font-mono">Sequential Steps</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Continuity Index: 1.0</span>
                <span className="text-cyan-400 font-bold">0 Time Gaps</span>
              </div>
            </div>

            {/* KPI 3: MITRE Coverage */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 md:p-5 space-y-2 hover:border-emerald-500/40 transition-all duration-150 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 font-mono text-xs">
                <span className="uppercase tracking-wider">MITRE COVERAGE</span>
                <Tag className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold font-mono text-purple-300">18</span>
                <span className="text-xs text-slate-400 font-mono">TTP Tags</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Across 7 Tactics</span>
                <span className="text-purple-400 font-bold">100% Aligned</span>
              </div>
            </div>

            {/* KPI 4: Accuracy */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 md:p-5 space-y-2 hover:border-emerald-500/40 transition-all duration-150 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 font-mono text-xs">
                <span className="uppercase tracking-wider">ACCURACY SCORE</span>
                <Target className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold font-mono text-amber-300">{userStats.averageAccuracy}%</span>
                <span className="text-xs text-emerald-400 font-mono flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +3.2%
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Grade: Tier-1 DFIR</span>
                <span className="text-amber-400 font-bold">High Precision</span>
              </div>
            </div>
          </div>

          {/* 3. CHARTS ROW: ATTACK TIMELINE & MITRE HEATMAP (12-COL GRID: 7 COL / 5 COL) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ATTACK TIMELINE CHART (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between font-mono text-xs border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white uppercase tracking-wider">ATTACK TIMELINE PROGRESSION</span>
                </div>
                <span className="text-slate-500 text-[10px]">CHRONOLOGICAL PIPELINE</span>
              </div>

              {/* Timeline Horizontal Step Bar */}
              <div className="space-y-3 font-mono text-xs">
                {[
                  { stage: 'Initial Access', event: 'Phishing Email & Malicious attachment', time: '08:14 UTC', sev: 'Low', color: 'border-blue-500/50 bg-blue-950/40 text-blue-300' },
                  { stage: 'Execution', event: 'PowerShell encoded command execution', time: '08:22 UTC', sev: 'High', color: 'border-orange-500/50 bg-orange-950/40 text-orange-300' },
                  { stage: 'Persistence', event: 'Windows Registry Run Key Created', time: '08:45 UTC', sev: 'High', color: 'border-orange-500/50 bg-orange-950/40 text-orange-300' },
                  { stage: 'Defense Evasion', event: 'Windows Event Logs Cleared (wevtutil)', time: '09:10 UTC', sev: 'Critical', color: 'border-red-500/50 bg-red-950/40 text-red-300' },
                  { stage: 'Lateral Movement', event: 'WMI Remote Process Execution', time: '09:30 UTC', sev: 'High', color: 'border-orange-500/50 bg-orange-950/40 text-orange-300' },
                  { stage: 'Impact', event: 'Play Ransomware Payload Encrypts Volume', time: '10:05 UTC', sev: 'Critical', color: 'border-red-500/50 bg-red-950/40 text-red-300' },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">{step.stage}</div>
                        <div className="text-[11px] text-slate-400 font-sans truncate">{step.event}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 flex-shrink-0 font-mono text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${step.color}`}>
                        {step.sev}
                      </span>
                      <span className="text-slate-400 text-[10px]">{step.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MITRE ATT&CK HEATMAP (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between font-mono text-xs border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white uppercase tracking-wider">MITRE ATT&CK HEATMAP</span>
                </div>
                <span className="text-purple-400 text-[10px] font-bold">18 TTPs Active</span>
              </div>

              {/* Grid Matrix of MITRE Tactics */}
              <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                {[
                  { tactic: 'Initial Access', tech: 'T1566.001', count: 2, level: 'bg-purple-950/80 border-purple-500/50 text-purple-300' },
                  { tactic: 'Execution', tech: 'T1059.001', count: 4, level: 'bg-purple-900/90 border-purple-400 text-purple-200' },
                  { tactic: 'Persistence', tech: 'T1053.005', count: 3, level: 'bg-purple-950/80 border-purple-500/50 text-purple-300' },
                  { tactic: 'Privilege Escalation', tech: 'T1068', count: 2, level: 'bg-purple-950/60 border-purple-600/40 text-purple-300' },
                  { tactic: 'Defense Evasion', tech: 'T1070.001', count: 3, level: 'bg-purple-900/90 border-purple-400 text-purple-200' },
                  { tactic: 'Credential Access', tech: 'T1003.001', count: 2, level: 'bg-purple-950/80 border-purple-500/50 text-purple-300' },
                  { tactic: 'Lateral Movement', tech: 'T1021.002', count: 1, level: 'bg-purple-950/60 border-purple-600/40 text-purple-300' },
                  { tactic: 'Impact', tech: 'T1486', count: 1, level: 'bg-purple-900/90 border-purple-400 text-purple-200' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border space-y-1 transition-transform hover:scale-[1.02] cursor-pointer ${item.level}`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="truncate">{item.tactic}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950/80 text-white font-mono">
                        {item.count} TTPs
                      </span>
                    </div>
                    <div className="text-[10px] opacity-80">{item.tech}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. RECENT EVIDENCE & AI MENTOR SUGGESTIONS (12-COL GRID: 6 COL / 6 COL) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* RECENT EVIDENCE PANEL */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between font-mono text-xs border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white uppercase tracking-wider">RECENT EVIDENCE ARTIFACTS</span>
                </div>
                <span className="text-slate-500 text-[10px]">35 Total Registered</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {scenarioEvidence.slice(0, 4).map((card) => (
                  <div
                    key={card.id}
                    onClick={() => activeScenario && handleLaunchLab(activeScenario.id)}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer space-y-1.5 transition-colors group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {card.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{card.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans line-clamp-1">{card.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                      <span>Source: {card.source}</span>
                      <span className="text-purple-400 font-bold">
                        MITRE: {(card.correctMitreTechniques || []).map((m) => m.id).join(', ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI MENTOR / AI SUGGESTIONS PANEL */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between font-mono text-xs border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white uppercase tracking-wider">AI MENTOR FINDINGS & RECOMMENDATIONS</span>
                </div>
                <span className="text-emerald-400 text-[10px] font-bold">AUTOMATED ANALYSIS</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Correlated Attack Vector</span>
                  </div>
                  <p className="text-slate-300 text-xs font-sans leading-relaxed">
                    PowerShell execution at 08:22 UTC uses `-EncodedCommand` which matches T1059.001. High confidence link to previous email attachment EV-101.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Sequence Verification Tip</span>
                  </div>
                  <p className="text-slate-300 text-xs font-sans leading-relaxed">
                    Ensure Event Logs Cleared artifact (EV-106) is ordered before Ransomware Encryption (EV-108) to maintain 100% chronological integrity.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-blue-500/30 space-y-1.5">
                  <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
                    <HelpCircle className="w-4 h-4 text-blue-400" />
                    <span>Causal Link Recommendation</span>
                  </div>
                  <p className="text-slate-300 text-xs font-sans leading-relaxed">
                    Connect EV-104 (PowerShell Execution) to EV-105 (LSASS Dump) with relationship type <span className="text-blue-300 font-mono font-bold">'Executed'</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. INVESTIGATION PROGRESS & RECENT ACTIVITY (12-COL GRID: 6 COL / 6 COL) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* INVESTIGATION PROGRESS SECTION */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between font-mono text-xs border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white uppercase tracking-wider">INVESTIGATION PROGRESS</span>
                </div>
                <span className="text-cyan-400 text-[10px] font-bold">OVERALL: 88% COMPLETE</span>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300 text-xs">
                    <span>Timeline Sequence Ordering</span>
                    <span className="font-bold text-emerald-400">92%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300 text-xs">
                    <span>MITRE ATT&CK Tagging</span>
                    <span className="font-bold text-purple-400">88%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '88%' }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300 text-xs">
                    <span>Kill Chain Phase Alignment</span>
                    <span className="font-bold text-amber-400">95%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '95%' }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300 text-xs">
                    <span>Evidence Linkage Graph</span>
                    <span className="font-bold text-blue-400">80%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* RECENT INVESTIGATION ACTIVITY PANEL */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between font-mono text-xs border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white uppercase tracking-wider">RECENT INVESTIGATION ACTIVITY</span>
                </div>
                <span className="text-slate-500 text-[10px]">SOC AUDIT STREAM</span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                {[
                  { act: 'Assigned MITRE T1059.001 to Evidence EV-104', time: '10 mins ago', user: 'Alex_Vance_DFIR', type: 'mitre' },
                  { act: 'Verified chronological sequence for EV-101 & EV-102', time: '25 mins ago', user: 'Alex_Vance_DFIR', type: 'chrono' },
                  { act: 'Created causal link EV-104 -> EV-105 (Executed)', time: '40 mins ago', user: 'Alex_Vance_DFIR', type: 'graph' },
                  { act: 'Evaluated Timeline Score: 910/1000 pts (3 Stars)', time: '1 hour ago', user: 'System', type: 'score' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="text-slate-300 truncate">{item.act}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 flex-shrink-0 ml-2">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6. RECENT REPORTS & LEADERBOARD (12-COL GRID: 6 COL / 6 COL) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* RECENT REPORTS PANEL */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between font-mono text-xs border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white uppercase tracking-wider">RECENT REPORTS</span>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      cyberAudio.playClick();
                      onNavigateTab('report');
                    }}
                    className="text-emerald-400 text-[10px] font-bold hover:underline"
                  >
                    VIEW ALL REPORTS
                  </button>
                )}
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div
                  onClick={() => onNavigateTab && onNavigateTab('report')}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileCode className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="font-bold text-white text-xs">
                        DFIR-CASE-2026-RANSOMWARE_Forensic_Report.pdf
                      </div>
                      <div className="text-[10px] text-slate-500">Evaluated Score: 910/1000 • 3 Stars</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                    VERIFIED
                  </span>
                </div>

                <div
                  onClick={() => onNavigateTab && onNavigateTab('report')}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileCode className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-bold text-white text-xs">
                        DFIR-CASE-2026-002_APT29_Spearphish_Draft.pdf
                      </div>
                      <div className="text-[10px] text-slate-500">Evaluated Score: 850/1000 • 2 Stars</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-bold">
                    IN REVIEW
                  </span>
                </div>
              </div>
            </div>

            {/* LEADERBOARD PANEL */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between font-mono text-xs border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white uppercase tracking-wider">SOC LEADERBOARD RANKINGS</span>
                </div>
                <span className="text-slate-500 text-[10px]">ANALYST XP LEAGUE</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.username}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                      entry.username === userStats.username
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-950 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${
                          entry.rank === 1
                            ? 'bg-amber-400 text-slate-950'
                            : entry.rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : entry.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {entry.rank}
                      </span>
                      <img
                        src={entry.avatar}
                        alt={entry.username}
                        className="w-7 h-7 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          {entry.username}
                          {entry.username === userStats.username && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-900 text-emerald-300">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{entry.title}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-emerald-400">{entry.xp} XP</div>
                      <div className="text-[10px] text-slate-500">{entry.avgAccuracy}% Acc</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
