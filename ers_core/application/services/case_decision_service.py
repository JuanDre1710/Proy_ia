from __future__ import annotations

from dataclasses import replace
from datetime import datetime

from ers_core.application.ports.case_repository import CaseRepository
from ers_core.application.ports.integration_repository import AuditLogRepository
from ers_core.domain.enums import AlertSeverity, AuditActionType, AuditResultType, DecisionStatus, EvidenceSourceType
from ers_core.domain.models import Alert, AuditLog, Case, Decision


class CaseDecisionError(Exception):
    pass


class CaseDecisionService:
    def __init__(self, case_repository: CaseRepository, audit_repository: AuditLogRepository) -> None:
        self._case_repository = case_repository
        self._audit_repository = audit_repository

    def record_decision(
        self,
        *,
        case_id: str,
        action: str,
        comment: str,
        actor_id: str,
        actor_name: str | None,
        actor_role: str | None,
    ) -> Case:
        case = self._case_repository.get_by_id(case_id)
        if case is None:
            raise CaseDecisionError("Case not found.")
        if case.final_assessment is None:
            raise CaseDecisionError("Case is not ready for operational decision.")

        clean_comment = comment.strip()
        if not clean_comment:
            raise CaseDecisionError("Decision comment is required.")
        if not actor_id.strip():
            raise CaseDecisionError("Actor id is required.")

        now = datetime.utcnow()
        decision = Decision(
            decision_id=f"DEC-{case.case_id}-{int(now.timestamp())}",
            case_id=case.case_id,
            status=self._map_action(action),
            actor_id=actor_id.strip(),
            actor_name=(actor_name or actor_id).strip(),
            actor_role=actor_role.strip() if actor_role else None,
            comment=clean_comment,
            rationale=case.final_assessment.summary_for_analyst,
            created_at=now,
            supersedes_decision_id=case.latest_decision.decision_id if case.latest_decision else None,
        )
        alert = Alert(
            alert_id=f"ALT-DECISION-{case.case_id}-{int(now.timestamp())}",
            severity=AlertSeverity.INFO,
            title="Decision manual registrada",
            short_description=decision.status.value,
            detail=f"{decision.actor_name or decision.actor_id} registro la decision {decision.status.value}.",
            source_type=EvidenceSourceType.MANUAL_REVIEW,
            source_reference=decision.decision_id,
            related_variable="manual_decision",
            recommendation_hint=clean_comment,
            evidence_ids=[],
        )
        history = [*case.decision_history, decision]
        workflow_status = self._resolve_workflow_status(decision.status)
        updated_case = replace(
            case,
            updated_at=now,
            latest_decision=decision,
            decision_history=history,
            alerts=[*case.alerts, alert],
            metadata={
                **case.metadata,
                "manualDecisionAt": now.isoformat(),
                "manualDecisionStatus": decision.status.value,
                "manualDecisionComment": clean_comment,
                "manualDecisionBy": decision.actor_name,
                "manualDecisionHistoryCount": len(history),
                "workflowStatus": workflow_status,
                "caseClosed": decision.status in {DecisionStatus.ACCEPTED, DecisionStatus.DENIED},
                "pipelineStage": "manual_decision",
            },
            tags=[item for item in case.tags if item != "relationships-built"] + ["manual-decision-recorded"],
        )
        saved = self._case_repository.save(updated_case)
        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-CASE-DECISION-{case.case_id}-{int(now.timestamp())}",
                action=AuditActionType.CASE_DECISION_RECORDED,
                result=AuditResultType.OK,
                entity_type="Case",
                entity_id=case.case_id,
                actor_id=decision.actor_id,
                actor_role=decision.actor_role,
                correlation_id=decision.decision_id,
                detail=f"Manual decision {decision.status.value} recorded",
                metadata={
                    "comment": clean_comment,
                    "previousDecisionId": decision.supersedes_decision_id,
                },
            )
        )
        return saved

    def _map_action(self, action: str) -> DecisionStatus:
        normalized = action.strip().lower()
        if normalized == "accept":
            return DecisionStatus.ACCEPTED
        if normalized == "deny":
            return DecisionStatus.DENIED
        if normalized == "escalate":
            return DecisionStatus.ESCALATED
        raise CaseDecisionError("Unsupported decision action.")

    def _resolve_workflow_status(self, status: DecisionStatus) -> str:
        if status == DecisionStatus.ACCEPTED:
            return "resolved_accepted"
        if status == DecisionStatus.DENIED:
            return "resolved_denied"
        if status == DecisionStatus.ESCALATED:
            return "escalated_for_review"
        return "manual_decision_recorded"
