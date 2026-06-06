from __future__ import annotations

import unittest

from ers_core.application.services.tabular_scoring_service import ScoringFeatures, TabularScoringService
from ia_fraude.modelos.demo_internal_scoring_service import (
    DemoInternalScoringService,
    DemoScoringRequest,
    DemoScoringResponse,
    DemoScoringServiceError,
)


class DemoInternalScoringServiceTests(unittest.TestCase):
    def test_predict_returns_expected_contract(self) -> None:
        service = DemoInternalScoringService()

        response = service.predict(
            DemoScoringRequest(
                monto_reclamado=220000,
                cantidad_siniestros_previos=2,
                debt_ratio=0.61,
                bounced_checks=1,
                antiguedad_como_cliente_meses=4,
                zona_de_riesgo=True,
                imagenes_sospechosas=False,
                telefono_repetido_con_otro_cliente=True,
                proveedor_repetido=False,
                historial_fraude_confirmado=False,
                credit_score=430,
            )
        )

        self.assertIsInstance(response, DemoScoringResponse)
        self.assertGreaterEqual(response.score, 0.0)
        self.assertLessEqual(response.score, 100.0)
        self.assertTrue(response.risk_class)
        self.assertGreaterEqual(response.confidence, 0.0)
        self.assertLessEqual(response.confidence, 1.0)
        self.assertIsInstance(response.top_factors, list)
        self.assertTrue(response.model_name)
        self.assertTrue(response.model_version)

    def test_predict_rejects_invalid_numeric_feature(self) -> None:
        service = DemoInternalScoringService()

        with self.assertRaises(DemoScoringServiceError):
            service.predict(
                DemoScoringRequest(
                    monto_reclamado=float("nan"),
                    cantidad_siniestros_previos=1,
                    debt_ratio=0.2,
                    bounced_checks=0,
                    antiguedad_como_cliente_meses=12,
                    zona_de_riesgo=False,
                    imagenes_sospechosas=False,
                    telefono_repetido_con_otro_cliente=False,
                    proveedor_repetido=False,
                    historial_fraude_confirmado=False,
                    credit_score=600,
                )
            )


class FailingScoringService:
    def predict(self, request: DemoScoringRequest) -> DemoScoringResponse:
        raise DemoScoringServiceError("forced failure")

    def model_info(self) -> dict[str, str]:
        raise DemoScoringServiceError("forced failure")


class TabularScoringServiceFallbackTests(unittest.TestCase):
    def test_predict_falls_back_to_heuristic_response(self) -> None:
        service = TabularScoringService(scoring_service=FailingScoringService())
        features = ScoringFeatures(
            monto_reclamado=180000,
            cantidad_siniestros_previos=3,
            debt_ratio=0.6,
            bounced_checks=2,
            antiguedad_como_cliente_meses=2,
            zona_de_riesgo=True,
            imagenes_sospechosas=True,
            telefono_repetido_con_otro_cliente=True,
            proveedor_repetido=False,
            historial_fraude_confirmado=False,
            credit_score=450,
        )

        prediction = service.predict(features)

        self.assertIn("score", prediction)
        self.assertIn("riskClass", prediction)
        self.assertIn("confidence", prediction)
        self.assertIn("topFactors", prediction)


if __name__ == "__main__":
    unittest.main()
