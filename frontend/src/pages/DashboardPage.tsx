import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Dashboard } from '../components/Dashboard';
import { IncidentSelection } from '../components/IncidentSelection';
import { TimelineWorkspace } from '../components/TimelineWorkspace/TimelineWorkspace';
import { IncidentReportView } from '../components/IncidentReportView';
import { EvidenceDetailModal } from '../components/EvidenceDetailModal';
import { UploadEvidence } from '../components/UploadEvidence';
import { fetchScenarios, fetchScenarioById, fetchLeaderboard, fetchUserProfile } from '../api/api';
import { Scenario, UserStats, LeaderboardEntry, EvidenceCard, KillChainStage, RelationshipLink, EvaluationResult } from '../types';

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scenarios' | 'workspace' | 'report' | 'upload'>('dashboard');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const selectedScenario = selectedScenarioId
    ? scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null
    : scenarios[0] ?? null;
  const [isScenarioLoading, setIsScenarioLoading] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeDetailCard, setActiveDetailCard] = useState<EvidenceCard | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    username: 'Alex_Vance_DFIR',
    title: 'Lead Incident Responder',
    xp: 2250,
    level: 5,
    labsCompleted: 4,
    averageAccuracy: 88,
    totalTimeSpentMinutes: 82,
    badges: [],
    recentSessions: [],
  });
  const [reportWorkspaceData, setReportWorkspaceData] = useState<{
    placedCards?: EvidenceCard[];
    assignedMitreMap?: Map<string, string[]>;
    assignedKillChainMap?: Map<string, KillChainStage>;
    relationships?: RelationshipLink[];
    evaluationResult?: EvaluationResult | null;
  }>({});

  useEffect(() => {
    void (async () => {
      try {
        const [scenarioData, leaderboardData, profileData] = await Promise.all([fetchScenarios(), fetchLeaderboard(), fetchUserProfile()]);
        if (Array.isArray(scenarioData) && scenarioData.length > 0) {
          setScenarios(scenarioData);
          setSelectedScenarioId((prev) => prev ?? scenarioData[0]?.id ?? null);
        }
        setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
        if (profileData) {
          setUserStats(profileData);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedScenarioId) {
      setCurrentScenario(null);
      setScenarioError(null);
      return;
    }

    void (async () => {
      setIsScenarioLoading(true);
      setScenarioError(null);
      try {
        const data = await fetchScenarioById(selectedScenarioId);
        setCurrentScenario(data ?? null);
      } catch (err) {
        console.error(err);
        setCurrentScenario(null);
        setScenarioError('Unable to load the selected scenario right now. Please try again.');
      } finally {
        setIsScenarioLoading(false);
      }
    })();
  }, [selectedScenarioId]);

  const handleSelectScenario = (id: string) => {
    setSelectedScenarioId(id);
    setActiveTab('workspace');
  };

  const handleViewReport = (data?: any) => {
    if (data) setReportWorkspaceData(data);
    setActiveTab('report');
  };

  const handleUploadSuccess = async () => {
    if (!selectedScenarioId) return;
    try {
      const data = await fetchScenarioById(selectedScenarioId);
      setCurrentScenario(data ?? null);
    } catch (err) {
      console.error('Failed to refresh scenario after upload:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header userStats={userStats} scenarios={scenarios} selectedScenarioId={selectedScenarioId} onSelectScenario={handleSelectScenario} isAiAssistantOpen={isAiAssistantOpen} setIsAiAssistantOpen={setIsAiAssistantOpen} isNotificationsOpen={isNotificationsOpen} setIsNotificationsOpen={setIsNotificationsOpen} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onNavigateTab={setActiveTab} />
      <main>
        {activeTab === 'dashboard' && (
          <Dashboard
            userStats={userStats}
            leaderboard={leaderboard}
            scenarios={scenarios}
            selectedScenarioId={selectedScenarioId}
            onSelectScenario={handleSelectScenario}
            onNavigateTab={setActiveTab}
          />
        )}
        {activeTab === 'scenarios' && <IncidentSelection scenarios={scenarios} onSelectScenario={handleSelectScenario} />}
        {activeTab === 'workspace' && (
          <>
            {scenarios.length === 0 && !isScenarioLoading ? (
              <div className="flex h-[calc(100vh-65px)] items-center justify-center bg-slate-950 text-slate-300">
                <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-6 py-6 text-center max-w-md">
                  <p className="font-semibold text-white">No Scenarios Available</p>
                  <p className="mt-2 text-sm text-slate-400">There are no scenarios to load right now. Please check back later.</p>
                  <button
                    onClick={() => setActiveTab('scenarios')}
                    className="mt-4 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200"
                  >
                    Back to Scenario Selection
                  </button>
                </div>
              </div>
            ) : (
              <TimelineWorkspace
                scenario={currentScenario}
                isLoading={isScenarioLoading}
                error={scenarioError}
                onViewReport={handleViewReport}
                onBackToScenarios={() => setActiveTab('scenarios')}
                onOpenDetailModal={(card) => setActiveDetailCard(card)}
              />
            )}
          </>
        )}
        {activeTab === 'report' && <IncidentReportView scenario={currentScenario} placedCards={reportWorkspaceData.placedCards} assignedMitreMap={reportWorkspaceData.assignedMitreMap} assignedKillChainMap={reportWorkspaceData.assignedKillChainMap} relationships={reportWorkspaceData.relationships} evaluationResult={reportWorkspaceData.evaluationResult} userStats={userStats} onBackToScenarios={() => setActiveTab('scenarios')} onReturnToWorkspace={() => setActiveTab('workspace')} />}
        {activeTab === 'upload' && <UploadEvidence selectedFile={null} selectedScenarioId={selectedScenarioId} scenarios={scenarios} onUploadSuccess={handleUploadSuccess} />}
      </main>
      {activeDetailCard && <EvidenceDetailModal card={activeDetailCard} onClose={() => setActiveDetailCard(null)} />}
    </div>
  );
}
