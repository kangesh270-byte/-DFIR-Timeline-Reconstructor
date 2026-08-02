/**
 * DFIR Incident Timeline Reconstructor - Core Types
 */

export type Category =
  | 'Windows Logs'
  | 'Linux Logs'
  | 'Firewall'
  | 'DNS'
  | 'Email'
  | 'EDR'
  | 'Registry'
  | 'Browser History'
  | 'PowerShell'
  | 'Memory'
  | 'Network'
  | 'Cloud'
  | 'USB';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export type MitreTactic =
  | 'Initial Access'
  | 'Execution'
  | 'Persistence'
  | 'Privilege Escalation'
  | 'Credential Access'
  | 'Discovery'
  | 'Lateral Movement'
  | 'Collection'
  | 'Command and Control'
  | 'Exfiltration'
  | 'Impact';

export type KillChainStage =
  | 'Reconnaissance'
  | 'Weaponization'
  | 'Delivery'
  | 'Exploitation'
  | 'Installation'
  | 'Command and Control'
  | 'Actions on Objectives';

export type RelationshipType =
  | 'Caused By'
  | 'Triggered'
  | 'Downloaded'
  | 'Executed'
  | 'Connected'
  | 'Created'
  | 'Modified'
  | 'Deleted';

export interface MitreTechnique {
  id: string; // e.g. "T1566.001"
  name: string; // e.g. "Spearphishing Attachment"
  tactic: MitreTactic;
  description: string;
}

export interface EvidenceCard {
  id: string;
  scenarioId?: string;
  title: string;
  timestamp: string; // e.g. "2026-10-12 08:14:02 UTC"
  category: string;
  severity: Severity;
  source: string; // e.g. "WinEvt: Security 4624"
  description: string;
  host: string;
  user: string;
  processName?: string;
  fileName?: string;
  fileHash?: string;
  registryKey?: string;
  rawLog?: string;
  hint?: string;
  correctMitreTechniques?: MitreTechnique[];
  correctKillChain?: KillChainStage;
}

export interface RelationshipLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
}

export interface RelationshipFlowItem {
  from: string;
  to: string;
  reason: string;
  mitre_technique: string;
  attack_stage: string;
}

export interface Scenario {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  category: string;
  description: string;
  targetHost: string;
  threatActor: string;
  evidenceCount: number;
  timeWindow: string;
  evidenceCards: EvidenceCard[];
  referenceRelationships: RelationshipLink[];
  narrative: string;
  recommendations: string[];
}

export interface UserPlacement {
  evidenceId: string;
  orderIndex: number; // position on timeline
  assignedMitreTechniqueIds: string[];
  assignedKillChainStage?: KillChainStage;
}

export interface EvaluationResult {
  score: number; // 0 - 1000
  maxScore: number;
  accuracyPercentage: number;
  chronologicalAccuracy: number;
  mitreAccuracy: number;
  killChainAccuracy: number;
  relationshipAccuracy: number;
  mistakes: string[];
  hints: string[];
  relationshipFlow?: RelationshipFlowItem[];
  aiAnalysis: {
    overallSummary: string;
    sequenceCritique: string;
    mitreCritique: string;
    keyTakeaway: string;
  };
  starsEarned: number; // 1 to 3
  xpGained: number;
  timeTakenSeconds: number;
}

export interface IncidentReport {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  completedAt: string;
  score: number;
  accuracyPercentage: number;
  starsEarned: number;
  userPlacements: UserPlacement[];
  relationships: RelationshipLink[];
  narrative: string;
  weaknesses: string[];
  recommendations: string[];
  evaluation: EvaluationResult;
}

export interface UserStats {
  username: string;
  title: string;
  xp: number;
  level: number;
  labsCompleted: number;
  averageAccuracy: number;
  totalTimeSpentMinutes: number;
  badges: Badge[];
  recentSessions: SessionSummary[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface SessionSummary {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  date: string;
  score: number;
  accuracy: number;
  timeSeconds: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  title: string;
  xp: number;
  labsCompleted: number;
  avgAccuracy: number;
  avatar: string;
}
