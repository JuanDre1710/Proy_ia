from __future__ import annotations

import importlib
import os
import shutil
import sys
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

from ers_core.config.app_settings import reset_settings_cache


def bootstrap_test_client() -> tuple[TestClient, Path]:
    root = Path("data") / "test_runs" / f"qa_suite_{uuid4().hex[:8]}"
    root.mkdir(parents=True, exist_ok=True)
    os.environ["ERS_ENV"] = "test"
    os.environ["ERS_DATA_DIR"] = str(root)
    os.environ["ERS_EXPORT_DIR"] = str(root / "exports" / "files")
    os.environ["ERS_JWT_SECRET"] = "ers-test-secret"
    os.environ["ERS_RATE_LIMIT_REQUESTS"] = "1000"
    os.environ["ERS_RATE_LIMIT_WINDOW_SECONDS"] = "60"
    os.environ["ERS_ENABLE_MODEL_WATCHER"] = "false"
    reset_settings_cache()
    for target in [
        "ia_fraude.app",
        "ia_fraude.api.auth_routes",
        "ia_fraude.api.case_routes",
        "ia_fraude.api.identity_routes",
        "ia_fraude.api.integration_routes",
        "ia_fraude.api.rule_routes",
        "ia_fraude.api.audit_routes",
        "ia_fraude.api.export_routes",
        "ia_fraude.api.security",
    ]:
        sys.modules.pop(target, None)
    app_module = importlib.import_module("ia_fraude.app")
    return TestClient(app_module.create_app()), root


def login(client: TestClient, username: str, password: str) -> dict[str, str]:
    response = client.post("/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    payload = response.json()
    return {"Authorization": f"Bearer {payload['accessToken']}"}


def configure_integrations(client: TestClient, auth_headers: dict[str, str]) -> None:
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
            "updatedBy": "qa-suite",
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
            "updatedBy": "qa-suite",
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
            "updatedBy": "qa-suite",
        },
    ]
    for payload in payloads:
        response = client.post("/admin/integrations", json=payload, headers=auth_headers)
        assert response.status_code == 201


def cleanup_test_dir(root: Path) -> None:
    shutil.rmtree(root, ignore_errors=True)
