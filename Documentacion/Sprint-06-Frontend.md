# Sprint 06 - Frontend

## Dirigido a
Frontend del sistema ERS (React + TypeScript + Vite + MUI).

## Objetivo del sprint
Agregar una red de relaciones sospechosas al dashboard del caso para visualizar vinculos relevantes entre personas, empresas, siniestros y terceros con una version MVP clara y escalable.

## Alcance implementado
- Nuevo bloque reusable de relaciones sospechosas dentro del feature `cases`.
- Visualizacion SVG liviana sin librerias pesadas de grafos.
- Seleccion de nodos y drawer lateral de detalle.
- Leyenda por tipo de nodo y severidad.
- Arquitectura preparada para futura migracion a React Flow o similar.

## Componentes implementados
- `RelationshipGraphCard`
- `RelationshipGraphCanvas`
- `RelationshipNodeDetailDrawer`
- `GraphLegend`

## Tipos agregados
- `GraphNode`
- `GraphEdge`
- `NodeType`
- `RelationshipSeverity`

## Helpers agregados
- `getRiskColor`
- `getNodeTypeColor`
- `getNodePosition`

## Estructura impactada
```text
ers-frontend/
  src/
    features/
      cases/
        components/
          RelationshipGraphCard.tsx
          RelationshipGraphCanvas.tsx
          RelationshipNodeDetailDrawer.tsx
          GraphLegend.tsx
        helpers/
          relationshipGraph.ts
    models/
      cases.ts
    mocks/
      casesMock.ts
```

## Escenarios mock representados
- persona conectada a taller repetido
- abogado compartido
- siniestro previo sospechoso
- vinculo societario
- relacion familiar o comercial

## Decisiones tecnicas
- Se eligio SVG manual en lugar de D3 o React Flow para mantener el MVP simple, entendible y liviano.
- Las posiciones de nodos viven en `metadata` mock para esta etapa, facilitando una futura migracion a un layout dinamico.
- El contrato `GraphNode` / `GraphEdge` ya deja preparado el dominio para una libreria de grafos posterior.
- El estado UI de seleccion queda encapsulado en `RelationshipGraphCard`.

## Uso rapido
1. Abrir `/search`
2. Buscar `30111222` para ver el grafo mas completo
3. Entrar al dashboard del caso en `/cases/30111222`
4. Seleccionar nodos en la red para abrir el drawer lateral

## Validacion realizada
- `npm.cmd run build`
