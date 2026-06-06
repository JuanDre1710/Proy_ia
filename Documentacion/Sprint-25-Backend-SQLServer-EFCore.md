# Sprint 25 - Backend SQL Server EF Core

## Objetivo

Agregar un componente real de infraestructura para SQL Server usando Entity Framework Core, sin acoplar el dominio operativo del proyecto Python a EF Core.

## Resultado del sprint

Se creó el componente .NET:

- `Ers.SqlServerAdapter`

Estructura implementada:

- `Contracts`
- `Infrastructure/Persistence`
- `Infrastructure/Persistence/Configurations`
- `Infrastructure/DataAccess/Providers`

## Configuración EF Core

Se agregó el registro de `DbContext` en:

- `Infrastructure/Persistence/ServiceCollectionExtensions.cs`

Uso:

```csharp
services.AddDevelopmentSqlServerPersistence(cfg);
```

Internamente registra:

```csharp
options.UseSqlServer(cfg.GetConnectionString("DefaultConnection"));
```

## Tablas mapeadas

- `EXT_CLIENTES`
- `POLIZAS`
- `PZA_VIGENCIAS`
- `POLIZAS_SINIESTROS`
- `SINIESTROS`

## Relaciones configuradas

- `POLIZAS.CLI_IDTITULAR -> EXT_CLIENTES.CLI_ID`
- `PZA_VIGENCIAS.PZA_NROSOL -> POLIZAS.PZA_NROSOL`
- `POLIZAS_SINIESTROS.PZA_NROSOL -> POLIZAS.PZA_NROSOL`
- `POLIZAS_SINIESTROS.CLI_ID -> EXT_CLIENTES.CLI_ID`
- `SINIESTROS.PSI_ID -> POLIZAS_SINIESTROS.PSI_ID`

## Claves usadas en el mapeo

Las siguientes claves quedaron definidas por la información disponible del sprint:

- `EXT_CLIENTES`
  - PK usada: `CLI_ID`
- `POLIZAS`
  - PK usada: `PZA_NROSOL`
- `PZA_VIGENCIAS`
  - PK usada: compuesta `PZA_NROSOL + PVI_NROPOL + PVI_NROCER`
  - motivo: no había PK confirmada por esquema y esos campos identifican la vigencia/póliza visible para UI
- `POLIZAS_SINIESTROS`
  - PK usada: `PSI_ID`
  - motivo: es la clave de vínculo conocida con `SINIESTROS`
- `SINIESTROS`
  - PK usada: `SIN_ID`

## Campos de trazabilidad

Campos tratados como trazabilidad o lookup operativo, no como features de análisis:

- `CLI_ID`
- `CLI_IDENTE`
- `CLI_NRODOC`
- `CLI_CUITL`
- `PZA_NROSOL`
- `PSI_ID`
- `SIN_ID`
- `SIN_NUMERO`
- `PVI_NROPOL`
- `PVI_NROCER`

## Campos útiles para análisis o selección operativa

- `CLI_APELLIDO`
- `CLI_NOMBRE`
- `CLI_RAZONSOCIAL`
- `CLI_EMAIL`
- `SIN_FECHAHORA`
- `SIN_IMPORTE`
- `SIN_IMP_RECLAMO`
- `VDO_IDESTADO_SIN`
- `TSI_ID`
- `PZA_FECALTA`
- `PZA_ESTADO`
- `PVI_PREMIO`
- `PSI_ESTADO`

## Provider desacoplado

Se implementó:

- `SqlServerIdentityClaimProvider`

Expone tres contratos:

- `IPersonSearchProvider`
- `IClaimQueryProvider`
- `ICaseDataProvider`

Así el resto del sistema no necesita consumir entidades EF directamente.

## Estado de verificación

Verificado en este sprint:

- el componente .NET fue creado
- EF Core y SQL Server quedaron configurados
- el `DbContext` compila
- el provider compila
- las configuraciones de entidades compilan

Pendiente para cerrar conexión operativa contra la base de desarrollo:

- cargar la cadena real en `ConnectionStrings:DefaultConnection`
- inspeccionar el esquema real para validar PK exactas de `PZA_VIGENCIAS` y `POLIZAS_SINIESTROS`
- validar tipos y longitudes reales contra SQL Server
- ejecutar pruebas contra la base dev accesible

## Archivos principales

- `Ers.SqlServerAdapter/Ers.SqlServerAdapter.csproj`
- `Ers.SqlServerAdapter/Infrastructure/Persistence/DevelopmentClaimsDbContext.cs`
- `Ers.SqlServerAdapter/Infrastructure/Persistence/Configurations/*`
- `Ers.SqlServerAdapter/Infrastructure/DataAccess/Providers/SqlServerIdentityClaimProvider.cs`
- `Ers.SqlServerAdapter/appsettings.example.json`

