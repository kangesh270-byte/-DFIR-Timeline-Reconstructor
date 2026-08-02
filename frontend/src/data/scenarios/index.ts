import { Scenario } from '../../types';
import { RANSOMWARE_SCENARIO } from './ransomwareScenario';
import { OTHER_SCENARIOS } from './otherScenarios';

export const ALL_SCENARIOS: Scenario[] = [RANSOMWARE_SCENARIO, ...OTHER_SCENARIOS];

export function getScenarioById(id: string): Scenario | undefined {
  return ALL_SCENARIOS.find((s) => s.id === id) || ALL_SCENARIOS[0];
}
