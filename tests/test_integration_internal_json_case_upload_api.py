from __future__ import annotations

import unittest

from tests.support import bootstrap_test_client, cleanup_test_dir, login


class InternalJsonCaseUploadApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client, self.root = bootstrap_test_client()
        self.auth_headers = login(self.client, "admin", "Admin#123")

    def tearDown(self) -> None:
        cleanup_test_dir(self.root)

    def test_internal_json_case_creates_scored_case(self) -> None:
        response = self.client.post(
            "/cases/evaluate/internal-json",
            headers=self.auth_headers,
            json={
                "requestedBy": "usr-admin",
                "sourceChannel": "test-suite",
                "caseData": {
                    "identifier": "30111245",
                    "subject": {
                        "fullName": "Marcela Quiroga",
                        "province": "Cordoba",
                        "verified": True,
                        "deceased": False,
                    },
                    "financialInfo": {
                        "creditScore": 640,
                        "debtRatio": 0.42,
                        "activeLoans": 2,
                        "bouncedChecks": 1,
                    },
                    "laborFiscalInfo": {
                        "taxStatus": "Monotributo",
                        "mainActivity": "Comercio",
                        "declaredProvince": "Cordoba",
                    },
                    "claim": {
                        "claimedAmount": 180000,
                        "previousClaimsCount": 2,
                        "customerAntiquityMonths": 24,
                        "repeatedProvider": True,
                    },
                    "inconsistencies": ["Factura pendiente de validacion final."],
                    "missingEvidence": ["Falta pericia final."],
                },
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["identifier"], "30111245")
        self.assertEqual(payload["validationResults"]["analysisStage"], "internal_claim_only")
        self.assertEqual(payload["status"], "scored")

        case_response = self.client.get(f"/cases/{payload['caseId']}", headers=self.auth_headers)
        self.assertEqual(case_response.status_code, 200)
        case_payload = case_response.json()
        self.assertEqual(case_payload["metadata"]["currentInstance"], "instance_1_internal")
        self.assertEqual(case_payload["metadata"]["nextInstance"], "instance_2_conditional_enrichment")
        self.assertIsNotNone(case_payload["score"])
        self.assertIsNotNone(case_payload["reasoning"])
        self.assertIsNotNone(case_payload["finalAssessment"])


if __name__ == "__main__":
    unittest.main()
