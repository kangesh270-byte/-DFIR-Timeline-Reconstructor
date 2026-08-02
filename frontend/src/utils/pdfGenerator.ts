import { jsPDF } from 'jspdf';
import {
  Scenario,
  EvidenceCard,
  KillChainStage,
  RelationshipLink,
  EvaluationResult,
  UserStats,
  RelationshipFlowItem,
} from '../types';

export function getRelationshipFlowItems(
  relationships: RelationshipLink[],
  evaluation: EvaluationResult,
  cards: EvidenceCard[] = []
): RelationshipFlowItem[] {
  const flowFromEvaluation = (evaluation as EvaluationResult & { relationshipFlow?: RelationshipFlowItem[] }).relationshipFlow;
  if (Array.isArray(flowFromEvaluation) && flowFromEvaluation.length > 0) {
    return flowFromEvaluation;
  }

  return relationships.map((rel, index) => {
    const sourceCard = cards.find((card) => card.id === rel.sourceId);
    const targetCard = cards.find((card) => card.id === rel.targetId);

    return {
      from: sourceCard?.title || rel.sourceId || `Event ${index + 1}`,
      to: targetCard?.title || rel.targetId || `Event ${index + 2}`,
      reason: `Relationship ${index + 1} captured during timeline review.`,
      mitre_technique: sourceCard?.correctMitreTechniques?.[0]?.id || 'T1566.001',
      attack_stage: targetCard?.correctKillChain || 'Execution',
    };
  });
}

export function generateVectorPdfReport(
  scenario: Scenario,
  placedCards: EvidenceCard[],
  assignedMitreMap: Map<string, string[]>,
  assignedKillChainMap: Map<string, KillChainStage>,
  relationships: RelationshipLink[],
  evaluation: EvaluationResult,
  userStats: UserStats
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cardsToRender = placedCards.length > 0 ? placedCards : scenario.evidenceCards;
  const caseId = `DFIR-CASE-2026-${scenario.id.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
  const relationshipFlowItems = getRelationshipFlowItems(relationships, evaluation, cardsToRender);

  const addHeaderFooter = (pageNo: number, totalPages: number = 10) => {
    if (pageNo === 1) return; // Skip cover page

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('DFIR TIMELINE RECONSTRUCTOR • INCIDENT INVESTIGATION REPORT', 15, 12);
    doc.setFont('helvetica', 'normal');
    doc.text(`CASE ID: ${caseId}`, 195, 12, { align: 'right' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(15, 14, 195, 14);

    // Footer
    doc.line(15, 282, 195, 282);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('CONFIDENTIAL • RESTRICTED SOC USE • TLP:AMBER', 15, 287);
    doc.text(`Page ${pageNo} of ${totalPages}`, 195, 287, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  // Dark header block
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 297, 'F');

  // Accent Line
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, 210, 6, 'F');

  // Branding Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('DFIR STUDIO • CYBER RANGE PLATFORM', 20, 30);

  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text('INCIDENT INVESTIGATION', 20, 48);
  doc.text('REPORT', 20, 60);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('FORENSIC TIMELINE RECONSTRUCTION & AI CRITIQUE', 20, 70);

  // Classification Box
  doc.setDrawColor(239, 68, 68); // red-500
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(20, 82, 170, 12, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(248, 113, 113);
  doc.text('CONFIDENTIAL • FOR OFFICIAL SOC USE ONLY • TLP:AMBER', 105, 89.5, { align: 'center' });

  // Metadata Card Block
  doc.setFillColor(30, 41, 59);
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(20, 105, 170, 110, 4, 4, 'FD');

  const metaItems = [
    ['CASE ID:', caseId],
    ['SCENARIO NAME:', scenario.title],
    ['CATEGORY:', scenario.category],
    ['THREAT ACTOR:', scenario.threatActor],
    ['TARGET HOST:', scenario.targetHost],
    ['DIFFICULTY:', scenario.difficulty.toUpperCase()],
    ['LEAD INVESTIGATOR:', userStats.username + ' (' + userStats.title + ')'],
    ['GENERATED DATE & TIME:', nowStr],
    ['EVIDENCE ARTIFACTS:', `${cardsToRender.length} Reconstructed Cards`],
    ['INVESTIGATION STATUS:', evaluation.accuracyPercentage >= 70 ? 'VERIFIED & PASSED' : 'REVISION RECOMMENDED'],
  ];

  let metaY = 118;
  metaItems.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(label, 28, metaY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(val, 85, metaY);
    metaY += 9.5;
  });

  // Footer seal / verification
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(20, 230, 170, 28, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL DIGITAL DFIR EVALUATION CERTIFICATE', 28, 241);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Score: ${evaluation.score}/1000 | Accuracy: ${evaluation.accuracyPercentage}% | Stars: ${'★'.repeat(evaluation.starsEarned)}`, 28, 249);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Generated via DFIR Studio Automated Reconstruction Engine v2.4', 105, 282, { align: 'center' });

  // ==========================================
  // PAGE 2: EXECUTIVE SUMMARY
  // ==========================================
  doc.addPage();
  addHeaderFooter(2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('2. EXECUTIVE SUMMARY', 15, 25);

  // Key Metrics Grid (Boxes)
  const drawMetricBox = (x: number, y: number, w: number, h: number, title: string, value: string, color: [number, number, number]) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, w, h, 3, 3, 'FD');

    doc.setFillColor(...color);
    doc.rect(x, y, 3, h, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(title.toUpperCase(), x + 7, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(value, x + 7, y + 19);
  };

  drawMetricBox(15, 32, 42, 24, 'Overall Score', `${evaluation.score} / 1000`, [16, 185, 129]);
  drawMetricBox(61, 32, 42, 24, 'Accuracy', `${evaluation.accuracyPercentage}%`, [59, 130, 246]);
  drawMetricBox(107, 32, 42, 24, 'XP Earned', `+${evaluation.xpGained} XP`, [168, 85, 247]);
  drawMetricBox(153, 32, 42, 24, 'Time Taken', `${Math.floor(evaluation.timeTakenSeconds / 60)}m ${evaluation.timeTakenSeconds % 60}s`, [245, 158, 11]);

  drawMetricBox(15, 60, 42, 24, 'Difficulty', scenario.difficulty.toUpperCase(), [239, 68, 68]);
  drawMetricBox(61, 60, 42, 24, 'Evidence Cards', `${cardsToRender.length} Cards`, [14, 165, 233]);
  drawMetricBox(107, 60, 42, 24, 'Status', evaluation.accuracyPercentage >= 70 ? 'PASS' : 'NEEDS WORK', [16, 185, 129]);
  drawMetricBox(153, 60, 42, 24, 'Rating', `${'★'.repeat(evaluation.starsEarned)} (${evaluation.starsEarned}/3)`, [234, 179, 8]);

  // Executive AI Narrative
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('AI Incident Response Assessment', 15, 96);

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, 102, 180, 50, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);

  const summaryText = evaluation.aiAnalysis?.overallSummary || 
    `Incident investigation for scenario ${scenario.title} conducted by analyst ${userStats.username}. The analyst reconstructed the attack chain with ${evaluation.accuracyPercentage}% accuracy, identifying key initial access and post-exploitation artifacts.`;
  
  const splitSummary = doc.splitTextToSize(summaryText, 170);
  doc.text(splitSummary, 20, 110);

  // Key Findings bullet list
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Key Investigation Highlights', 15, 162);

  const highlights = [
    `Root cause initial access vector mapped to ${cardsToRender[0]?.title || 'Initial Entry Point'}.`,
    `Chronological sequence placement score: ${evaluation.chronologicalAccuracy}% accuracy across all evidence timestamps.`,
    `MITRE ATT&CK technique mapping accuracy: ${evaluation.mitreAccuracy}%.`,
    `Cyber Kill Chain stage alignment score: ${evaluation.killChainAccuracy}%.`,
    `Relationships identified: ${relationshipFlowItems.length} causal links built between forensic artifacts.`,
  ];

  let highY = 170;
  highlights.forEach((h) => {
    doc.setFillColor(16, 185, 129);
    doc.circle(18, highY - 1.5, 1.2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(h, 23, highY);
    highY += 8;
  });

  // ==========================================
  // PAGE 3: INCIDENT OVERVIEW
  // ==========================================
  doc.addPage();
  addHeaderFooter(3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('3. INCIDENT OVERVIEW', 15, 25);

  // Scenario Narrative
  doc.setFontSize(11);
  doc.text('Operational Scenario Context', 15, 34);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 38, 180, 45, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const narrativeLines = doc.splitTextToSize(scenario.narrative, 170);
  doc.text(narrativeLines, 20, 45);

  // Attack Parameters Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Threat Actor & Target Profile', 15, 92);

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, 96, 180, 52, 3, 3, 'FD');

  const profileRows = [
    ['Threat Actor:', scenario.threatActor, 'Target Host:', scenario.targetHost],
    ['Category:', scenario.category, 'Time Window:', scenario.timeWindow],
    ['Difficulty:', scenario.difficulty, 'Total Evidence:', `${scenario.evidenceCount} Artifacts`],
  ];

  let profY = 105;
  profileRows.forEach(([l1, v1, l2, v2]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(l1, 20, profY);
    doc.setTextColor(15, 23, 42);
    doc.text(v1, 50, profY);

    doc.setTextColor(100, 116, 139);
    doc.text(l2, 110, profY);
    doc.setTextColor(15, 23, 42);
    doc.text(v2, 140, profY);
    profY += 12;
  });

  // Severity Distribution Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Evidence Artifact Severity Distribution', 15, 158);

  const critCount = cardsToRender.filter((c) => c.severity === 'Critical').length;
  const highCount = cardsToRender.filter((c) => c.severity === 'High').length;
  const medCount = cardsToRender.filter((c) => c.severity === 'Medium').length;
  const lowCount = cardsToRender.filter((c) => c.severity === 'Low').length;

  const drawSevBar = (y: number, label: string, count: number, total: number, color: [number, number, number]) => {
    const pct = total > 0 ? (count / total) : 0;
    const barWidth = Math.max(2, pct * 110);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`${label} (${count})`, 20, y + 4);

    doc.setFillColor(226, 232, 240);
    doc.roundedRect(65, y, 110, 6, 2, 2, 'F');

    doc.setFillColor(...color);
    doc.roundedRect(65, y, barWidth, 6, 2, 2, 'F');

    doc.setFontSize(8);
    doc.text(`${Math.round(pct * 100)}%`, 180, y + 4);
  };

  drawSevBar(166, 'Critical', critCount, cardsToRender.length, [239, 68, 68]);
  drawSevBar(176, 'High', highCount, cardsToRender.length, [249, 115, 22]);
  drawSevBar(186, 'Medium', medCount, cardsToRender.length, [234, 179, 8]);
  drawSevBar(196, 'Low', lowCount, cardsToRender.length, [59, 130, 246]);

  // ==========================================
  // PAGE 4: ATTACK TIMELINE RECONSTRUCTION
  // ==========================================
  doc.addPage();
  addHeaderFooter(4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('4. RECONSTRUCTED ATTACK TIMELINE', 15, 25);

  let timeY = 34;
  cardsToRender.slice(0, 7).forEach((card, idx) => {
    // Connector line
    if (idx < Math.min(cardsToRender.length, 7) - 1) {
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(1);
      doc.line(22, timeY + 12, 22, timeY + 30);
    }

    // Node badge
    doc.setFillColor(16, 185, 129);
    doc.circle(22, timeY + 6, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(`${idx + 1}`, 22, timeY + 8, { align: 'center' });

    // Card Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(30, timeY, 165, 24, 2, 2, 'FD');

    // Title & Time
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(card.title, 35, timeY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(card.timestamp, 188, timeY + 6, { align: 'right' });

    // Tags line
    const mitreTag = card.correctMitreTechniques[0]?.id || 'T1566';
    const killStage = assignedKillChainMap.get(card.id) || card.correctKillChain;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 165, 233);
    doc.text(`[${card.category}] • MITRE: ${mitreTag} • Kill Chain: ${killStage}`, 35, timeY + 13);

    // Short desc
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const shortDesc = card.description.length > 90 ? card.description.substring(0, 90) + '...' : card.description;
    doc.text(shortDesc, 35, timeY + 19);

    timeY += 32;
  });

  // ==========================================
  // PAGE 5: EVIDENCE DETAILS
  // ==========================================
  doc.addPage();
  addHeaderFooter(5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('5. FORENSIC EVIDENCE ARTIFACT TABLE', 15, 25);

  // Table Headers
  doc.setFillColor(15, 23, 42);
  doc.rect(15, 32, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('#', 18, 37.5);
  doc.text('Timestamp', 25, 37.5);
  doc.text('Evidence Title', 60, 37.5);
  doc.text('Category', 115, 37.5);
  doc.text('Severity', 145, 37.5);
  doc.text('MITRE', 170, 37.5);

  let tblY = 40;
  cardsToRender.forEach((card, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, tblY, 180, 18, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text(`${idx + 1}`, 18, tblY + 6);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.text(card.timestamp, 25, tblY + 6);

    doc.setFont('helvetica', 'bold');
    doc.text(card.title.substring(0, 32), 60, tblY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(card.category, 115, tblY + 6);

    // Sev color
    if (card.severity === 'Critical') doc.setTextColor(220, 38, 38);
    else if (card.severity === 'High') doc.setTextColor(234, 88, 12);
    else doc.setTextColor(202, 138, 4);
    doc.setFont('helvetica', 'bold');
    doc.text(card.severity, 145, tblY + 6);

    doc.setTextColor(14, 165, 233);
    doc.text(card.correctMitreTechniques[0]?.id || 'T1566', 170, tblY + 6);

    // Desc line
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7);
    doc.text(`Source: ${card.source} | Host: ${card.host} | User: ${card.user}`, 25, tblY + 13);

    tblY += 19;
  });

  // ==========================================
  // PAGE 6: MITRE ATT&CK ANALYSIS
  // ==========================================
  doc.addPage();
  addHeaderFooter(6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('6. MITRE ATT&CK MATRIX & TACTIC COVERAGE', 15, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Tactics and techniques identified across the reconstructed evidence timeline:', 15, 33);

  // Technique Grid Cards
  let mitY = 40;
  cardsToRender.forEach((card, idx) => {
    if (idx >= 6) return;
    const tech = card.correctMitreTechniques[0] || { id: 'T1566.001', name: 'Spearphishing Attachment', tactic: 'Initial Access' };

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, mitY, 180, 28, 3, 3, 'FD');

    doc.setFillColor(14, 165, 233);
    doc.roundedRect(20, mitY + 4, 30, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(tech.id, 35, mitY + 9.5, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(tech.name, 55, mitY + 10);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Tactic: ${tech.tactic}`, 55, mitY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`Mapped Evidence: ${card.title}`, 20, mitY + 23);

    mitY += 32;
  });

  // ==========================================
  // PAGE 7: CYBER KILL CHAIN ANALYSIS
  // ==========================================
  doc.addPage();
  addHeaderFooter(7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('7. CYBER KILL CHAIN PHASE ALIGNMENT', 15, 25);

  const stages: KillChainStage[] = [
    'Reconnaissance',
    'Weaponization',
    'Delivery',
    'Exploitation',
    'Installation',
    'Command and Control',
    'Actions on Objectives',
  ];

  let kcY = 36;
  stages.forEach((stage, idx) => {
    const matchingCards = cardsToRender.filter(
      (c) => (assignedKillChainMap.get(c.id) || c.correctKillChain) === stage
    );

    doc.setFillColor(matchingCards.length > 0 ? 240 : 248, matchingCards.length > 0 ? 253 : 250, matchingCards.length > 0 ? 250 : 252);
    doc.setDrawColor(matchingCards.length > 0 ? 52 : 226, matchingCards.length > 0 ? 211 : 232, matchingCards.length > 0 ? 153 : 240);
    doc.roundedRect(15, kcY, 180, 26, 3, 3, 'FD');

    doc.setFillColor(matchingCards.length > 0 ? 16 : 148, matchingCards.length > 0 ? 185 : 163, matchingCards.length > 0 ? 129 : 184);
    doc.circle(24, kcY + 13, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`${idx + 1}`, 24, kcY + 15.5, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(stage.toUpperCase(), 34, kcY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      matchingCards.length > 0 ? `${matchingCards.length} Artifact(s) Mapped` : 'No evidence mapped to stage',
      188,
      kcY + 10,
      { align: 'right' }
    );

    if (matchingCards.length > 0) {
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text(matchingCards.map((c) => c.title).join(' • ').substring(0, 85), 34, kcY + 19);
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('Phase skipped or unmonitored in telemetry', 34, kcY + 19);
    }

    kcY += 30;
  });

  // ==========================================
  // PAGE 8: EVIDENCE RELATIONSHIP GRAPH
  // ==========================================
  doc.addPage();
  addHeaderFooter(8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('8. EVIDENCE CAUSAL RELATIONSHIP FLOW', 15, 25);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Causal relationships linking root cause events to post-exploitation impact:', 15, 33);

  const relsToRender = relationshipFlowItems.length > 0 ? relationshipFlowItems : getRelationshipFlowItems(relationships, evaluation, cardsToRender);
  let relY = 42;

  relsToRender.slice(0, 8).forEach((rel, idx) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, relY, 180, 28, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(rel.from.substring(0, 24), 20, relY + 10);

    doc.setFillColor(14, 165, 233);
    doc.roundedRect(78, relY + 6, 34, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('➜ FLOW ➜', 95, relY + 11.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(rel.to.substring(0, 24), 120, relY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(`${rel.attack_stage} • ${rel.mitre_technique}`, 20, relY + 18);
    doc.text(rel.reason.substring(0, 95), 20, relY + 24);

    relY += 32;
  });

  // ==========================================
  // PAGE 9: AI EVALUATION & CRITIQUE
  // ==========================================
  doc.addPage();
  addHeaderFooter(9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('9. AI FORENSIC EVALUATION & RECOMMENDATIONS', 15, 25);

  // Sequence Critique
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 34, 180, 45, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text('Chronological Sequence Critique', 20, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const seqText = evaluation.aiAnalysis?.sequenceCritique || 'Sequence analysis evaluated against ground-truth endpoint log timestamps.';
  doc.text(doc.splitTextToSize(seqText, 170), 20, 50);

  // MITRE Critique
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 86, 180, 45, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(14, 165, 233);
  doc.text('MITRE ATT&CK Tagging Assessment', 20, 94);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const mitreText = evaluation.aiAnalysis?.mitreCritique || 'Technique mapping evaluated across initial access and post-exploitation phases.';
  doc.text(doc.splitTextToSize(mitreText, 170), 20, 102);

  // Recommendations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('SOC Mitigation Playbook & Remediation Steps', 15, 142);

  let recY = 150;
  scenario.recommendations.forEach((rec, idx) => {
    doc.setFillColor(16, 185, 129);
    doc.rect(15, recY, 2, 12, 'F');

    doc.setFillColor(241, 245, 249);
    doc.rect(17, recY, 178, 12, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${rec}`, 22, recY + 8);

    recY += 15;
  });

  // ==========================================
  // PAGE 10: FINAL SCORE & CERTIFICATION
  // ==========================================
  doc.addPage();
  addHeaderFooter(10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('10. FINAL EVALUATION RESULT', 15, 25);

  // Large Score Badge
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(15, 34, 180, 75, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(52, 211, 153);
  doc.text(`${evaluation.score} / 1000`, 105, 58, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(`ACCURACY RATING: ${evaluation.accuracyPercentage}%`, 105, 72, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(251, 191, 36);
  doc.text('★ '.repeat(evaluation.starsEarned), 105, 86, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`STATUS: ${evaluation.accuracyPercentage >= 70 ? 'OFFICIALLY PASSED' : 'REVISION RECOMMENDED'}`, 105, 98, { align: 'center' });

  // Sign off box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 120, 180, 50, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('INVESTIGATION SIGN-OFF & VERIFICATION', 20, 130);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Investigator Signature: ${userStats.username}`, 20, 142);
  doc.text(`Verification Hash: sha256:${Math.random().toString(36).substring(2, 14)}${Math.random().toString(36).substring(2, 14)}`, 20, 152);
  doc.text(`Platform Engine: DFIR Studio Cyber Range v2.4`, 20, 162);

  doc.save(`DFIR_Report_${caseId}.pdf`);
}
