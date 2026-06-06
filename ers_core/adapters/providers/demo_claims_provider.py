from __future__ import annotations

from copy import deepcopy

from ers_core.domain.identity_search_models import (
    CaseAssemblyPayload,
    ClaimRecord,
    IdentitySearchQuery,
    PersonSearchRecord,
)


_DEMO_ROWS = [
    {
        "person": {
            "person_id": "CLI-1001",
            "identifier_value": "27123456789",
            "identifier_type": "CUIL",
            "document_type": "DNI",
            "document_number": "30111222",
            "tax_id": "27123456789",
            "display_name": "Marcela Quiroga",
            "email": "marcela.quiroga@demo.local",
            "metadata": {
                "cliId": "CLI-1001",
                "cliIdente": "MQ-001",
                "vdoTipoDoc": "DNI",
            },
        },
        "claims": [
            {
                "claim_id": "SIN-1001-A",
                "person_id": "CLI-1001",
                "claim_number": "SIN-2026-00045",
                "occurred_at": "2026-03-28T10:15:00",
                "status_code": "IN_REVIEW",
                "status_label": "En revision",
                "claimed_amount": 185000.0,
                "estimated_amount": 172500.0,
                "claim_type_id": "ROBO_PARCIAL",
                "policy_number": "PZA-440011",
                "certificate_number": "CERT-01",
                "is_active_hint": True,
                "metadata": {
                    "counterpart": "Taller Centro",
                    "notes": "Proveedor repetido en dos expedientes recientes.",
                },
            },
            {
                "claim_id": "SIN-1001-B",
                "person_id": "CLI-1001",
                "claim_number": "SIN-2025-11991",
                "occurred_at": "2025-12-10T08:45:00",
                "status_code": "CLOSED",
                "status_label": "Cerrado",
                "claimed_amount": 42000.0,
                "estimated_amount": 39800.0,
                "claim_type_id": "DANOS_PARCIALES",
                "policy_number": "PZA-440011",
                "certificate_number": "CERT-01",
                "is_active_hint": False,
                "metadata": {
                    "counterpart": "Aseguradora tercerizada",
                    "notes": "Caso previo cerrado sin observaciones.",
                },
            },
        ],
        "case_payloads": {
            "SIN-1001-A": {
                "identifier": "27123456789",
                "subject": {
                    "fullName": "Marcela Quiroga",
                    "birthDate": "1986-09-14",
                    "age": 39,
                    "email": "marcela.quiroga@demo.local",
                    "phone": "+54 9 351 555 1010",
                    "address": "Av. Colon 1450",
                    "locality": "Cordoba",
                    "province": "Cordoba",
                    "verified": True,
                    "deceased": False,
                },
                "financialInfo": {
                    "creditScore": 612,
                    "debtRatio": 0.46,
                    "bancarizationLevel": "Media",
                    "activeLoans": 2,
                    "bouncedChecks": 1,
                    "monthlyIncomeEstimate": "900000-1200000",
                    "observation": "Cliente con actividad bancaria regular.",
                },
                "laborFiscalInfo": {
                    "taxStatus": "Monotributo",
                    "mainActivity": "Comercio minorista",
                    "employerOrCompany": "MQ Hogar",
                    "incomeBracket": "Medio",
                    "registeredEmployees": 1,
                    "fiscalObservation": "Actividad consistente con la declaracion del siniestro.",
                    "declaredProvince": "Cordoba",
                },
                "claim": {
                    "claimReference": "SIN-2026-00045",
                    "claimDate": "2026-03-28",
                    "claimType": "Robo parcial",
                    "claimedAmount": 185000.0,
                    "previousClaimsCount": 1,
                    "customerAntiquityMonths": 28,
                    "suspiciousImages": False,
                    "sharedPhoneWithOtherCustomer": False,
                    "repeatedProvider": True,
                    "confirmedFraudHistory": False,
                    "highRiskZone": False,
                    "notes": "Caso demo armado desde busqueda por identidad.",
                },
                "inconsistencies": ["La factura adjunta no tiene validacion definitiva."],
                "missingEvidence": ["Falta informe pericial final."],
                "evidenceForReview": ["Proveedor repetido en dos siniestros recientes."],
                "evidenceAgainstFraud": ["Identidad y domicilio consistentes en el sistema core."],
            }
        },
    },
    {
        "person": {
            "person_id": "CLI-1002",
            "identifier_value": "30111205",
            "identifier_type": "DNI",
            "document_type": "DNI",
            "document_number": "30111205",
            "tax_id": "27301112058",
            "display_name": "Carlos Ferreyra",
            "email": "carlos.ferreyra@demo.local",
            "metadata": {
                "cliId": "CLI-1002",
                "cliIdente": "CF-002",
                "vdoTipoDoc": "DNI",
            },
        },
        "claims": [
            {
                "claim_id": "SIN-1002-A",
                "person_id": "CLI-1002",
                "claim_number": "SIN-2026-00072",
                "occurred_at": "2026-03-30T11:00:00",
                "status_code": "OPEN",
                "status_label": "Abierto",
                "claimed_amount": 92000.0,
                "estimated_amount": 84000.0,
                "claim_type_id": "DANOS_TOTALES",
                "policy_number": "PZA-550210",
                "certificate_number": "CERT-03",
                "is_active_hint": True,
                "metadata": {
                    "counterpart": "Taller Norte",
                    "notes": "Primer siniestro activo.",
                },
            },
            {
                "claim_id": "SIN-1002-B",
                "person_id": "CLI-1002",
                "claim_number": "SIN-2026-00079",
                "occurred_at": "2026-03-31T17:25:00",
                "status_code": "PENDING_ANALYSIS",
                "status_label": "Pendiente de analisis",
                "claimed_amount": 148000.0,
                "estimated_amount": 146500.0,
                "claim_type_id": "ROBO_TOTAL",
                "policy_number": "PZA-550210",
                "certificate_number": "CERT-03",
                "is_active_hint": True,
                "metadata": {
                    "counterpart": "Estudio Rivero",
                    "notes": "Segundo siniestro activo.",
                },
            },
            {
                "claim_id": "SIN-1002-C",
                "person_id": "CLI-1002",
                "claim_number": "SIN-2025-11420",
                "occurred_at": "2025-11-02T14:00:00",
                "status_code": "CLOSED",
                "status_label": "Cerrado",
                "claimed_amount": 51000.0,
                "estimated_amount": 50000.0,
                "claim_type_id": "CRISTALES",
                "policy_number": "PZA-550210",
                "certificate_number": "CERT-03",
                "is_active_hint": False,
                "metadata": {
                    "counterpart": "Cristales Sur",
                    "notes": "Caso historico cerrado.",
                },
            },
        ],
        "case_payloads": {
            "SIN-1002-A": {
                "identifier": "30111205",
                "subject": {
                    "fullName": "Carlos Ferreyra",
                    "birthDate": "1984-11-03",
                    "age": 41,
                    "email": "carlos.ferreyra@demo.local",
                    "phone": "+54 9 351 555 2020",
                    "address": "Fragueiro 210",
                    "locality": "Cordoba",
                    "province": "Cordoba",
                    "verified": True,
                    "deceased": False,
                },
                "financialInfo": {
                    "creditScore": 545,
                    "debtRatio": 0.58,
                    "bancarizationLevel": "Media",
                    "activeLoans": 3,
                    "bouncedChecks": 1,
                    "monthlyIncomeEstimate": "700000-900000",
                    "observation": "Multiples expedientes abiertos en ventana corta.",
                },
                "laborFiscalInfo": {
                    "taxStatus": "Responsable inscripto",
                    "mainActivity": "Logistica",
                    "employerOrCompany": "CF Transportes",
                    "incomeBracket": "Medio",
                    "registeredEmployees": 4,
                    "fiscalObservation": "Actividad consistente.",
                    "declaredProvince": "Cordoba",
                },
                "claim": {
                    "claimReference": "SIN-2026-00072",
                    "claimDate": "2026-03-30",
                    "claimType": "Danos totales",
                    "claimedAmount": 92000.0,
                    "previousClaimsCount": 2,
                    "customerAntiquityMonths": 46,
                    "suspiciousImages": False,
                    "sharedPhoneWithOtherCustomer": False,
                    "repeatedProvider": False,
                    "confirmedFraudHistory": False,
                    "highRiskZone": True,
                    "notes": "Seleccion manual requerida cuando hay multiples activos.",
                },
                "inconsistencies": [],
                "missingEvidence": [],
                "evidenceForReview": ["Tiene otro siniestro activo pendiente de analisis."],
                "evidenceAgainstFraud": ["Historial previo con un cierre regular."],
            },
            "SIN-1002-B": {
                "identifier": "30111205",
                "subject": {
                    "fullName": "Carlos Ferreyra",
                    "birthDate": "1984-11-03",
                    "age": 41,
                    "email": "carlos.ferreyra@demo.local",
                    "phone": "+54 9 351 555 2020",
                    "address": "Fragueiro 210",
                    "locality": "Cordoba",
                    "province": "Cordoba",
                    "verified": True,
                    "deceased": False,
                },
                "financialInfo": {
                    "creditScore": 533,
                    "debtRatio": 0.62,
                    "bancarizationLevel": "Media",
                    "activeLoans": 3,
                    "bouncedChecks": 2,
                    "monthlyIncomeEstimate": "700000-900000",
                    "observation": "Endeudamiento y recurrencia de siniestros por encima del promedio.",
                },
                "laborFiscalInfo": {
                    "taxStatus": "Responsable inscripto",
                    "mainActivity": "Logistica",
                    "employerOrCompany": "CF Transportes",
                    "incomeBracket": "Medio",
                    "registeredEmployees": 4,
                    "fiscalObservation": "No se detectan inconsistencias fiscales fuertes.",
                    "declaredProvince": "Cordoba",
                },
                "claim": {
                    "claimReference": "SIN-2026-00079",
                    "claimDate": "2026-03-31",
                    "claimType": "Robo total",
                    "claimedAmount": 148000.0,
                    "previousClaimsCount": 2,
                    "customerAntiquityMonths": 46,
                    "suspiciousImages": True,
                    "sharedPhoneWithOtherCustomer": True,
                    "repeatedProvider": True,
                    "confirmedFraudHistory": False,
                    "highRiskZone": True,
                    "notes": "Siniestro con mayor criticidad potencial.",
                },
                "inconsistencies": ["El telefono aparece asociado a otro expediente abierto."],
                "missingEvidence": ["Falta validacion documental del proveedor."],
                "evidenceForReview": ["Existe recurrencia de siniestros en 48 horas."],
                "evidenceAgainstFraud": [],
            },
        },
    },
    {
        "person": {
            "person_id": "CLI-1003",
            "identifier_value": "30111297",
            "identifier_type": "DNI",
            "document_type": "DNI",
            "document_number": "30111297",
            "tax_id": "27301112971",
            "display_name": "Luciana Perez",
            "email": "luciana.perez@demo.local",
            "metadata": {
                "cliId": "CLI-1003",
                "cliIdente": "LP-003",
                "vdoTipoDoc": "DNI",
            },
        },
        "claims": [
            {
                "claim_id": "SIN-1003-A",
                "person_id": "CLI-1003",
                "claim_number": "SIN-2025-10981",
                "occurred_at": "2025-10-21T09:10:00",
                "status_code": "CLOSED",
                "status_label": "Cerrado",
                "claimed_amount": 38000.0,
                "estimated_amount": 37500.0,
                "claim_type_id": "GRANIZO",
                "policy_number": "PZA-111221",
                "certificate_number": "CERT-02",
                "is_active_hint": False,
                "metadata": {
                    "counterpart": "Taller Sud",
                    "notes": "Sin siniestros activos.",
                },
            }
        ],
        "case_payloads": {},
    },
]


class DemoClaimsProvider:
    def __init__(self) -> None:
        self._rows = deepcopy(_DEMO_ROWS)

    def search_person(self, query: IdentitySearchQuery) -> PersonSearchRecord | None:
        normalized = query.normalized_identifier
        for row in self._rows:
            person = row["person"]
            if normalized in {
                str(person.get("document_number") or ""),
                str(person.get("tax_id") or ""),
                str(person.get("identifier_value") or ""),
            }:
                return PersonSearchRecord(**person)
        return None

    def list_claims_by_person(self, person_id: str) -> list[ClaimRecord]:
        for row in self._rows:
            if row["person"]["person_id"] == person_id:
                return [ClaimRecord(**item) for item in row["claims"]]
        return []

    def build_case_payload(self, claim_id: str) -> CaseAssemblyPayload | None:
        for row in self._rows:
            payload = row["case_payloads"].get(claim_id)
            if payload is None:
                continue
            claims = [ClaimRecord(**item) for item in row["claims"]]
            claim_history = [
                {
                    "id": item.claim_id,
                    "date": (item.occurred_at or "")[:10] or "N/D",
                    "type": self._claim_type_label(item.claim_type_id),
                    "amount": float(item.claimed_amount or 0.0),
                    "status": self._history_status(item.status_code),
                    "counterpart": str(item.metadata.get("counterpart") or "N/D"),
                    "notes": str(item.metadata.get("notes") or ""),
                }
                for item in claims
            ]
            enriched_payload = deepcopy(payload)
            enriched_payload["claimsHistory"] = claim_history
            enriched_payload["caseContext"] = {
                "personId": row["person"]["person_id"],
                "selectedClaimId": claim_id,
                "totalClaims": len(claims),
            }
            return CaseAssemblyPayload(
                claim_id=claim_id,
                person_id=row["person"]["person_id"],
                payload=enriched_payload,
            )
        return None

    def _claim_type_label(self, claim_type_id: str | None) -> str:
        mapping = {
            "ROBO_PARCIAL": "Robo parcial",
            "ROBO_TOTAL": "Robo total",
            "DANOS_TOTALES": "Danos totales",
            "DANOS_PARCIALES": "Danos parciales",
            "CRISTALES": "Cristales",
            "GRANIZO": "Granizo",
        }
        if claim_type_id is None:
            return "Sin tipo"
        return mapping.get(claim_type_id, claim_type_id.replace("_", " ").title())

    def _history_status(self, status_code: str) -> str:
        normalized = status_code.upper()
        if normalized == "CLOSED":
            return "Aprobado"
        if normalized in {"OPEN", "IN_REVIEW", "PENDING_ANALYSIS"}:
            return "Observado"
        return "Rechazado"

