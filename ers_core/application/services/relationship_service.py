from __future__ import annotations

from datetime import datetime

from ers_core.domain.models import Case, RelationshipEdge, RelationshipGraph, RelationshipNode, RelationshipSignal


class RelationshipService:
    def build_graph(self, case: Case, peer_cases: list[Case]) -> RelationshipGraph:
        nodes: dict[str, RelationshipNode] = {}
        edges: list[RelationshipEdge] = []
        signals: list[RelationshipSignal] = []

        case_node_id = f"case:{case.case_id}"
        person_node_id = f"person:{case.case_id}"
        self._add_node(nodes, RelationshipNode(case_node_id, f"Caso {case.case_id}", "Siniestro", "medium", {"caseId": case.case_id}))
        self._add_node(nodes, RelationshipNode(person_node_id, case.subject.full_name, "Persona", "medium", {"document": case.subject.document_number}))
        edges.append(RelationshipEdge(f"edge:{case_node_id}:subject", case_node_id, person_node_id, "titular", "medium", {}))

        if case.subject.phone:
            phone_node_id = f"phone:{self._sanitize(case.subject.phone)}"
            self._add_node(nodes, RelationshipNode(phone_node_id, case.subject.phone, "Cuenta", "high", {"type": "phone"}))
            edges.append(RelationshipEdge(f"edge:{person_node_id}:phone", person_node_id, phone_node_id, "usa telefono", "high", {}))

        if case.subject.address:
            address_node_id = f"address:{self._sanitize(case.subject.address)}"
            self._add_node(nodes, RelationshipNode(address_node_id, case.subject.address, "Familiar", "medium", {"type": "address"}))
            edges.append(RelationshipEdge(f"edge:{person_node_id}:address", person_node_id, address_node_id, "declara domicilio", "medium", {}))

        if case.labor_fiscal_info and case.labor_fiscal_info.employer_or_company:
            company = case.labor_fiscal_info.employer_or_company
            company_node_id = f"company:{self._sanitize(company)}"
            self._add_node(nodes, RelationshipNode(company_node_id, company, "Empresa", "medium", {"type": "company"}))
            edges.append(RelationshipEdge(f"edge:{person_node_id}:company", person_node_id, company_node_id, "vinculo empresa", "medium", {}))

        matching_phone_cases: list[str] = []
        matching_address_cases: list[str] = []
        matching_company_cases: list[str] = []

        for peer in peer_cases:
            if peer.case_id == case.case_id:
                continue

            peer_case_id = f"case:{peer.case_id}"
            peer_person_id = f"person:{peer.case_id}"

            same_phone = bool(case.subject.phone and peer.subject.phone and case.subject.phone == peer.subject.phone)
            same_address = bool(case.subject.address and peer.subject.address and case.subject.address == peer.subject.address)
            same_company = bool(
                case.labor_fiscal_info
                and peer.labor_fiscal_info
                and case.labor_fiscal_info.employer_or_company
                and case.labor_fiscal_info.employer_or_company == peer.labor_fiscal_info.employer_or_company
            )

            if not any([same_phone, same_address, same_company]):
                continue

            self._add_node(nodes, RelationshipNode(peer_case_id, f"Caso {peer.case_id}", "Siniestro", "high", {"caseId": peer.case_id}))
            self._add_node(nodes, RelationshipNode(peer_person_id, peer.subject.full_name, "Persona", "high", {"document": peer.subject.document_number}))
            edges.append(RelationshipEdge(f"edge:{peer_case_id}:subject", peer_case_id, peer_person_id, "titular", "medium", {}))

            if same_phone:
                matching_phone_cases.append(peer.case_id)
                phone_node_id = f"phone:{self._sanitize(case.subject.phone)}"
                edges.append(RelationshipEdge(f"edge:{peer_person_id}:phone", peer_person_id, phone_node_id, "coincidencia telefono", "critical", {}))
                edges.append(RelationshipEdge(f"edge:{case_node_id}:{peer_case_id}:phone", case_node_id, peer_case_id, "telefono compartido", "critical", {}))

            if same_address:
                matching_address_cases.append(peer.case_id)
                address_node_id = f"address:{self._sanitize(case.subject.address)}"
                edges.append(RelationshipEdge(f"edge:{peer_person_id}:address", peer_person_id, address_node_id, "coincidencia domicilio", "high", {}))
                edges.append(RelationshipEdge(f"edge:{case_node_id}:{peer_case_id}:address", case_node_id, peer_case_id, "domicilio compartido", "high", {}))

            if same_company:
                matching_company_cases.append(peer.case_id)
                company = case.labor_fiscal_info.employer_or_company
                company_node_id = f"company:{self._sanitize(company)}"
                edges.append(RelationshipEdge(f"edge:{peer_person_id}:company", peer_person_id, company_node_id, "coincidencia empresa", "medium", {}))
                edges.append(RelationshipEdge(f"edge:{case_node_id}:{peer_case_id}:company", case_node_id, peer_case_id, "empresa compartida", "medium", {}))

        if matching_phone_cases:
            signals.append(RelationshipSignal("PHONE_MATCH", "CRITICAL", "Se detecto coincidencia de telefono entre casos.", matching_phone_cases))
        if matching_address_cases:
            signals.append(RelationshipSignal("ADDRESS_MATCH", "WARNING", "Se detecto coincidencia de domicilio entre casos.", matching_address_cases))
        if matching_company_cases:
            signals.append(RelationshipSignal("COMPANY_MATCH", "WARNING", "Se detecto coincidencia de empresa entre casos.", matching_company_cases))

        reused_cases = sorted(set(matching_phone_cases + matching_address_cases + matching_company_cases))
        shared_dimensions = sum(
            1
            for item in [matching_phone_cases, matching_address_cases, matching_company_cases]
            if item
        )
        if len(reused_cases) >= 2 or (reused_cases and shared_dimensions >= 2):
            signals.append(
                RelationshipSignal(
                    "SUSPICIOUS_REUSE",
                    "CRITICAL",
                    "Se detecto reutilizacion sospechosa de atributos entre multiples casos.",
                    reused_cases,
                    {"sharedCases": len(reused_cases)},
                )
            )

        return RelationshipGraph(
            graph_id=f"RLG-{case.case_id}",
            generated_at=datetime.utcnow(),
            nodes=list(nodes.values()),
            edges=edges,
            signals=signals,
            metadata={"nodeCount": len(nodes), "edgeCount": len(edges)},
        )

    def _add_node(self, nodes: dict[str, RelationshipNode], node: RelationshipNode) -> None:
        nodes[node.node_id] = node

    def _sanitize(self, value: str) -> str:
        return (
            value.lower()
            .replace(" ", "-")
            .replace(".", "")
            .replace(",", "")
            .replace("/", "-")
        )
