# Ers.SqlServerAdapter

Componente .NET aislado para acceso a SQL Server con EF Core, sin acoplar el dominio operativo del proyecto Python.

## Estructura

- `Contracts`
- `Infrastructure/Persistence`
- `Infrastructure/Persistence/Configurations`
- `Infrastructure/DataAccess/Providers`

## Registro

```csharp
services.AddDevelopmentSqlServerPersistence(cfg);
```

La extension usa:

```csharp
options.UseSqlServer(cfg.GetConnectionString("DefaultConnection"));
```

## Pendiente para conectar

- Definir `ConnectionStrings:DefaultConnection`
- Confirmar las PK reales de `PZA_VIGENCIAS` y `POLIZAS_SINIESTROS` si el esquema difiere
- Ejecutar una inspeccion directa del esquema para validar precision de tipos y longitudes
