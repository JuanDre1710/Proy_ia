from __future__ import annotations

from ers_core.application.dto.api_models import ApiCaseDto, UiCaseViewModel


def map_api_case_to_ui_model(case_dto: ApiCaseDto) -> UiCaseViewModel:
    """
    Translate API DTOs into UI-oriented models.

    This mapper exists to preserve frontend autonomy even if the API DTO evolves.
    The frontend should depend on its own view model, not on internal domain entities
    nor on raw external provider payloads.
    """
    return UiCaseViewModel(
        case_id=case_dto.case_id,
        requested_at=case_dto.requested_at,
        general_status=case_dto.general_status,
        full_name=case_dto.subject_name,
        document_label=f"{case_dto.document_type} {case_dto.document_number}",
        risk_category=case_dto.score.category if case_dto.score else "PENDING",
        analyst_summary=case_dto.analyst_summary,
        alerts_count=len(case_dto.alerts),
        decision_status=case_dto.decision.status if case_dto.decision else None,
    )

