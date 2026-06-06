from __future__ import annotations

import unittest

from tests.support import bootstrap_test_client, cleanup_test_dir, configure_integrations, login


class PipelineE2ETests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client, cls.root = bootstrap_test_client()
        cls.supervisor_headers = login(cls.client, "supervisor", "Super#123")
        configure_integrations(cls.client, cls.supervisor_headers)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.client.close()
        cleanup_test_dir(cls.root)

    def test_pipeline_end_to_end(self) -> None:
        evaluate = self.client.post(
            "/cases/evaluate",
            json={"identifier": "27123456789", "requestedBy": "usr-supervisor", "sourceChannel": "qa-e2e"},
            headers=self.supervisor_headers,
        )
        self.assertEqual(200, evaluate.status_code)
        case_id = evaluate.json()["caseId"]
        self.assertEqual("scored", evaluate.json()["status"])

        detail = self.client.get(f"/cases/{case_id}", headers=self.supervisor_headers)
        self.assertEqual(200, detail.status_code)
        detail_payload = detail.json()
        self.assertTrue(detail_payload["evidenceSummary"]["readyForRules"])
        self.assertIsNotNone(detail_payload["reasoning"])
        self.assertIsNotNone(detail_payload["score"])
        self.assertIsNotNone(detail_payload["finalAssessment"])

        decision = self.client.post(
            f"/cases/{case_id}/decision",
            json={
                "action": "escalate",
                "comment": "QA E2E escalation",
                "actorId": "usr-supervisor",
                "actorName": "Carla Sosa",
                "actorRole": "Supervisor",
            },
            headers=self.supervisor_headers,
        )
        self.assertEqual(200, decision.status_code)
        self.assertEqual("ESCALATED", decision.json()["status"])
        self.assertEqual("escalated_for_review", decision.json()["workflowStatus"])

        detail_after_decision = self.client.get(f"/cases/{case_id}", headers=self.supervisor_headers)
        self.assertEqual(200, detail_after_decision.status_code)
        detail_after_payload = detail_after_decision.json()
        self.assertEqual("ESCALATED", detail_after_payload["decision"]["status"])
        self.assertEqual(1, len(detail_after_payload["decisionHistory"]))
        self.assertEqual("ESCALATED", detail_after_payload["decisionHistory"][0]["status"])

        graph = self.client.get(f"/cases/{case_id}/graph", headers=self.supervisor_headers)
        self.assertEqual(200, graph.status_code)

        audit = self.client.get("/audit/logs?accion=Revision%20manual", headers=self.supervisor_headers)
        self.assertEqual(200, audit.status_code)
        self.assertGreaterEqual(audit.json()["total"], 1)


if __name__ == "__main__":
    unittest.main()
