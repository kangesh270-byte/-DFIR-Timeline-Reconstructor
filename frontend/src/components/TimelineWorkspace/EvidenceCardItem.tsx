import React from 'react';
import {
  ShieldAlert,
  Terminal,
  Globe,
  Mail,
  Cpu,
  Database,
  Search,
  HardDrive,
  Wifi,
  Cloud,
  Usb,
  FileCode,
  Tag,
  Copy,
  ExternalLink,
  GripVertical,
  Layers,
  Sparkles,
} from 'lucide-react';
import { EvidenceCard, Category, Severity, KillChainStage } from '../../types';
import { cyberAudio } from '../../utils/audio';

interface EvidenceCardItemProps {
  card: EvidenceCard;
  orderIndex?: number;
  assignedMitreIds?: string[];
  assignedKillChainStage?: KillChainStage;
  isSelectedForLink?: boolean;
  onToggleSelectForLink?: (id: string) => void;
  onOpenDetailModal: (card: EvidenceCard) => void;
  onRemoveFromTimeline?: (id: string) => void;
  isDraggable?: boolean;
  isReplayHighlighted?: boolean;
}

export const EvidenceCardItem: React.FC<EvidenceCardItemProps> = ({
  card,
  orderIndex,
  assignedMitreIds = [],
  assignedKillChainStage,
  isSelectedForLink = false,
  onToggleSelectForLink,
  onOpenDetailModal,
  onRemoveFromTimeline,
  isDraggable = true,
  isReplayHighlighted = false, }) => {
  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'Windows Logs':
        return <Terminal className="w-4 h-4 text-blue-400" />;
      case 'Linux Logs':
        return <FileCode className="w-4 h-4 text-emerald-400" />;
      case 'Firewall':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'DNS':
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'Email':
        return <Mail className="w-4 h-4 text-amber-400" />;
      case 'EDR':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'Registry':
        return <Database className="w-4 h-4 text-indigo-400" />;
      case 'Browser History':
        return <Search className="w-4 h-4 text-teal-400" />;
      case 'PowerShell':
        return <Terminal className="w-4 h-4 text-cyan-300" />;
      case 'Memory':
        return <HardDrive className="w-4 h-4 text-yellow-400" />;
      case 'Network':
        return <Wifi className="w-4 h-4 text-blue-300" />;
      case 'Cloud':
        return <Cloud className="w-4 h-4 text-sky-400" />;
      case 'USB':
        return <Usb className="w-4 h-4 text-rose-400" />;
      default:
        return <Terminal className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSeverityBadgeClass = (sev: Severity) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-950/90 text-red-400 border-red-500/50 shadow-sm shadow-red-900/30';
      case 'High':
        return 'bg-amber-950/90 text-amber-400 border-amber-500/50';
      case 'Medium':
        return 'bg-yellow-950/90 text-yellow-400 border-yellow-500/50';
      case 'Low':
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const copyHash = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (card.hash) {
      navigator.clipboard.writeText(card.hash);
      cyberAudio.playClick();
    }
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      className={`relative group p-3.5 rounded-xl border font-sans transition-all text-xs select-none ${
        isReplayHighlighted
          ? 'bg-cyan-950/90 border-cyan-400 shadow-xl shadow-cyan-500/40 scale-[1.02] ring-2 ring-cyan-400'
          : isSelectedForLink
          ? 'bg-blue-950/80 border-blue-400 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20'
          : 'bg-slate-900/95 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 shadow-md'
      }`}
    >
      {/* Top Bar: Order badge, Category, Severity & Controls */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2">
          {isDraggable && <GripVertical className="w-3.5 h-3.5 text-slate-500 cursor-grab active:cursor-grabbing" />}
          {typeof orderIndex === 'number' && (
            <span className="w-5 h-5 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold flex items-center justify-center text-[10px]">
              #{orderIndex + 1}
            </span>
          )}
          <span className="flex items-center space-x-1.5 font-mono text-slate-300 font-bold text-[11px]">
            {getCategoryIcon(card.category)}
            <span>{card.category}</span>
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadgeClass(card.severity)}`}>
            {card.severity}
          </span>

          {onToggleSelectForLink && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                cyberAudio.playClick();
                onToggleSelectForLink(card.id);
              }}
              title={isSelectedForLink ? 'Deselect for Relationship Link' : 'Select for Relationship Link'}
              className={`p-1 rounded border transition-colors ${
                isSelectedForLink
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
            </button>
          )}

          {onRemoveFromTimeline && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                cyberAudio.playClick();
                onRemoveFromTimeline(card.id);
              }}
              title="Remove from timeline"
              className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 hover:text-red-400 border border-slate-800 text-[10px]"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Title & Timestamp */}
      <div className="space-y-1 mb-2">
        <h4 className="font-bold text-white text-xs font-mono line-clamp-1 group-hover:text-cyan-300 transition-colors">
          {card.title}
        </h4>
        <div className="text-[11px] font-mono text-cyan-400/90 font-medium">{card.timestamp}</div>
      </div>

      {/* Description Snippet */}
      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mb-2 font-sans">{card.description}</p>

      {/* Host, User & Hash Footer */}
      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/80 gap-1">
        <div className="flex items-center space-x-2 truncate">
          <span className="text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{card.host}</span>
          <span className="text-slate-400">{card.user}</span>
        </div>

        {card.hash && card.hash !== 'N/A' && (
          <button
            onClick={copyHash}
            title={`Copy SHA256 Hash: ${card.hash}`}
            className="flex items-center space-x-1 text-slate-500 hover:text-cyan-400 transition-colors"
          >
            <Copy className="w-3 h-3" />
            <span>{card.hash.substring(0, 6)}...</span>
          </button>
        )}
      </div>

      {/* MITRE Tags & Kill Chain Badges */}
      {(assignedMitreIds.length > 0 || assignedKillChainStage) && (
        <div className="flex flex-wrap gap-1 pt-2">
          {assignedKillChainStage && (
            <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-[9px] font-mono flex items-center gap-1">
              <Layers className="w-2.5 h-2.5" />
              <span>{assignedKillChainStage}</span>
            </span>
          )}

          {assignedMitreIds.map((mId) => (
            <span key={mId} className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              <span>{mId}</span>
            </span>
          ))}
        </div>
      )}

      {/* Expand Raw Log Trigger */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            cyberAudio.playClick();
            onOpenDetailModal(card);
          }}
          className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 hover:underline"
        >
          <span>Raw Forensic Log</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};
