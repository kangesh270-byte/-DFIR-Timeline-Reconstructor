import json
import logging
from datetime import datetime
from typing import Any
from uuid import uuid4

from ..database.supabase import get_supabase_client
from ..schemas.report import ReportCreate, ReportUpdate

logger = logging.getLogger(__name__)


class ReportService:
    async def evaluate_timeline(self, payload: dict[str, Any]) -> dict[str, Any]:
        client = await get_supabase_client()
        scenario_id = str(payload.get("scenarioId") or "").strip()
        if not scenario_id:
            raise ValueError("Scenario not found")

        scenario_context = {
            "id": scenario_id,
            "title": "Supabase-backed scenario",
            "narrative": None,
            "recommendations": [],
            "evidenceCards": [],
            "referenceRelationships": [],
            "timelineEvents": [],
        }
        try:
            scenario_response = await client.table("scenarios").select("*").eq("id", scenario_id).limit(1).execute()
            scenario_rows = scenario_response.data or []
            if not scenario_rows:
                raise ValueError("Scenario not found")
            scenario = scenario_rows[0]

            evidence_response = await client.table("evidence").select("*").eq("scenario_id", scenario["id"]).execute()
            relationship_response = await client.table("relationships").select("*").eq("scenario_id", scenario["id"]).execute()
            timeline_response = await client.table("timeline_events").select("*").execute()
            evidence_rows = evidence_response.data or []
            evidence_ids = {row.get("id") for row in evidence_rows if row.get("id")}
            timeline_rows = [row for row in (timeline_response.data or []) if row.get("evidence_id") in evidence_ids]

            scenario_context = {
                "id": scenario["id"],
                "title": scenario["title"],
                "narrative": scenario.get("narrative"),
                "recommendations": scenario.get("recommendations") or [],
                "evidenceCards": [self._normalize_evidence(row) for row in evidence_rows],
                "referenceRelationships": [self._normalize_relationship(row) for row in (relationship_response.data or [])],
                "timelineEvents": [self._normalize_timeline_event(row) for row in timeline_rows],
            }
        except Exception as exc:
            logger.warning("Falling back to an empty evaluation context for %s: %s", scenario_id, exc)

        evaluation = self._evaluate_scenario(
            scenario_context,
            payload.get("userPlacements") or [],
            payload.get("relationships") or [],
            payload.get("timeTakenSeconds") or 300,
        )
        attack_reconstruction = self._build_attack_reconstruction(scenario_context, evaluation)
        evaluation["attackReconstruction"] = attack_reconstruction
        evaluation["relationshipFlow"] = attack_reconstruction.get("relationshipFlow", [])

        report_id = f"report-{uuid4().hex[:8]}"
        recommendations = list(dict.fromkeys([
            *(scenario_context.get("recommendations") or []),
            *(attack_reconstruction.get("preventionRecommendations", [])),
            *(attack_reconstruction.get("incidentResponseActions", [])),
        ]))
        report_row = {
            "id": report_id,
            "scenario_id": scenario_context["id"],
            "scenario_title": scenario_context["title"],
            "score": evaluation["score"],
            "accuracy_percentage": evaluation["accuracyPercentage"],
            "stars_earned": evaluation["starsEarned"],
            "narrative": attack_reconstruction.get("executiveSummary") or evaluation.get("investigationFeedback"),
            "weaknesses": json.dumps(attack_reconstruction.get("weaknesses", evaluation.get("weaknesses", []))),
            "recommendations": json.dumps(recommendations),
        }
        try:
            await client.table("reports").insert(report_row).execute()

            for placement in payload.get("userPlacements") or []:
                await client.table("timeline_placements").insert({
                    "id": f"placement-{uuid4().hex[:8]}",
                    "report_id": report_id,
                    "evidence_id": placement.get("evidenceId"),
                    "order_index": placement.get("orderIndex", 0),
                    "assigned_mitre_technique_ids": ",".join(placement.get("assignedMitreTechniqueIds", []) or []),
                    "assigned_kill_chain_stage": placement.get("assignedKillChainStage"),
                }).execute()

            await client.table("evaluation_results").insert({
                "id": f"eval-{uuid4().hex[:8]}",
                "report_id": report_id,
                "score": evaluation["score"],
                "max_score": evaluation["maxScore"],
                "accuracy_percentage": evaluation["accuracyPercentage"],
                "chronological_accuracy": evaluation["chronologicalAccuracy"],
                "mitre_accuracy": evaluation["mitreAccuracy"],
                "kill_chain_accuracy": evaluation["killChainAccuracy"],
                "relationship_accuracy": evaluation["relationshipAccuracy"],
                "mistakes": json.dumps(evaluation.get("mistakes", [])),
                "hints": json.dumps(evaluation.get("hints", [])),
                "ai_analysis": json.dumps(evaluation.get("aiAnalysis", {})),
                "stars_earned": evaluation["starsEarned"],
                "xp_gained": evaluation["xpGained"],
                "time_taken_seconds": payload.get("timeTakenSeconds") or 300,
            }).execute()

            await self._update_leaderboard(client, evaluation, payload.get("userName") or payload.get("userId"))
        except Exception as exc:
            logger.warning("Falling back to in-memory evaluation response because report persistence failed: %s", exc)

        return {"reportId": report_id, "evaluation": evaluation}

    def _evaluate_scenario(self, scenario: dict[str, Any], user_placements: list[dict[str, Any]], user_relationships: list[dict[str, Any]], time_taken_seconds: int) -> dict[str, Any]:
        cards = scenario.get("evidenceCards", [])
        reference_relationships = scenario.get("referenceRelationships", [])
        reference_timeline_events = scenario.get("timelineEvents", [])
        cards_by_id = {card["id"]: card for card in cards if card.get("id")}
        mistakes: list[str] = []
        hints: list[str] = []
        strengths: list[str] = []
        recommendations: list[str] = []

        reference_order = [event["evidenceId"] for event in sorted(reference_timeline_events, key=lambda item: (item.get("orderIndex", 0), item.get("evidenceId", ""))) if event.get("evidenceId")]
        user_order = [placement["evidenceId"] for placement in sorted(user_placements, key=lambda item: (item.get("orderIndex", 0), item.get("evidenceId", ""))) if placement.get("evidenceId")]
        shared_ids = [evidence_id for evidence_id in user_order if evidence_id in cards_by_id and evidence_id in reference_order]
        if len(shared_ids) >= 2:
            reference_positions = {evidence_id: index for index, evidence_id in enumerate(reference_order)}
            user_positions = {evidence_id: index for index, evidence_id in enumerate(user_order)}
            correct_pairs = 0
            total_pairs = 0
            for index, left_id in enumerate(shared_ids):
                for right_id in shared_ids[index + 1 :]:
                    total_pairs += 1
                    if (user_positions[left_id] < user_positions[right_id]) == (reference_positions[left_id] < reference_positions[right_id]):
                        correct_pairs += 1
            chronological_score = int((correct_pairs / total_pairs) * 300) if total_pairs else 300
        else:
            chronological_score = 0
            if not shared_ids:
                mistakes.append("No evidence was placed in the submitted timeline.")
            else:
                mistakes.append("The submitted timeline did not include enough evidence for a full chronology comparison.")

        scored_evidence_ids = sorted(set(cards_by_id.keys()))
        mitre_total = 0
        mitre_score = 0
        for evidence_id in scored_evidence_ids:
            card = cards_by_id.get(evidence_id, {})
            correct_event = self._match_timeline_event(card, reference_timeline_events)
            expected_ids = set()
            expected_technique = self._get_matched_event_mitre_technique(correct_event)
            if expected_technique:
                expected_ids = {expected_technique}
            placement = next((item for item in user_placements if item.get("evidenceId") == evidence_id), None)
            submitted_ids = set(placement.get("assignedMitreTechniqueIds", []) or []) if placement else set()
            mitre_total += 1
            if expected_ids:
                overlap = len(expected_ids & submitted_ids)
                mitre_score += overlap / len(expected_ids)
                if overlap < len(expected_ids):
                    mistakes.append(f"MITRE mapping needs review for {card.get('title', evidence_id)}")
            elif submitted_ids:
                mitre_score += 0
                mistakes.append(f"MITRE mapping needs review for {card.get('title', evidence_id)}")
            else:
                mitre_score += 1

        mitre_score = int((mitre_score / mitre_total) * 250) if mitre_total else 250

        kill_chain_total = 0
        kill_chain_score = 0
        for evidence_id in scored_evidence_ids:
            card = cards_by_id.get(evidence_id, {})
            correct_event = self._match_timeline_event(card, reference_timeline_events)
            expected_stage = self._get_matched_event_attack_stage(correct_event) if correct_event else card.get("correctKillChain")
            placement = next((item for item in user_placements if item.get("evidenceId") == evidence_id), None)
            submitted_stage = placement.get("assignedKillChainStage") if placement else None
            kill_chain_total += 1
            if submitted_stage and expected_stage and submitted_stage == expected_stage:
                kill_chain_score += 1
            elif not submitted_stage and not expected_stage:
                kill_chain_score += 1
            else:
                mistakes.append(f"Kill chain stage mismatch for {card.get('title', evidence_id)}")
        kill_chain_score = int((kill_chain_score / kill_chain_total) * 200) if kill_chain_total else 200

        relationship_score = 0
        matched_relationships = 0
        relationship_total = max(1, len(reference_relationships))
        for relationship in reference_relationships:
            if any(
                rel.get("sourceId") == relationship["sourceId"]
                and rel.get("targetId") == relationship["targetId"]
                and rel.get("type") == relationship.get("type")
                for rel in user_relationships
            ):
                matched_relationships += 1
            else:
                hints.append(f"Add relationship from {relationship['sourceId']} to {relationship['targetId']}")
        relationship_score = int((matched_relationships / relationship_total) * 250) if reference_relationships else 250

        total_score = chronological_score + mitre_score + kill_chain_score + relationship_score
        accuracy_percentage = min(100, int((total_score / 1000) * 100))
        stars_earned = 3 if accuracy_percentage >= 90 else 2 if accuracy_percentage >= 70 else 1
        xp_gained = max(100, int(total_score * 0.75))

        chronological_accuracy = int((chronological_score / 300) * 100) if chronological_score else 0
        mitre_accuracy = int((mitre_score / 250) * 100) if mitre_score else 100
        kill_chain_accuracy = int((kill_chain_score / 200) * 100) if kill_chain_score else 100
        relationship_accuracy = int((relationship_score / 250) * 100) if relationship_score else 100

        if chronological_accuracy >= 75:
            strengths.append("The chronology largely matched the reference attack sequence.")
        else:
            recommendations.append("Reorder the evidence so the timeline follows the reference attack progression more closely.")

        if mitre_accuracy >= 75:
            strengths.append("The MITRE ATT&CK mappings were generally aligned with the expected tactics.")
        else:
            recommendations.append("Revisit the MITRE ATT&CK tags on the evidence that was mapped incorrectly.")

        if kill_chain_accuracy >= 75:
            strengths.append("The cyber kill chain stages were mostly assigned in the correct order.")
        else:
            recommendations.append("Align the kill chain stages with the expected progression for each artifact.")

        if relationship_accuracy >= 75:
            strengths.append("The causal relationships you marked were mostly consistent with the reference investigation.")
        else:
            recommendations.append("Add or correct the relationships between linked artifacts to reflect the true causal chain.")

        if not strengths:
            strengths.append("The investigation captured several artifacts, but the overall structure needs refinement.")

        if not recommendations:
            recommendations.append("Use the reference timeline and relationships to tighten the final narrative.")

        investigation_feedback = (
            f"Compared the submitted analysis for {scenario.get('title', 'the scenario')} against the reference timeline and evidence. "
            f"Chronology reached {chronological_accuracy}%, MITRE mapping reached {mitre_accuracy}%, kill chain alignment reached {kill_chain_accuracy}%, "
            f"and causal relationships reached {relationship_accuracy}%."
        )

        ai_analysis = {
            "overallSummary": investigation_feedback,
            "sequenceCritique": f"The submitted sequence matched {chronological_accuracy}% of the reference ordering.",
            "mitreCritique": f"MITRE ATT&CK mapping accuracy reached {mitre_accuracy}%.",
            "keyTakeaway": recommendations[0] if recommendations else "Review the reference evidence and relationships to improve the investigation narrative.",
        }

        return {
            "score": total_score,
            "maxScore": 1000,
            "accuracyPercentage": accuracy_percentage,
            "chronologicalAccuracy": chronological_accuracy,
            "mitreAccuracy": mitre_accuracy,
            "killChainAccuracy": kill_chain_accuracy,
            "relationshipAccuracy": relationship_accuracy,
            "mistakes": mistakes,
            "hints": hints,
            "aiAnalysis": ai_analysis,
            "starsEarned": stars_earned,
            "xpGained": xp_gained,
            "timeTakenSeconds": time_taken_seconds,
            "investigationFeedback": investigation_feedback,
            "strengths": strengths,
            "weaknesses": list(dict.fromkeys(mistakes))[:6],
            "recommendations": recommendations,
        }

    def _build_attack_reconstruction(self, scenario: dict[str, Any], evaluation: dict[str, Any]) -> dict[str, Any]:
        cards = scenario.get("evidenceCards", [])
        timeline_events = scenario.get("timelineEvents", [])
        ordered_evidence = self._order_evidence_cards(cards, timeline_events)

        stage_names = [
            "Initial Access",
            "Execution",
            "Persistence",
            "Privilege Escalation",
            "Defense Evasion",
            "Credential Access",
            "Discovery",
            "Lateral Movement",
            "Collection",
            "Exfiltration",
            "Impact",
        ]
        stage_details: list[dict[str, Any]] = []
        attack_chain: list[dict[str, Any]] = []
        seen_stages: set[str] = set()

        for evidence in ordered_evidence:
            matched_event = self._match_timeline_event(evidence, timeline_events)
            self._log_matched_event(evidence, matched_event)
            matched_mitre_technique = self._get_matched_event_mitre_technique(matched_event)
            matched_attack_stage = self._get_matched_event_attack_stage(matched_event)
            print("=== MATCHED MITRE ===")
            print("Evidence:", evidence.get("title"))
            print("Matched Event:", matched_event)
            print("MITRE:", matched_mitre_technique)
            logger.warning(
                "FLOW Matched Event\n----------------\nEvidence: %s\nMatched Event: %s\nmitre_technique: %s\nsource=matched_event",
                evidence.get("title"),
                matched_event,
                matched_mitre_technique,
            )
            evidence_stages = [matched_attack_stage] if matched_attack_stage else self._classify_evidence_stages(evidence)
            for stage_name in evidence_stages:
                if stage_name not in seen_stages:
                    attack_mitre_techniques = self._extract_mitre_techniques(matched_event)
                    logger.warning(
                        "FLOW Attack Timeline Builder\n----------------\nEvidence: %s\nMITRE about to be written: %s\nsource=attack_mitre_techniques",
                        evidence.get("title"),
                        attack_mitre_techniques,
                    )
                    attack_chain.append({
                        "stage": stage_name,
                        "evidenceId": evidence.get("id"),
                        "evidenceTitle": evidence.get("title"),
                        "mitreTechniques": attack_mitre_techniques,
                        "mitre_technique": matched_mitre_technique,
                        "attack_stage": matched_attack_stage or stage_name,
                        "toolsUsed": self._detect_tools(evidence),
                    })
                    seen_stages.add(stage_name)

        evidence_table_payload = []
        for item in ordered_evidence:
            matched_event = self._match_timeline_event(item, timeline_events)
            matched_mitre_technique = self._get_matched_event_mitre_technique(matched_event)
            matched_attack_stage = self._get_matched_event_attack_stage(matched_event)
            evidence_table_payload.append({
                "evidenceId": item.get("id"),
                "evidenceTitle": item.get("title"),
                "mitreTechniques": self._extract_mitre_techniques(matched_event),
                "mitre_technique": matched_mitre_technique,
                "attack_stage": matched_attack_stage,
            })

        for stage_name in stage_names:
            stage_evidence = []
            for item in ordered_evidence:
                matched_event = self._match_timeline_event(item, timeline_events)
                matched_mitre_technique = self._get_matched_event_mitre_technique(matched_event)
                matched_attack_stage = self._get_matched_event_attack_stage(matched_event)
                effective_stage = matched_attack_stage
                if effective_stage == stage_name or (effective_stage is None and stage_name in self._classify_evidence_stages(item)):
                    evidence_mitre_techniques = self._extract_mitre_techniques(matched_event)
                    logger.warning(
                        "FLOW Evidence Table Builder\n----------------\nEvidence: %s\nMITRE about to be written: %s\nsource=evidence_mitre_techniques",
                        item.get("title"),
                        evidence_mitre_techniques,
                    )
                    stage_evidence.append({
                        "evidenceId": item.get("id"),
                        "evidenceTitle": item.get("title"),
                        "mitreTechniques": evidence_mitre_techniques,
                        "mitre_technique": matched_mitre_technique,
                        "attack_stage": matched_attack_stage or stage_name,
                    })
            stage_matrix_mitre_techniques = [
                technique
                for evidence_item in stage_evidence
                for technique in evidence_item.get("mitreTechniques", [])
            ]
            logger.warning(
                "FLOW MITRE Matrix Builder\n----------------\nTechnique(s): %s\nMapped Evidence: %s\nsource=stage_evidence",
                stage_matrix_mitre_techniques,
                [item.get("evidenceTitle") for item in stage_evidence],
            )
            stage_details.append({
                "stage": stage_name,
                "detected": bool(stage_evidence),
                "evidence": stage_evidence,
                "mitreTechniques": stage_matrix_mitre_techniques,
                "mitre_technique": stage_evidence[0].get("mitre_technique") if stage_evidence else None,
                "attack_stage": stage_name,
            })

        tools_used = []
        for evidence in ordered_evidence:
            for tool_name in self._detect_tools(evidence):
                if tool_name not in tools_used:
                    tools_used.append(tool_name)

        highest_severity = max((evidence.get("severity") or "Low" for evidence in ordered_evidence), default="Low")
        risk_level = "Critical" if any(stage.get("stage") == "Impact" for stage in attack_chain) and highest_severity in {"Critical", "High"} else "High" if highest_severity in {"High", "Critical"} else "Medium" if ordered_evidence else "Low"

        root_cause = None
        initial_access = next((item for item in attack_chain if item.get("stage") == "Initial Access"), None)
        if initial_access:
            root_cause = f"The intrusion started with {initial_access.get('evidenceTitle')}"
        elif ordered_evidence:
            root_cause = f"The earliest observed indicator was {ordered_evidence[0].get('title')}"
        else:
            root_cause = "The available evidence did not identify an initial foothold"

        prevention_recommendations = []
        if any(stage.get("stage") == "Initial Access" for stage in attack_chain):
            prevention_recommendations.append("Strengthen email and attachment filtering to limit initial access attempts.")
        if any(stage.get("stage") == "Credential Access" for stage in attack_chain):
            prevention_recommendations.append("Enforce MFA and protect privileged credentials to reduce credential theft impact.")
        if any(stage.get("stage") == "Lateral Movement" for stage in attack_chain):
            prevention_recommendations.append("Restrict remote execution paths such as PsExec and remote administration tools.")
        if any(stage.get("stage") == "Exfiltration" for stage in attack_chain):
            prevention_recommendations.append("Monitor and control outbound transfer tools and cloud storage usage.")
        if any(stage.get("stage") == "Impact" for stage in attack_chain):
            prevention_recommendations.append("Maintain offline backups and tested recovery procedures for ransomware-style impact.")

        incident_response_actions = [
            "Preserve volatile evidence and collect host memory where possible.",
            "Validate the earliest observed indicator and isolate impacted systems.",
        ]
        if tools_used:
            incident_response_actions.append(f"Investigate the observed tools: {', '.join(tools_used)}")
        if any(stage.get("stage") == "Credential Access" for stage in attack_chain):
            incident_response_actions.append("Reset affected credentials and review authentication logs immediately.")

        indicators_of_compromise = [
            f"{item.get('title')} on {item.get('host')} via {item.get('source')}"
            for item in ordered_evidence
            if item.get("title") or item.get("host") or item.get("source")
        ][:8]

        attack_summary = (
            f"The reconstructed intrusion progressed through {', '.join([step.get('stage') for step in attack_chain[:4]])} "
            f"and culminated in {next((step.get('stage') for step in reversed(attack_chain) if step.get('stage')), 'impact')}."
        )
        executive_summary = (
            f"{attack_summary} The investigation identified {len(cards)} evidence items, "
            f"a {risk_level.lower()} risk posture, and {len(tools_used)} observed tools."
        )

        relationship_flow = self._build_relationship_flow(ordered_evidence, timeline_events)
        kill_chain_payload = [
            {
                "evidenceId": item.get("evidenceId"),
                "evidenceTitle": item.get("evidenceTitle"),
                "mitre_technique": item.get("mitre_technique"),
                "attack_stage": item.get("attack_stage"),
            }
            for item in attack_chain
        ]
        mitre_matrix_payload = [
            {
                "stage": item.get("stage"),
                "mitreTechniques": item.get("mitreTechniques", []),
                "mitre_technique": item.get("mitre_technique"),
                "attack_stage": item.get("attack_stage"),
            }
            for item in stage_details
        ]

        print("Attack Timeline payload")
        print(json.dumps(attack_chain, indent=2, default=str))
        print("Evidence Table payload")
        print(json.dumps(evidence_table_payload, indent=2, default=str))
        print("MITRE Matrix payload")
        print(json.dumps(mitre_matrix_payload, indent=2, default=str))
        print("Kill Chain payload")
        print(json.dumps(kill_chain_payload, indent=2, default=str))
        print("Relationship Flow payload")
        print(json.dumps(relationship_flow, indent=2, default=str))

        return {
            "attackSummary": attack_summary,
            "rootCause": root_cause,
            "attackChain": attack_chain,
            "stages": stage_details,
            "toolsUsed": tools_used,
            "riskLevel": risk_level,
            "indicatorsOfCompromise": indicators_of_compromise,
            "preventionRecommendations": prevention_recommendations,
            "incidentResponseActions": incident_response_actions,
            "executiveSummary": executive_summary,
            "strengths": evaluation.get("strengths", []),
            "weaknesses": evaluation.get("weaknesses", []),
            "recommendations": evaluation.get("recommendations", []),
            "relationshipFlow": relationship_flow,
            "attackTimelinePayload": attack_chain,
            "evidenceTablePayload": evidence_table_payload,
            "mitreMatrixPayload": mitre_matrix_payload,
            "killChainPayload": kill_chain_payload,
            "relationshipFlowPayload": relationship_flow,
        }

    def _order_evidence_cards(self, cards: list[dict[str, Any]], timeline_events: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not cards:
            return []

        timeline_by_evidence_id = {event.get("evidenceId"): event for event in timeline_events if event.get("evidenceId")}
        ordered_cards = [card for card in cards if card.get("id")]

        def sort_key(card: dict[str, Any]) -> tuple[Any, ...]:
            matched_event = timeline_by_evidence_id.get(card.get("id"))
            event_time = self._parse_event_time(card.get("timestamp") or matched_event.get("timestamp") if matched_event else None)
            order_index = matched_event.get("orderIndex", 999999) if matched_event else 999999
            return (
                event_time is None,
                event_time or datetime.max,
                order_index,
                card.get("trueTimestampMs") or 0,
                card.get("title") or "",
            )

        ordered_cards.sort(key=sort_key)
        return ordered_cards

    def _parse_event_time(self, value: Any) -> datetime | None:
        if not value:
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(float(value) / 1000)

        text = str(value).strip()
        if not text:
            return None
        try:
            if text.endswith("Z"):
                text = text[:-1] + "+00:00"
            return datetime.fromisoformat(text)
        except ValueError:
            return None

    def _build_relationship_flow(self, ordered_evidence: list[dict[str, Any]], timeline_events: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not ordered_evidence:
            return []

        relationship_stage_reason_map = {
            "Initial Access": "Malicious payload delivered after initial compromise.",
            "Execution": "Malicious payload executed after initial compromise.",
            "Credential Access": "Execution enabled credential dumping or token abuse.",
            "Persistence": "The attacker established persistence after obtaining credentials.",
            "Privilege Escalation": "The attacker escalated privileges to gain deeper system access.",
            "Defense Evasion": "Persistence mechanisms were hidden or bypassed to avoid detection.",
            "Discovery": "System reconnaissance followed the initial foothold.",
            "Lateral Movement": "Discovered assets enabled movement across the environment.",
            "Collection": "Sensitive information was collected after lateral movement.",
            "Exfiltration": "Collected data was transmitted out of the environment.",
            "Impact": "The attack culminated in ransomware or destructive impact.",
        }

        flow: list[dict[str, Any]] = []
        for index in range(len(ordered_evidence) - 1):
            source = ordered_evidence[index]
            target = ordered_evidence[index + 1]
            source_event = self._match_timeline_event(source, timeline_events)
            target_event = self._match_timeline_event(target, timeline_events)

            source_stages = self._classify_evidence_stages(source)
            target_stages = self._classify_evidence_stages(target)
            source_stage = self._get_matched_event_attack_stage(source_event) or (source_stages[0] if source_stages else None)
            target_stage = self._get_matched_event_attack_stage(target_event) or (target_stages[0] if target_stages else None)
            reason = relationship_stage_reason_map.get(target_stage or source_stage or "Execution", "These events are connected as part of the attack chain.")

            target_mitre = self._get_matched_event_mitre_technique(target_event)
            source_mitre = self._get_matched_event_mitre_technique(source_event)
            flow.append({
                "from": source.get("title") or "Unknown event",
                "to": target.get("title") or "Unknown event",
                "reason": reason,
                "mitre_technique": target_mitre or source_mitre,
                "attack_stage": target_stage or source_stage or "Execution",
            })

        return flow

    def _match_timeline_event(self, card: dict[str, Any], timeline_events: list[dict[str, Any]]) -> dict[str, Any] | None:
        if not card:
            return None

        evidence_title = (card.get("title") or "").strip()
        evidence_timestamp = (card.get("timestamp") or "").strip()
        evidence_source = (card.get("source") or "").strip()
        evidence_id = card.get("id")

        print("================================")
        print("Evidence")
        print(card)
        print("Timeline Events")
        print(timeline_events)

        normalized_card_timestamp = self._normalize_timestamp(evidence_timestamp)
        normalized_card_source = self._normalize_text(evidence_source)
        normalized_card_title = self._normalize_text(evidence_title)

        # 1. Exact timestamp match
        if normalized_card_timestamp:
            for event in timeline_events:
                event_timestamp = self._normalize_timestamp(event.get("timestamp"))
                if event_timestamp and event_timestamp == normalized_card_timestamp:
                    print("Matched Event")
                    print(event)
                    print("================================")
                    return event

        # 2. Timestamp + source
        if normalized_card_timestamp and normalized_card_source:
            for event in timeline_events:
                event_timestamp = self._normalize_timestamp(event.get("timestamp"))
                event_source = self._normalize_text(event.get("source"))
                if event_timestamp and event_timestamp == normalized_card_timestamp and event_source and event_source == normalized_card_source:
                    print("Matched Event")
                    print(event)
                    print("================================")
                    return event

        # 3. Normalized title similarity (only after timestamp match)
        if normalized_card_timestamp and normalized_card_title:
            for event in timeline_events:
                event_title = self._normalize_text(event.get("title"))
                if event_title and (
                    event_title == normalized_card_title
                    or normalized_card_title in event_title
                    or event_title in normalized_card_title
                ):
                    print("Matched Event")
                    print(event)
                    print("================================")
                    return event

        # 4. Evidence ID
        if evidence_id:
            for event in timeline_events:
                if event.get("evidenceId") and str(event.get("evidenceId")) == str(evidence_id):
                    print("Matched Event")
                    print(event)
                    print("================================")
                    return event

        print("Matched Event")
        print(None)
        print("================================")
        return None

    def _normalize_timestamp(self, value: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.strftime("%Y-%m-%d %H:%M:%S")

        text = str(value).strip()
        if not text:
            return None

        try:
            if text.endswith("Z"):
                text = text[:-1] + "+00:00"
            dt = datetime.fromisoformat(text)
        except ValueError:
            return None

        return dt.strftime("%Y-%m-%d %H:%M:%S")

    def _normalize_text(self, value: Any) -> str:
        if value is None:
            return ""
        text = str(value).strip().lower()
        text = "".join(ch for ch in text if ch.isalnum() or ch.isspace())
        return " ".join(text.split())

    def _log_matched_event(self, evidence: dict[str, Any], matched_event: dict[str, Any] | None) -> None:
        title = evidence.get("title") or evidence.get("id") or "Unknown evidence"
        logger.warning("DEBUG Evidence title: %s", title)
        if not matched_event:
            logger.warning("DEBUG Matched timeline event: None")
            return
        logger.warning("DEBUG Matched timeline event: %s", matched_event)
        logger.warning("DEBUG matched_event.keys(): %s", list(matched_event.keys()))
        matched_mitre = self._get_matched_event_mitre_technique(matched_event)
        matched_stage = self._get_matched_event_attack_stage(matched_event)
        if matched_mitre:
            logger.warning("DEBUG matched_event['mitre_technique']: %s", matched_mitre)
        else:
            logger.warning(
                "DEBUG 'mitre_technique' missing; available fields: %s",
                list(matched_event.keys()),
            )
        if matched_stage:
            logger.warning("DEBUG matched_event['attack_stage']: %s", matched_stage)
        else:
            logger.warning(
                "DEBUG 'attack_stage' missing; available fields: %s",
                list(matched_event.keys()),
            )

    def _get_matched_event_mitre_technique(self, matched_event: dict[str, Any] | None) -> str | None:
        if not matched_event:
            return None
        technique = matched_event.get("mitre_technique")
        if technique is None:
            return None
        value = str(technique).strip()
        return value or None

    def _get_matched_event_attack_stage(self, matched_event: dict[str, Any] | None) -> str | None:
        if not matched_event:
            return None
        for key in ("attack_stage", "attackStage"):
            stage = matched_event.get(key)
            if stage:
                return str(stage).strip()
        return None

    def _classify_evidence_stages(self, evidence: dict[str, Any]) -> list[str]:
        stage_keywords = {
            "Initial Access": ["phish", "email", "attachment", "delivery", "malicious", "initial access"],
            "Execution": ["execute", "execution", "powershell", "cmd", "script", "macro"],
            "Persistence": ["registry", "startup", "scheduled", "task", "service", "persistence"],
            "Privilege Escalation": ["priv", "elevat", "token", "lsass", "admin", "delegation"],
            "Defense Evasion": ["evad", "defender", "amsi", "obfus", "bypass", "disable"],
            "Credential Access": ["credential", "mimikatz", "lsass", "sam", "ntds", "password"],
            "Discovery": ["discover", "enum", "query", "recon", "network", "domain", "host"],
            "Lateral Movement": ["psexec", "remote", "lateral", "wmic", "rdp"],
            "Collection": ["collect", "archive", "copy", "staging", "dump"],
            "Exfiltration": ["exfil", "rclone", "upload", "ftp", "cloud"],
            "Impact": ["encrypt", "ransom", "blackcat", "impact", "locker"],
        }
        text = " ".join([
            str(evidence.get("title") or ""),
            str(evidence.get("description") or ""),
            str(evidence.get("rawLog") or ""),
            str(evidence.get("source") or ""),
            str(evidence.get("host") or ""),
            str(evidence.get("user") or ""),
        ]).lower()
        matched_stages = []
        for stage_name, keywords in stage_keywords.items():
            if any(keyword in text for keyword in keywords):
                matched_stages.append(stage_name)
        for technique in evidence.get("correctMitreTechniques", []) or []:
            tactic_name = technique.get("tactic") if isinstance(technique, dict) else None
            if tactic_name in stage_keywords:
                matched_stages.append(tactic_name)
        if evidence.get("correctKillChain"):
            kill_chain_stage = str(evidence.get("correctKillChain"))
            if kill_chain_stage == "Delivery":
                matched_stages.append("Initial Access")
            elif kill_chain_stage == "Exploitation":
                matched_stages.append("Execution")
            elif kill_chain_stage == "Installation":
                matched_stages.append("Persistence")
            elif kill_chain_stage == "Command and Control":
                matched_stages.append("Exfiltration")
            elif kill_chain_stage == "Actions on Objectives":
                matched_stages.append("Impact")
        return list(dict.fromkeys(matched_stages))

    def _extract_mitre_techniques(self, matched_event: dict[str, Any] | None) -> list[dict[str, Any]]:
        technique = self._get_matched_event_mitre_technique(matched_event)
        logger.warning(
            "FLOW _extract_mitre_techniques\n----------------\nmatched_event: %s\nmatched_event[mitre_technique]: %s\nreturned technique: %s\nsource=_extract_mitre_techniques",
            matched_event,
            technique,
            technique,
        )
        if technique:
            return [{"id": technique, "name": technique, "tactic": None, "description": None}]

        return []

    def _detect_tools(self, evidence: dict[str, Any]) -> list[str]:
        tool_patterns = {
            "PowerShell": ["powershell", "pwsh"],
            "Mimikatz": ["mimikatz", "sekurlsa", "lsass"],
            "PsExec": ["psexec"],
            "Rclone": ["rclone"],
            "BlackCat": ["blackcat"],
            "Cobalt Strike": ["cobalt strike", "beacon"],
        }
        text = " ".join([
            str(evidence.get("title") or ""),
            str(evidence.get("description") or ""),
            str(evidence.get("rawLog") or ""),
            str(evidence.get("source") or ""),
        ]).lower()
        detected = []
        for tool_name, indicators in tool_patterns.items():
            if any(indicator in text for indicator in indicators):
                detected.append(tool_name)
        return detected

    async def create_report(self, payload: ReportCreate) -> dict[str, Any]:
        client = await get_supabase_client()
        report_row = {
            "id": str(uuid4()),
            "user_id": payload.userId,
            "scenario_id": payload.scenarioId,
            "scenario_title": payload.scenarioTitle,
            "score": payload.score,
            "accuracy_percentage": payload.accuracyPercentage,
            "stars_earned": payload.starsEarned,
            "narrative": payload.narrative,
            "weaknesses": payload.weaknesses,
            "recommendations": payload.recommendations,
        }
        response = await client.table("reports").insert(report_row).execute()
        rows = response.data or []
        if not rows:
            raise RuntimeError("Report creation returned no row")
        return self._normalize_report(rows[0])

    async def update_report(self, report_id: str, payload: ReportUpdate) -> dict[str, Any] | None:
        client = await get_supabase_client()
        update_data = {}
        if payload.userId is not None:
            update_data["user_id"] = payload.userId
        if payload.scenarioId is not None:
            update_data["scenario_id"] = payload.scenarioId
        if payload.scenarioTitle is not None:
            update_data["scenario_title"] = payload.scenarioTitle
        if payload.score is not None:
            update_data["score"] = payload.score
        if payload.accuracyPercentage is not None:
            update_data["accuracy_percentage"] = payload.accuracyPercentage
        if payload.starsEarned is not None:
            update_data["stars_earned"] = payload.starsEarned
        if payload.narrative is not None:
            update_data["narrative"] = payload.narrative
        if payload.weaknesses is not None:
            update_data["weaknesses"] = payload.weaknesses
        if payload.recommendations is not None:
            update_data["recommendations"] = payload.recommendations
        if not update_data:
            return await self.get_report(report_id)

        response = await client.table("reports").update(update_data).eq("id", report_id).execute()
        rows = response.data or []
        if not rows:
            return None
        return self._normalize_report(rows[0])

    async def delete_report(self, report_id: str) -> bool:
        client = await get_supabase_client()
        response = await client.table("reports").delete().eq("id", report_id).execute()
        return bool(response.data or [])

    async def get_reports(self) -> list[dict[str, Any]]:
        try:
            client = await get_supabase_client()
            response = await client.table("reports").select("*").order("created_at", desc=True).execute()
            return [self._normalize_report(row) for row in (response.data or [])]
        except Exception as exc:
            if self._is_missing_table_error(exc):
                logger.warning("Supabase table 'reports' is unavailable; returning empty list")
                return []
            logger.exception("Failed to fetch reports from Supabase")
            raise RuntimeError("Unable to load reports from Supabase") from exc

    async def get_report(self, report_id: str) -> dict[str, Any] | None:
        try:
            client = await get_supabase_client()
            response = await client.table("reports").select("*").eq("id", report_id).limit(1).execute()
            rows = response.data or []
            if not rows:
                return None
            return self._normalize_report(rows[0])
        except Exception as exc:
            if self._is_missing_table_error(exc):
                logger.warning("Supabase table 'reports' is unavailable for %s", report_id)
                return None
            logger.exception("Failed to fetch report %s from Supabase", report_id)
            raise RuntimeError("Unable to load report details from Supabase") from exc

    def _normalize_report(self, row: dict[str, Any]) -> dict[str, Any]:
        weaknesses = row.get("weaknesses")
        if isinstance(weaknesses, str):
            weaknesses = json.loads(weaknesses or "[]")
        elif weaknesses is None:
            weaknesses = []

        recommendations = row.get("recommendations")
        if isinstance(recommendations, str):
            recommendations = json.loads(recommendations or "[]")
        elif recommendations is None:
            recommendations = []

        return {
            "id": row.get("id"),
            "userId": row.get("user_id"),
            "scenarioId": row.get("scenario_id"),
            "scenarioTitle": row.get("scenario_title"),
            "completedAt": row.get("completed_at") or row.get("created_at"),
            "score": row.get("score"),
            "accuracyPercentage": row.get("accuracy_percentage"),
            "starsEarned": row.get("stars_earned"),
            "userPlacements": [],
            "relationships": [],
            "narrative": row.get("narrative"),
            "weaknesses": weaknesses,
            "recommendations": recommendations,
            "evaluation": {},
        }

    def _normalize_evidence(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row.get("id"),
            "title": row.get("title"),
            "timestamp": row.get("timestamp"),
            "trueTimestampMs": row.get("true_timestamp_ms"),
            "category": row.get("category"),
            "severity": row.get("severity"),
            "source": row.get("source"),
            "description": row.get("description"),
            "host": row.get("host"),
            "user": row.get("user"),
            "rawLog": row.get("raw_log"),
            "hint": row.get("hint"),
            "correctMitreTechniques": row.get("correct_mitre_techniques") or [],
            "correctKillChain": row.get("correct_kill_chain"),
        }

    def _normalize_timeline_event(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "evidenceId": row.get("evidence_id"),
            "orderIndex": int(row.get("order_index") or 0),
            "mitreTechniqueIds": self._parse_technique_ids(row.get("assigned_mitre_technique_ids")),
            "mitre_technique": row.get("mitre_technique") or row.get("mitreTechnique"),
            "attack_stage": row.get("attack_stage") or row.get("attackStage"),
            "attackStage": row.get("attack_stage") or row.get("attackStage"),
            "killChainStage": row.get("assigned_kill_chain_stage"),
            "title": row.get("title"),
            "timestamp": row.get("timestamp"),
            "source": row.get("source"),
        }

    def _parse_technique_ids(self, value: Any) -> list[str]:
        if not value:
            return []
        if isinstance(value, list):
            return [str(item) for item in value if str(item)]
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return [str(value)]

    async def _update_leaderboard(self, client: Any, evaluation: dict[str, Any], username: str | None = None) -> None:
        entry_name = (username or "analyst").strip() or "analyst"
        response = await client.table("leaderboard").select("*").eq("username", entry_name).limit(1).execute()
        rows = response.data or []

        if rows:
            entry = rows[0]
            existing_xp = int(entry.get("xp") or 0)
            existing_avg = float(entry.get("avg_accuracy") or 0)
            existing_labs = int(entry.get("labs_completed") or 0)
            new_xp = existing_xp + int(evaluation.get("xpGained") or 0)
            new_avg = round(((existing_avg * existing_labs) + float(evaluation.get("accuracyPercentage") or 0)) / max(1, existing_labs + 1), 2)
            new_labs = existing_labs + 1
            await client.table("leaderboard").update({
                "xp": new_xp,
                "avg_accuracy": new_avg,
                "labs_completed": new_labs,
            }).eq("id", entry["id"]).execute()
            return

        await client.table("leaderboard").insert({
            "id": f"leaderboard-{uuid4().hex[:8]}",
            "username": entry_name,
            "title": "Analyst",
            "xp": int(evaluation.get("xpGained") or 0),
            "labs_completed": 1,
            "avg_accuracy": float(evaluation.get("accuracyPercentage") or 0),
            "avatar": None,
        }).execute()

    def _is_missing_table_error(self, exc: Exception) -> bool:
        message = str(exc)
        return "PGRST205" in message or "Could not find the table" in message or "404" in message

    def _normalize_relationship(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row.get("id"),
            "sourceId": row.get("source_id"),
            "targetId": row.get("target_id"),
            "type": row.get("type"),
        }
