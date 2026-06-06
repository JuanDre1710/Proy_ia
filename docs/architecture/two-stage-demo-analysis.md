# Two-Stage Demo Analysis

La demo queda separada en dos instancias de analisis:

1. `instance_1_internal`
   Consume solo datos internos del sistema core o de una carga manual equivalente.
   Usa el modelo canonico `Case`, reglas duras, reasoning demo, scoring tabular, relaciones y auditoria.

2. `instance_2_conditional_enrichment`
   No se ejecuta automaticamente en esta etapa.
   Queda reservada para futuras consultas complementarias como identidad ampliada, perfil crediticio o datos fiscales externos.

## Endpoint demo

`POST /cases/evaluate/internal-json`

Permite cargar un caso interno completo como JSON. El endpoint:

- valida identificador y actor solicitante
- mapea el JSON al modelo canonico
- persiste el caso
- ejecuta reglas, reasoning, scoring, relaciones y assessment final
- deja trazabilidad de que la corrida corresponde a la instancia 1

## Frontend

La pantalla `Carga JSON` permite subir un `.txt` o `.json` con el mismo contrato del endpoint.

Archivo de ejemplo:

`docs/demo/internal-case-upload-sample.txt`

## Alcance demo

- no consulta providers externos
- no intenta reemplazar aun el core legacy real
- deja metadatos para decidir enrichment condicional mas adelante
