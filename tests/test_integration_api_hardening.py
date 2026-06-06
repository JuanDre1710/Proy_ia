from __future__ import annotations

import unittest

from tests.support import bootstrap_test_client, cleanup_test_dir, login


class ApiHardeningIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client, cls.root = bootstrap_test_client()
        cls.evaluator_headers = login(cls.client, "evaluador", "Eval#123")

    @classmethod
    def tearDownClass(cls) -> None:
        cls.client.close()
        cleanup_test_dir(cls.root)

    def test_validation_errors_have_standard_shape(self) -> None:
        response = self.client.post("/cases/evaluate", json={"identifier": "", "requestedBy": "", "sourceChannel": "test"})
        self.assertEqual(422, response.status_code)
        payload = response.json()
        self.assertEqual("validation_error", payload["error"]["code"])
        self.assertTrue(payload["error"]["requestId"])

    def test_audit_logs_require_privileged_role(self) -> None:
        response = self.client.get("/audit/logs", headers=self.evaluator_headers)
        self.assertEqual(403, response.status_code)
        self.assertEqual("Insufficient permissions.", response.json()["error"]["message"])


if __name__ == "__main__":
    unittest.main()
