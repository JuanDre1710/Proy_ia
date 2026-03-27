from __future__ import annotations

import unittest

from tests.support import bootstrap_test_client, cleanup_test_dir, configure_integrations, login


class AuditAndExportsIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client, cls.root = bootstrap_test_client()
        cls.supervisor_headers = login(cls.client, "supervisor", "Super#123")
        configure_integrations(cls.client, cls.supervisor_headers)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.client.close()
        cleanup_test_dir(cls.root)

    def test_export_endpoints_persist_files_and_audit(self) -> None:
        evaluate = self.client.post(
            "/cases/evaluate",
            json={"identifier": "30111901", "requestedBy": "usr-supervisor", "sourceChannel": "test"},
            headers=self.supervisor_headers,
        )
        self.assertEqual(200, evaluate.status_code)
        case_id = evaluate.json()["caseId"]

        pdf_response = self.client.post(f"/cases/{case_id}/exports/pdf", headers=self.supervisor_headers)
        csv_response = self.client.post(f"/cases/{case_id}/exports/csv", headers=self.supervisor_headers)
        self.assertEqual(200, pdf_response.status_code)
        self.assertEqual(200, csv_response.status_code)

        pdf_download = self.client.get(pdf_response.json()["downloadUrl"], headers=self.supervisor_headers)
        csv_download = self.client.get(csv_response.json()["downloadUrl"], headers=self.supervisor_headers)
        self.assertEqual(200, pdf_download.status_code)
        self.assertEqual(200, csv_download.status_code)

        audit_logs = self.client.get("/audit/logs?accion=Exportacion%20PDF", headers=self.supervisor_headers)
        self.assertEqual(200, audit_logs.status_code)
        self.assertGreaterEqual(audit_logs.json()["total"], 1)

    def test_case_timeline_exposes_traceability_stages(self) -> None:
        evaluate = self.client.post(
            "/cases/evaluate",
            json={"identifier": "27123456789", "requestedBy": "usr-supervisor", "sourceChannel": "test-audit"},
            headers=self.supervisor_headers,
        )
        self.assertEqual(200, evaluate.status_code)
        case_id = evaluate.json()["caseId"]

        decision = self.client.post(
            f"/cases/{case_id}/decision",
            json={
                "action": "accept",
                "comment": "Audit integration acceptance",
                "actorId": "usr-supervisor",
                "actorName": "Carla Sosa",
                "actorRole": "Supervisor",
            },
            headers=self.supervisor_headers,
        )
        self.assertEqual(200, decision.status_code)

        timeline = self.client.get(f"/audit/cases/{case_id}/timeline", headers=self.supervisor_headers)
        self.assertEqual(200, timeline.status_code)
        payload = timeline.json()
        self.assertEqual(case_id, payload["caseId"])
        event_codes = [item["eventCode"] for item in payload["rows"]]
        self.assertIn("CASE_CREATED", event_codes)
        self.assertIn("CASE_VALIDATED", event_codes)
        self.assertIn("HARD_RULES_EXECUTED", event_codes)
        self.assertIn("REASONING_EXECUTED", event_codes)
        self.assertIn("SCORING_EXECUTED", event_codes)
        self.assertIn("FINAL_ASSESSMENT_GENERATED", event_codes)
        self.assertIn("CASE_DECISION_RECORDED", event_codes)


if __name__ == "__main__":
    unittest.main()
