from __future__ import annotations

import unittest

from tests.support import bootstrap_test_client, cleanup_test_dir, login


class ConfiguredRulesIntegrationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client, self.root = bootstrap_test_client()
        self.auth_headers = login(self.client, "admin", "Admin#123")

    def tearDown(self) -> None:
        self.client.close()
        cleanup_test_dir(self.root)

    def test_configured_rule_triggers_alert_for_internal_json_case(self) -> None:
        rule_response = self.client.post(
            "/admin/rules",
            headers=self.auth_headers,
            json={
                "name": "Monto alto con imagenes sospechosas",
                "category": "Carga JSON",
                "severity": "Alta",
                "status": "Activa",
                "source": "Panel admin",
                "description": "Alerta casos internos cuando el monto reclamado es alto y las imagenes fueron marcadas como sospechosas.",
                "ruleType": "json_high_amount_suspicious_images",
                "parameters": {
                    "amountThreshold": 250000,
                },
            },
        )

        self.assertEqual(201, rule_response.status_code)
        created_rule = rule_response.json()
        self.assertEqual("json_high_amount_suspicious_images", created_rule["ruleType"])

        case_response = self.client.post(
            "/cases/evaluate/internal-json",
            headers=self.auth_headers,
            json={
                "requestedBy": "usr-admin",
                "sourceChannel": "test-suite",
                "caseData": {
                    "identifier": "30111248",
                    "subject": {
                        "fullName": "Lorena Gomez",
                        "province": "Cordoba",
                        "verified": True,
                        "deceased": False,
                    },
                    "financialInfo": {
                        "creditScore": 590,
                        "debtRatio": 0.58,
                        "activeLoans": 3,
                        "bouncedChecks": 2,
                    },
                    "laborFiscalInfo": {
                        "taxStatus": "Responsable inscripto",
                        "mainActivity": "Servicios",
                        "declaredProvince": "Cordoba",
                    },
                    "claim": {
                        "claimReference": "SIN-TEST-ALERTA-01",
                        "claimDate": "2026-04-20",
                        "claimType": "Robo total",
                        "claimedAmount": 350000,
                        "previousClaimsCount": 1,
                        "customerAntiquityMonths": 14,
                        "suspiciousImages": True,
                        "repeatedProvider": False,
                    },
                    "inconsistencies": [],
                    "missingEvidence": [],
                },
            },
        )

        self.assertEqual(200, case_response.status_code)
        case_payload = case_response.json()

        detail_response = self.client.get(f"/cases/{case_payload['caseId']}", headers=self.auth_headers)
        self.assertEqual(200, detail_response.status_code)
        detail_payload = detail_response.json()

        alert_titles = [item["title"] for item in detail_payload["alerts"]]
        self.assertIn("Monto alto con imagenes sospechosas", alert_titles)
        self.assertEqual(True, detail_payload["status"] in {"ready_for_reasoning", "scored"})


if __name__ == "__main__":
    unittest.main()
