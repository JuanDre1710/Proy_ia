from __future__ import annotations

from ers_core.application.dto.api_models import (
    ApiAlertDto,
    ApiCaseDto,
    ApiDecisionDto,
    ApiReasoningDto,
    ApiScoreDto,
)
from ers_core.domain.models import Case


def map_case_to_api_dto(case: Case) -> ApiCaseDto:
    """Map the canonical domain case into a stable API DTO for frontend consumption."""
    assessment = case.final_assessment
    reasoning = case.reasoning_result
    score = case.score_result
    decision = case.latest_decision

    return ApiCaseDto(
        case_id=case.case_id,
        requested_at=case.created_at.isoformat(),
        general_status=assessment.risk_category.value if assessment else "PENDING",
        subject_name=case.subject.full_name,
        document_type=case.subject.document_type.value,
        document_number=case.subject.document_number,
        identity_status=case.identity_status.status.value,
        identity_verified=case.identity_status.verified,
        deceased=case.identity_status.deceased,
        analyst_summary=assessment.executive_summary if assessment else "",
        alerts=[
            ApiAlertDto(
                id=alert.alert_id,
                severity=alert.severity.value,
                title=alert.title,
                short_description=alert.short_description,
                detail=alert.detail,
                source=alert.source_type.value,
                related_variable=alert.related_variable,
                recommendation=alert.recommendation_hint,
            )
            for alert in case.alerts
        ],
        reasoning=(
            ApiReasoningDto(
                summary=reasoning.summary,
                hypothesis=reasoning.hypothesis,
                confidence=reasoning.confidence,
                unresolved_questions=reasoning.unresolved_questions,
            )
            if reasoning
            else None
        ),
        score=(
            ApiScoreDto(
                score=score.score_value,
                category=score.risk_category.value,
                confidence=score.confidence,
                model_version=score.model_version,
                top_factors=score.top_factors,
            )
            if score
            else None
        ),
        decision=(
            ApiDecisionDto(
                status=decision.status.value,
                actor_id=decision.actor_id,
                actor_role=decision.actor_role,
                comment=decision.comment,
                created_at=decision.created_at.isoformat(),
            )
            if decision
            else None
        ),
    )
