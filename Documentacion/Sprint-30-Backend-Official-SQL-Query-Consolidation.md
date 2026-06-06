# Sprint 30 - Consolidacion sobre query SQL oficial

## Objetivo

Tomar la query SQL base de la base real de desarrollo como fuente funcional oficial para:

- busqueda por identidad
- listado de siniestros
- seleccion de siniestro
- armado del `CaseModel`

El backend .NET pasa a concentrar este flujo como backend operativo principal para dashboard y analisis sobre SQL Server.

## Criterio de implementacion

Se reemplazo el acceso fragmentado por varias queries parciales por una sola fuente SQL oficial por siniestro en:

- `Ers.SqlServerAdapter/Infrastructure/DataAccess/Providers/SqlServerIdentityClaimProvider.cs`
- `Ers.SqlServerAdapter/Infrastructure/Persistence/Queries/OfficialClaimSearchRow.cs`

La query consolidada mantiene como columna de granularidad principal:

- `SINIESTROS.SIN_ID` como clave unica del siniestro

Sobre ese rowset se derivan:

1. busqueda de persona por identidad
2. listado de siniestros por cliente
3. armado del caso desde un siniestro seleccionado

## Criterios de joins y deduplicacion

### Domicilio activo

Tabla:

- `EXT_CLIENTES_DOMICILIO`

Criterio:

- se considera domicilio activo cuando `ECD_ESTADO = 1`
- si existen multiples domicilios activos para el mismo cliente, se toma uno de forma explicita con `TOP (1) ... ORDER BY ECD_ID DESC`

Razon:

- evita duplicar filas del siniestro por relaciones 1:N en domicilios
- mantiene un criterio deterministico y documentado

### Vigencia de poliza

Tabla:

- `PZA_VIGENCIAS`

Criterio:

- si existen multiples vigencias para la misma propuesta, se toma una sola con `TOP (1)`
- orden de preferencia:
  - `ISNULL(PVI_FECFINVIG, PVI_FECINIVIG) DESC`
  - `PVI_ID DESC`

Razon:

- evita multiplicar filas por historico de vigencias
- privilegia la vigencia mas reciente disponible sin perder trazabilidad

### Vinculo poliza-siniestro

Tabla:

- `POLIZAS_SINIESTROS`

Criterio:

- el rowset operativo queda anclado a `PSI_ID + SIN_ID`
- el caso y la lista de siniestros se deduplican por `SIN_ID`

Razon:

- el siniestro es la unidad operativa que luego se selecciona para analisis
- `PSI_ID` y `PVI_ID` se conservan para trazabilidad interna

## Criterio para conjunto de siniestros devueltos

En esta etapa se devuelven los siniestros historicos del cliente presentes en la base que cumplen:

- existe relacion `POLIZAS_SINIESTROS`
- existe `SINIESTROS.SIN_ID`

No se afirma todavia una nocion final de “activo” basada en negocio profundo.
Para seleccion y dashboard se devuelve el conjunto asociado real y luego el backend decide el caso seleccionado explicitamente.

## Criterio para construir un caso unico

Un `CaseModel` se construye a partir de:

- `claimId = SIN_ID`

Ese `claimId` determina de forma unica:

- cliente
- domicilio activo elegido
- propuesta/poliza
- vigencia preferida
- vinculo poliza-siniestro
- siniestro seleccionado

El `CaseModel` interno ahora consolida:

- identidad basica del cliente
- domicilio activo
- datos de propuesta/poliza
- datos de vigencia
- datos del siniestro seleccionado
- claves internas de trazabilidad
- historial minimo del cliente para features operativas

## Modelos ajustados

Se enriquecieron los contratos internos en:

- `Ers.SqlServerAdapter/Contracts/IdentitySearchContracts.cs`
- `Ers.SqlServerApi/Application/CaseModel.cs`
- `Ers.SqlServerApi/Application/CaseAssemblyDtos.cs`
- `Ers.SqlServerApi/Application/IdentitySearchDtos.cs`

Principales agregados:

- fecha de nacimiento
- direccion/localidad/provincia
- tipo de persona / sexo / estado civil / actividad / estado cliente / flag PEP
- propuesta
- vigencia inicio/fin/estado
- premio calculado
- ids de trazabilidad (`PSI_ID`, `PVI_ID`, propuesta)

## Compatibilidad con frontend

No se exponen filas SQL crudas al frontend.

El frontend sigue consumiendo:

- busqueda por identidad
- lista de siniestros
- dashboard del caso

pero ahora el backend .NET prepara contratos estables y deja a SQL Server como fuente de verdad para este flujo.

## Verificacion

- `dotnet build Ers.SqlServerApi.csproj -v minimal`

## Riesgos / puntos a validar con base real

1. Confirmar que `EXT_CLIENTES_DOMICILIO.ECD_ID` existe en todos los ambientes.
2. Confirmar con negocio si el criterio de vigencia preferida debe refinarse.
3. Confirmar si el conjunto devuelto para seleccion debe filtrarse luego por estados de siniestro considerados relevantes.

## Siguiente paso recomendado

1. Revalidar en runtime la query consolidada con varios DNI/CUIT reales.
2. Ajustar la definicion operativa de siniestro relevante/activo.
3. Completar persistencia de decisiones y exportaciones para que el backend SQL sea duenio completo del flujo.
