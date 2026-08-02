import {
  EvidenceCard,
  UserPlacement,
  RelationshipLink,
  Scenario,
  EvaluationResult,
} from '../types';

export function evaluateTimeline(
  scenario: Scenario,
  userPlacements: UserPlacement[],
  userRelationships: RelationshipLink[],
  timeTakenSeconds: number = 300
): EvaluationResult {
  const cardsMap = new Map<string, EvidenceCard>();
  scenario.evidenceCards.forEach((c) => cardsMap.set(c.id, c));

  const mistakes: string[] = [];
  const hints: string[] = [];

  // 1. Chronological Sequence Evaluation (300 pts)
  let chronologicalScore = 0;
  const maxChronoScore = 300;
  const totalCards = userPlacements.length;

  if (totalCards > 0) {
    let correctInversions = 0;
    let totalPairs = 0;

    for (let i = 0; i < totalCards; i++) {
      for (let j = i + 1; j < totalCards; j++) {
        totalPairs++;
        const cardA = cardsMap.get(userPlacements[i].evidenceId);
        const cardB = cardsMap.get(userPlacements[j].evidenceId);

        if (cardA && cardB) {
          if (cardA.trueTimestampMs <= cardB.trueTimestampMs) {
            correctInversions++;
          } else {
            // Flag sequence error
            if (mistakes.length < 5) {
              mistakes.push(
                `Sequence Error: "${cardA.title}" (${cardA.timestamp}) was placed before "${cardB.title}" (${cardB.timestamp}), but it occurred later chronologically.`
              );
            }
          }
        }
      }
    }

    const pairRatio = totalPairs > 0 ? correctInversions / totalPairs : 0;
    chronologicalScore = Math.round(pairRatio * maxChronoScore);
  }

  // 2. MITRE ATT&CK Mapping Evaluation (250 pts)
  let mitreScore = 0;
  const maxMitreScore = 250;
  let correctMitreCount = 0;
  let totalRequiredMitre = 0;

  userPlacements.forEach((placement) => {
    const card = cardsMap.get(placement.evidenceId);
    if (!card) return;

    const correctIds = card.correctMitreTechniques.map((t) => t.id);
    totalRequiredMitre += correctIds.length;

    const assigned = placement.assignedMitreTechniqueIds || [];
    let cardMatched = 0;

    correctIds.forEach((targetId) => {
      if (assigned.includes(targetId)) {
        cardMatched++;
        correctMitreCount++;
      } else {
        if (mistakes.length < 8) {
          mistakes.push(
            `MITRE Tag Missing: Card "${card.title}" requires MITRE technique ${targetId} (${
              card.correctMitreTechniques.find((t) => t.id === targetId)?.name || ''
            }).`
          );
        }
      }
    });
  });

  const mitreRatio = totalRequiredMitre > 0 ? correctMitreCount / totalRequiredMitre : 0;
  mitreScore = Math.round(mitreRatio * maxMitreScore);

  // 3. Cyber Kill Chain Mapping Evaluation (200 pts)
  let killChainScore = 0;
  const maxKillChainScore = 200;
  let correctKillChainCount = 0;

  userPlacements.forEach((placement) => {
    const card = cardsMap.get(placement.evidenceId);
    if (!card) return;

    if (placement.assignedKillChainStage === card.correctKillChain) {
      correctKillChainCount++;
    } else {
      if (mistakes.length < 10) {
        mistakes.push(
          `Kill Chain Mismatch: Card "${card.title}" is assigned to "${
            placement.assignedKillChainStage || 'Unassigned'
          }", but its actual stage is "${card.correctKillChain}".`
        );
      }
    }
  });

  const killChainRatio = totalCards > 0 ? correctKillChainCount / totalCards : 0;
  killChainScore = Math.round(killChainRatio * maxKillChainScore);

  // 4. Relationship Connections Evaluation (250 pts)
  let relationshipScore = 0;
  const maxRelationshipScore = 250;
  const referenceRels = scenario.referenceRelationships || [];
  let matchedRels = 0;

  referenceRels.forEach((ref) => {
    const found = userRelationships.some(
      (u) => u.sourceId === ref.sourceId && u.targetId === ref.targetId && u.type === ref.type
    );
    if (found) {
      matchedRels++;
    } else {
      const srcCard = cardsMap.get(ref.sourceId);
      const tgtCard = cardsMap.get(ref.targetId);
      if (srcCard && tgtCard && hints.length < 4) {
        hints.push(
          `Causal Connection Hint: Link "${srcCard.title}" to "${tgtCard.title}" using relationship type "${ref.type}".`
        );
      }
    }
  });

  const relRatio = referenceRels.length > 0 ? matchedRels / referenceRels.length : 1;
  relationshipScore = Math.round(relRatio * maxRelationshipScore);

  // Calculate final totals
  const totalScore = chronologicalScore + mitreScore + killChainScore + relationshipScore;
  const accuracyPercentage = Math.min(100, Math.round((totalScore / 1000) * 100));

  let starsEarned = 1;
  if (accuracyPercentage >= 88) starsEarned = 3;
  else if (accuracyPercentage >= 65) starsEarned = 2;

  const xpGained = Math.round(totalScore * 1.5);

  // Generate Local AI DFIR Assistant Analysis
  const aiAnalysis = generateAiCritique(
    scenario,
    accuracyPercentage,
    chronologicalScore,
    mitreScore,
    killChainScore,
    relationshipScore,
    mistakes
  );

  return {
    score: totalScore,
    maxScore: 1000,
    accuracyPercentage,
    chronologicalAccuracy: Math.round((chronologicalScore / maxChronoScore) * 100),
    mitreAccuracy: Math.round((mitreScore / maxMitreScore) * 100),
    killChainAccuracy: Math.round((killChainScore / maxKillChainScore) * 100),
    relationshipAccuracy: Math.round((relationshipScore / maxRelationshipScore) * 100),
    mistakes,
    hints,
    aiAnalysis,
    starsEarned,
    xpGained,
    timeTakenSeconds,
  };
}

function generateAiCritique(
  scenario: Scenario,
  accuracyPercentage: number,
  chronoScore: number,
  mitreScore: number,
  killChainScore: number,
  relScore: number,
  mistakes: string[]
) {
  let overallSummary = '';
  let sequenceCritique = '';
  let mitreCritique = '';
  let keyTakeaway = '';

  if (accuracyPercentage >= 90) {
    overallSummary = `Masterful DFIR reconstruction! You correctly reconstructed the ${scenario.title} attack vector with forensic precision, mapping root cause to impact.`;
    sequenceCritique =
      'Your timeline sequence closely mirrors the actual disk and log timestamps from the compromised endpoints.';
    mitreCritique =
      'MITRE ATT&CK technique tags and Cyber Kill Chain stages were mapped flawlessly across execution and exfiltration stages.';
    keyTakeaway =
      'SOC Tip: Documenting relationships between C2 heartbeats and data exfiltration spikes is crucial for building court-admissible forensic timelines.';
  } else if (accuracyPercentage >= 65) {
    overallSummary = `Good incident analysis effort. You captured the main outline of ${scenario.title}, but several forensic artifacts are out of chronological order or missing causal links.`;
    sequenceCritique =
      chronoScore < 200
        ? 'Noticeable timestamp sequence discrepancies. Remember that initial entry events (phishing, scripts) must precede credential dumping and lateral movement.'
        : 'Solid sequence placement with minor ordering shifts between adjacent log entries.';
    mitreCritique =
      mitreScore < 180
        ? 'Some evidence cards are missing key MITRE ATT&CK tags (such as T1003 for LSASS dumping or T1490 for vssadmin deletion).'
        : 'Good MITRE ATT&CK tagging across initial access and lateral movement.';
    keyTakeaway =
      'DFIR Principle: Always verify artifact timestamps in UTC and cross-reference Sysmon Event ID 1 (Process Creation) with Security Event ID 4624 (Logon).';
  } else {
    overallSummary = `Initial reconstruction requires review. The timeline for ${scenario.title} contains several fundamental sequence errors and unlinked evidence cards.`;
    sequenceCritique =
      'Pay close attention to timestamp logs. For example, credential dumping cannot occur before the initial phishing attachment is opened.';
    mitreCritique =
      'Review the right-hand MITRE ATT&CK panel. Assigning techniques like T1566 (Phishing) and T1486 (Ransomware) significantly improves accuracy.';
    keyTakeaway =
      'SOC Principle: Incident Response begins with establishing the Root Cause (Initial Access). Filter evidence cards by category to isolate delivery from post-exploitation.';
  }

  return {
    overallSummary,
    sequenceCritique,
    mitreCritique,
    keyTakeaway,
  };
}
