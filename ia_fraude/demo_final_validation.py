from __future__ import annotations

import importlib
import os
import shutil
import sys
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from ers_core.config.app_settings import reset_settings_cache


def _bootstrap_demo_client() -> tuple[TestClient, Path]:
    root = Path("data") / "demo_final_validation" / f"run_{uuid4().hex[:8]}"
    root.mkdir(parents=True, exist_ok=True)
    os.environ["ERS_ENV"] = "test"
    os.environ["ERS_DATA_DIR"] = str(root)
    os.environ["ERS_EXPORT_DIR"] = str(root / "exports" / "files")
    os.environ["ERS_JWT_SECRET"] = "ers-demo-secret"
    os.environ["ERS_RATE_LIMIT_REQUESTS"] = "1000"
    os.environ["ERS_RATE_LIMIT_WINDOW_SECONDS"] = "60"
    os.environ["ERS_ENABLE_MODEL_WATCHER"] = "false"
    reset_settings_cache()
    for target in [
        "ia_fraude.app",
        "ia_fraude.api.auth_routes",
        "ia_fraude.api.case_routes",
        "ia_fraude.api.integration_routes",
        "ia_fraude.api.audit_routes",
        "ia_fraude.api.export_routes",
        "ia_fraude.api.security",
    ]:
        sys.modules.pop(target, None)
    app_module = importlib.import_module("ia_fraude.app")
    return TestClient(app_module.create_app()), root


def _login(client: TestClient, username: str, password: str) -> dict[str, str]:
    response = client.post("/auth/login", json={"username": username, "password": password})
    response.raise_for_status()
    payload = response.json()
    return {"Authorization": f"Bearer {payload['accessToken']}"}


def _configure_integrations(client: TestClient, auth_headers: dict[str, str]) -> None:
    payloads = [
        {
            "code": "DEMO_IDENTITY",
            "providerType": "IDENTITY",
            "integrationKind": "API REST",
            "displayName": "Identity demo provider",
            "baseUrl": "https://demo.local/identity",
            "authType": "Ninguna",
            "secretRef": None,
            "timeoutMs": 3000,
            "retries": 0,
            "status": "ACTIVE",
            "enabled": True,
            "detail": "demo internal provider",
            "metadata": {"mode": "demo_internal"},
            "settings": {"providerMode": "demo_internal"},
            "updatedBy": "demo-final-validation",
        },
        {
            "code": "DEMO_FINANCIAL",
            "providerType": "FINANCIAL",
            "integrationKind": "API REST",
            "displayName": "Financial demo provider",
            "baseUrl": "https://demo.local/financial",
            "authType": "Ninguna",
            "secretRef": None,
            "timeoutMs": 3000,
            "retries": 0,
            "status": "ACTIVE",
            "enabled": True,
            "detail": "demo internal provider",
            "metadata": {"mode": "demo_internal"},
            "settings": {"providerMode": "demo_internal", "stubMode": "success"},
            "updatedBy": "demo-final-validation",
        },
        {
            "code": "DEMO_LABOR",
            "providerType": "LABOR_FISCAL",
            "integrationKind": "API REST",
            "displayName": "Labor demo provider",
            "baseUrl": "https://demo.local/labor",
            "authType": "Ninguna",
            "secretRef": None,
            "timeoutMs": 3000,
            "retries": 0,
            "status": "ACTIVE",
            "enabled": True,
            "detail": "demo internal provider",
            "metadata": {"mode": "demo_internal"},
            "settings": {"providerMode": "demo_internal", "stubMode": "success"},
            "updatedBy": "demo-final-validation",
        },
    ]
    for payload in payloads:
        response = client.post("/admin/integrations", json=payload, headers=auth_headers)
        response.raise_for_status()


def _assert_case_flow(
    client: TestClient,
    headers: dict[str, str],
    *,
    identifier: str,
    expected_status: str,
    expected_final_status: str,
    expected_score_category: str | None,
) -> str:
    evaluate = client.post(
        "/cases/evaluate",
        json={"identifier": identifier, "requestedBy": "demo-supervisor", "sourceChannel": "demo-final"},
        headers=headers,
    )
    evaluate.raise_for_status()
    evaluate_payload = evaluate.json()
    case_id = evaluate_payload["caseId"]
    assert evaluate_payload["status"] == expected_status, (identifier, evaluate_payload)

    detail = client.get(f"/cases/{case_id}", headers=headers)
    detail.raise_for_status()
    detail_payload = detail.json()
    final_assessment = detail_payload.get("finalAssessment") or {}
    score = detail_payload.get("score") or {}
    assert final_assessment.get("finalStatus") == expected_final_status, (identifier, detail_payload)
    assert score.get("category") == expected_score_category, (identifier, detail_payload)

    timeline = client.get(f"/audit/cases/{case_id}/timeline", headers=headers)
    timeline.raise_for_status()
    timeline_payload = timeline.json()
    event_codes = {item["eventCode"] for item in timeline_payload["rows"]}
    assert "CASE_CREATED" in event_codes
    assert "CASE_VALIDATED" in event_codes
    if expected_status == "scored":
        assert "HARD_RULES_EXECUTED" in event_codes
        assert "REASONING_EXECUTED" in event_codes
        assert "SCORING_EXECUTED" in event_codes
        assert "FINAL_ASSESSMENT_GENERATED" in event_codes
    return case_id


def main() -> None:
    client, root = _bootstrap_demo_client()
    try:
        headers = _login(client, "supervisor", "Super#123")
        _configure_integrations(client, headers)

        normal_case_id = _assert_case_flow(
            client,
            headers,
            identifier="27123456789",
            expected_status="scored",
            expected_final_status="READY_FOR_DECISION",
            expected_score_category="NORMAL",
        )
        _assert_case_flow(
            client,
            headers,
            identifier="30111205",
            expected_status="scored",
            expected_final_status="REVIEW_REQUIRED",
            expected_score_category="REQUIRES_REVIEW",
        )
        suspicious_case_id = _assert_case_flow(
            client,
            headers,
            identifier="30111201",
            expected_status="scored",
            expected_final_status="REVIEW_REQUIRED",
            expected_score_category="FRAUD_SUSPECT",
        )
        _assert_case_flow(
            client,
            headers,
            identifier="30111297",
            expected_status="not_evaluable",
            expected_final_status="NOT_EVALUABLE",
            expected_score_category=None,
        )
        inconsistent_case_id = _assert_case_flow(
            client,
            headers,
            identifier="30111277",
            expected_status="excluded",
            expected_final_status="EXCLUDED",
            expected_score_category=None,
        )

        decision = client.post(
            f"/cases/{suspicious_case_id}/decision",
            json={
                "action": "escalate",
                "comment": "Escalado en demo final por score alto y evidencia convergente.",
                "actorId": "usr-supervisor",
                "actorName": "Carla Sosa",
                "actorRole": "Supervisor",
            },
            headers=headers,
        )
        decision.raise_for_status()
        assert decision.json()["status"] == "ESCALATED"

        timeline = client.get(f"/audit/cases/{suspicious_case_id}/timeline", headers=headers)
        timeline.raise_for_status()
        timeline_events = [item["eventCode"] for item in timeline.json()["rows"]]
        assert "CASE_DECISION_RECORDED" in timeline_events

        detail_after = client.get(f"/cases/{suspicious_case_id}", headers=headers)
        detail_after.raise_for_status()
        detail_payload = detail_after.json()
        assert detail_payload["decision"]["status"] == "ESCALATED"
        assert len(detail_payload["decisionHistory"]) >= 1

        audit_logs = client.get("/audit/logs?accion=Revision%20manual", headers=headers)
        audit_logs.raise_for_status()
        assert audit_logs.json()["total"] >= 1

        print("demo scenario normal: OK", normal_case_id)
        print("demo scenario review: OK", "30111205")
        print("demo scenario suspicious: OK", suspicious_case_id)
        print("demo scenario incomplete: OK", "30111297")
        print("demo scenario inconsistency: OK", inconsistent_case_id)
        print("manual resolution + audit timeline: OK")
        print("demo final validation: OK")
    finally:
        client.close()
        shutil.rmtree(root, ignore_errors=True)


if __name__ == "__main__":
    main()
