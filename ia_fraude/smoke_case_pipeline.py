from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ers_core.adapters.factories.integration_adapter_factory import IntegrationAdapterFactory
from ers_core.adapters.repositories.file_audit_log_repository import FileAuditLogRepository
from ers_core.adapters.repositories.file_case_repository import FileCaseRepository
from ers_core.adapters.repositories.file_export_repository import FileExportRepository
from ers_core.adapters.repositories.file_integration_repository import FileIntegrationConfigRepository
from ers_core.application.services.case_ingestion_service import CaseIngestionService
from ers_core.application.services.case_decision_service import CaseDecisionService
from ers_core.application.services.case_export_service import CaseExportService
from ers_core.application.services.case_pipeline_service import CasePipelineService
from ers_core.application.services.integration_manager import IntegrationManager
from ers_core.domain.enums import IntegrationStatus, ProviderType


def reset_file(path: Path, initial_content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(initial_content, encoding="utf-8")


def main() -> None:
    root = Path("data") / "case_pipeline_smoke"
    cases_file = root / "cases.json"
    audit_file = root / "audit_logs.jsonl"
    integrations_file = root / "integration_configs.json"
    exports_index = root / "exports" / "exports.json"
    exports_dir = root / "exports" / "files"

    reset_file(cases_file, "[]")
    reset_file(audit_file, "")
    reset_file(integrations_file, "[]")
    reset_file(exports_index, "[]")

    case_repository = FileCaseRepository(cases_file)
    audit_repository = FileAuditLogRepository(audit_file)
    integration_repository = FileIntegrationConfigRepository(integrations_file)
    export_repository = FileExportRepository(exports_index, exports_dir)
    integration_manager = IntegrationManager(
        integration_repository,
        audit_repository,
        IntegrationAdapterFactory(),
    )
    ingestion_service = CaseIngestionService(case_repository, audit_repository, integration_manager)
    pipeline_service = CasePipelineService(case_repository, audit_repository, integration_manager)
    decision_service = CaseDecisionService(case_repository, audit_repository)
    export_service = CaseExportService(case_repository, export_repository, audit_repository)

    integration_manager.create_integration(
        code="DEMO_IDENTITY",
        provider_type=ProviderType.IDENTITY,
        display_name="Identity demo provider",
        base_url="https://demo.local/identity",
        auth_type="None",
        secret_ref=None,
        timeout_ms=3000,
        retries=0,
        status=IntegrationStatus.ACTIVE,
        enabled=True,
        metadata={"mode": "demo_internal"},
        settings={"integrationKind": "API REST", "providerMode": "demo_internal"},
        updated_by="smoke",
    )
    integration_manager.create_integration(
        code="DEMO_FINANCIAL",
        provider_type=ProviderType.FINANCIAL,
        display_name="Financial demo provider",
        base_url="https://demo.local/financial",
        auth_type="None",
        secret_ref=None,
        timeout_ms=3000,
        retries=0,
        status=IntegrationStatus.ACTIVE,
        enabled=True,
        metadata={"mode": "demo_internal"},
        settings={"integrationKind": "API REST", "providerMode": "demo_internal", "stubMode": "success"},
        updated_by="smoke",
    )
    integration_manager.create_integration(
        code="DEMO_LABOR",
        provider_type=ProviderType.LABOR_FISCAL,
        display_name="Labor demo provider",
        base_url="https://demo.local/labor",
        auth_type="None",
        secret_ref=None,
        timeout_ms=3000,
        retries=0,
        status=IntegrationStatus.ACTIVE,
        enabled=True,
        metadata={"mode": "demo_internal"},
        settings={"integrationKind": "API REST", "providerMode": "demo_internal", "stubMode": "success"},
        updated_by="smoke",
    )

    ingested = ingestion_service.create_case_evaluation(
        identifier="27123456789",
        requested_by="usr-eval",
        source_channel="smoke",
    )
    consolidated = pipeline_service.consolidate_case_evidence(ingested)
    reloaded = ingestion_service.get_case("27123456789")

    assert consolidated.processing_state.value == "scored"
    assert consolidated.score_result is not None
    assert consolidated.final_assessment is not None
    assert consolidated.final_assessment.final_status in {"READY_FOR_DECISION", "REVIEW_REQUIRED"}
    assert consolidated.financial_info is not None
    assert consolidated.labor_fiscal_info is not None
    assert consolidated.consolidated_evidence is not None
    assert consolidated.consolidated_evidence.ready_for_rules is True
    assert consolidated.hard_rule_evaluation is not None
    assert consolidated.hard_rule_evaluation.final_effect == "continue_to_reasoning"
    assert consolidated.reasoning_result is not None
    assert consolidated.reasoning_result.suggested_priority in {"LOW", "MEDIUM", "HIGH"}
    assert consolidated.score_result.model_version is not None
    assert consolidated.relationship_graph is not None
    assert reloaded is not None
    assert reloaded.processing_state.value == "scored"
    assert reloaded.consolidated_evidence is not None
    assert reloaded.hard_rule_evaluation is not None
    assert reloaded.reasoning_result is not None
    assert reloaded.score_result is not None
    assert reloaded.relationship_graph is not None
    assert reloaded.final_assessment is not None

    integration = integration_manager.list_active_integrations(ProviderType.FINANCIAL)[0]
    integration_manager.update_integration(
        integration.integration_id,
        code=integration.provider_code,
        provider_type=integration.provider_type,
        display_name=integration.display_name,
        base_url=integration.base_url,
        auth_type=integration.auth_type,
        secret_ref=integration.secret_ref,
        timeout_ms=integration.timeout_ms,
        retries=integration.retries,
        status=integration.status,
        enabled=integration.enabled,
        metadata=integration.metadata,
        settings={"integrationKind": "API REST", "stubMode": "partial"},
        updated_by="smoke",
    )

    second_ingested = ingestion_service.create_case_evaluation(
        identifier="30111201",
        requested_by="usr-eval",
        source_channel="smoke",
    )
    second_consolidated = pipeline_service.consolidate_case_evidence(second_ingested)
    assert second_consolidated.processing_state.value == "scored"
    assert second_consolidated.consolidated_evidence is not None
    assert second_consolidated.consolidated_evidence.provider_statuses["FINANCIAL"] == "partial"
    assert second_consolidated.consolidated_evidence.provider_statuses["LABOR_FISCAL"] == "ok"
    assert second_consolidated.reasoning_result is not None
    assert second_consolidated.score_result is not None
    assert second_consolidated.final_assessment is not None

    integration_manager.update_integration(
        integration.integration_id,
        code=integration.provider_code,
        provider_type=integration.provider_type,
        display_name=integration.display_name,
        base_url=integration.base_url,
        auth_type=integration.auth_type,
        secret_ref=integration.secret_ref,
        timeout_ms=integration.timeout_ms,
        retries=integration.retries,
        status=integration.status,
        enabled=integration.enabled,
        metadata=integration.metadata,
        settings={"integrationKind": "API REST", "stubMode": "timeout"},
        updated_by="smoke",
    )

    timeout_ingested = ingestion_service.create_case_evaluation(
        identifier="30111297",
        requested_by="usr-eval",
        source_channel="smoke",
    )
    timeout_consolidated = pipeline_service.consolidate_case_evidence(timeout_ingested)
    assert timeout_consolidated.processing_state.value == "not_evaluable"
    assert timeout_consolidated.consolidated_evidence is not None
    assert timeout_consolidated.consolidated_evidence.provider_statuses["FINANCIAL"] == "timeout"
    assert timeout_consolidated.hard_rule_evaluation is not None
    assert timeout_consolidated.hard_rule_evaluation.final_effect == "mark_not_evaluable"
    assert timeout_consolidated.reasoning_result is None
    assert timeout_consolidated.score_result is None
    assert timeout_consolidated.final_assessment is not None
    assert timeout_consolidated.final_assessment.final_status == "NOT_EVALUABLE"

    integration_manager.update_integration(
        integration.integration_id,
        code=integration.provider_code,
        provider_type=integration.provider_type,
        display_name=integration.display_name,
        base_url=integration.base_url,
        auth_type=integration.auth_type,
        secret_ref=integration.secret_ref,
        timeout_ms=integration.timeout_ms,
        retries=integration.retries,
        status=integration.status,
        enabled=integration.enabled,
        metadata=integration.metadata,
        settings={"integrationKind": "API REST", "stubMode": "success"},
        updated_by="smoke",
    )

    blocked_ingested = ingestion_service.create_case_evaluation(
        identifier="30111266",
        requested_by="usr-eval",
        source_channel="smoke",
    )
    blocked_consolidated = pipeline_service.consolidate_case_evidence(blocked_ingested)
    assert blocked_consolidated.processing_state.value == "excluded"
    assert blocked_consolidated.hard_rule_evaluation is not None
    assert blocked_consolidated.hard_rule_evaluation.final_effect == "exclude_case"
    assert blocked_consolidated.reasoning_result is None
    assert blocked_consolidated.score_result is None
    assert blocked_consolidated.final_assessment is not None
    assert blocked_consolidated.final_assessment.final_status == "EXCLUDED"

    mismatch_ingested = ingestion_service.create_case_evaluation(
        identifier="30111277",
        requested_by="usr-eval",
        source_channel="smoke",
    )
    mismatch_consolidated = pipeline_service.consolidate_case_evidence(mismatch_ingested)
    assert mismatch_consolidated.processing_state.value == "excluded"
    assert mismatch_consolidated.hard_rule_evaluation is not None
    assert any(
        item.code == "CRITICAL_CROSS_SOURCE_INCONSISTENCY"
        for item in mismatch_consolidated.hard_rule_evaluation.findings
    )
    assert mismatch_consolidated.reasoning_result is None
    assert mismatch_consolidated.score_result is None

    shared_first = pipeline_service.consolidate_case_evidence(
        ingestion_service.create_case_evaluation(
            identifier="30111444",
            requested_by="usr-eval",
            source_channel="smoke",
        )
    )
    shared_second = pipeline_service.consolidate_case_evidence(
        ingestion_service.create_case_evaluation(
            identifier="30111445",
            requested_by="usr-eval",
            source_channel="smoke",
        )
    )
    assert shared_second.relationship_graph is not None
    assert any(signal.code == "PHONE_MATCH" for signal in shared_second.relationship_graph.signals)
    assert any(signal.code == "ADDRESS_MATCH" for signal in shared_second.relationship_graph.signals)
    assert any(signal.code == "COMPANY_MATCH" for signal in shared_second.relationship_graph.signals)
    assert any(signal.code == "SUSPICIOUS_REUSE" for signal in shared_second.relationship_graph.signals)
    assert any(alert.source_type.value == "RELATIONSHIP" for alert in shared_second.alerts)

    decided = decision_service.record_decision(
        case_id=consolidated.case_id,
        action="escalate",
        comment="Se escala por coherencia con la recomendacion operativa y revision manual.",
        actor_id="sup-01",
        actor_name="Supervisor Smoke",
        actor_role="Supervisor",
    )
    assert decided.latest_decision is not None
    assert decided.latest_decision.status.value == "ESCALATED"
    assert decided.latest_decision.comment is not None
    decided_reload = ingestion_service.get_case(consolidated.case_id)
    assert decided_reload is not None
    assert decided_reload.latest_decision is not None
    assert decided_reload.latest_decision.status.value == "ESCALATED"

    pdf_export = export_service.export_case(
        case_id=consolidated.case_id,
        export_format="pdf",
        actor_id="usr-admin",
        actor_name="Admin Smoke",
        actor_role="Admin",
    )
    csv_export = export_service.export_case(
        case_id=consolidated.case_id,
        export_format="csv",
        actor_id="usr-admin",
        actor_name="Admin Smoke",
        actor_role="Admin",
    )
    assert Path(pdf_export.file_path).exists()
    assert Path(csv_export.file_path).exists()
    audit_rows, audit_total = audit_repository.query(page=0, page_size=500)
    assert audit_total >= len(audit_rows)
    assert any(row.action.value == "INTEGRATION_CONSUMED" for row in audit_rows)
    assert any(row.action.value == "HARD_RULES_EXECUTED" for row in audit_rows)
    assert any(row.action.value == "REASONING_EXECUTED" for row in audit_rows)
    assert any(row.action.value == "SCORING_EXECUTED" for row in audit_rows)
    assert any(row.action.value == "EXPORT_REQUESTED" for row in audit_rows)

    print("create_case_evaluation: OK")
    print("hard_rules continue_to_reasoning: OK")
    print("reasoning structured output: OK")
    print("scoring structured output: OK")
    print("final assessment structured output: OK")
    print("relationship graph structured output: OK")
    print("hard_rules partial provider continue: OK")
    print("hard_rules provider timeout not_evaluable: OK")
    print("hard_rules policy exclusion: OK")
    print("hard_rules cross-source exclusion: OK")
    print("manual decision persisted: OK")
    print("audit logs query and exports persisted: OK")
    print("get_case persisted hard rules: OK")


if __name__ == "__main__":
    main()
