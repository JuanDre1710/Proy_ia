from __future__ import annotations

import unittest

from tests.support import bootstrap_test_client, cleanup_test_dir, login


class IdentitySearchApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client, cls.root = bootstrap_test_client()
        cls.headers = login(cls.client, "supervisor", "Super#123")

    @classmethod
    def tearDownClass(cls) -> None:
        cls.client.close()
        cleanup_test_dir(cls.root)

    def test_identity_search_returns_not_found(self) -> None:
        response = self.client.post(
            "/identity/search",
            json={"identifier": "30111999", "requestedBy": "usr-supervisor", "sourceChannel": "qa"},
            headers=self.headers,
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("not_found", payload["searchStatus"])
        self.assertEqual([], payload["activeClaims"])
        self.assertFalse(payload["canAutoAnalyze"])

    def test_identity_search_returns_no_active_claims(self) -> None:
        response = self.client.post(
            "/identity/search",
            json={"identifier": "30111297", "requestedBy": "usr-supervisor", "sourceChannel": "qa"},
            headers=self.headers,
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("person_without_active_claims", payload["searchStatus"])
        self.assertEqual("Luciana Perez", payload["person"]["displayName"])
        self.assertEqual([], payload["activeClaims"])
        self.assertEqual(1, payload["totalClaims"])

    def test_identity_search_returns_multiple_active_claims(self) -> None:
        response = self.client.post(
            "/identity/search",
            json={"identifier": "30111205", "requestedBy": "usr-supervisor", "sourceChannel": "qa"},
            headers=self.headers,
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("multiple_active_claims", payload["searchStatus"])
        self.assertEqual(2, len(payload["activeClaims"]))
        self.assertTrue(payload["requiresClaimSelection"])
        self.assertFalse(payload["canAutoAnalyze"])

    def test_case_can_be_assembled_from_selected_claim(self) -> None:
        search_response = self.client.post(
            "/identity/search",
            json={"identifier": "27123456789", "requestedBy": "usr-supervisor", "sourceChannel": "qa"},
            headers=self.headers,
        )
        self.assertEqual(200, search_response.status_code)
        search_payload = search_response.json()
        self.assertEqual("single_active_claim", search_payload["searchStatus"])
        claim_id = search_payload["activeClaims"][0]["claimId"]

        assemble_response = self.client.post(
            "/identity/cases/from-claim",
            json={"claimId": claim_id, "requestedBy": "usr-supervisor", "sourceChannel": "qa"},
            headers=self.headers,
        )
        self.assertEqual(200, assemble_response.status_code)
        assemble_payload = assemble_response.json()
        self.assertEqual(claim_id, assemble_payload["claimId"])
        self.assertTrue(assemble_payload["canOpenDashboard"])

        case_detail = self.client.get(f"/cases/{assemble_payload['caseId']}", headers=self.headers)
        self.assertEqual(200, case_detail.status_code)
        detail_payload = case_detail.json()
        self.assertGreaterEqual(len(detail_payload["claimsHistory"]), 1)
        self.assertEqual(claim_id, detail_payload["metadata"]["selectedClaimId"])
        self.assertEqual("scored", detail_payload["status"])


if __name__ == "__main__":
    unittest.main()
