IF OBJECT_ID('dbo.AF_MONITORED_CASES', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AF_MONITORED_CASES (
        CASE_ID uniqueidentifier NOT NULL CONSTRAINT PK_AF_MONITORED_CASES PRIMARY KEY,
        SIN_ID bigint NOT NULL,
        CLI_ID bigint NULL,
        CLIENT_DISPLAY_NAME nvarchar(200) NULL,
        PZA_NROSOL nvarchar(50) NULL,
        PVI_ID nvarchar(50) NULL,
        PSI_ID nvarchar(50) NULL,
        NRO_SINIESTRO nvarchar(80) NULL,
        NRO_POLIZA nvarchar(80) NULL,
        NRO_CERTIFICADO nvarchar(80) NULL,
        FECHA_SINIESTRO datetime2 NULL,
        MONTO_RECLAMO decimal(18,2) NULL,
        MONTO_PAGADO decimal(18,2) NULL,
        SCORE float NOT NULL,
        NIVEL_RIESGO nvarchar(30) NOT NULL,
        PRIORIDAD nvarchar(30) NOT NULL,
        PRIORIDAD_ORDEN int NOT NULL,
        ESTADO_CASO nvarchar(30) NOT NULL,
        DECISION nvarchar(30) NULL,
        FRAUDE_CONFIRMADO bit NULL,
        USUARIO_DECISION nvarchar(120) NULL,
        FECHA_DECISION datetime2 NULL,
        COMENTARIO nvarchar(max) NULL,
        RESUMEN_PREVIEW nvarchar(max) NULL,
        ALERTAS nvarchar(max) NOT NULL,
        FECHA_CREACION datetime2 NOT NULL,
        FECHA_ULTIMA_EVALUACION datetime2 NOT NULL,
        HASH_DATOS nvarchar(128) NOT NULL,
        SOURCE_AUDIT_DATE datetime2 NOT NULL,
        SOURCE_LOAD_DATE datetime2 NULL,
        RECOMMENDED_ACTION nvarchar(200) NULL,
        CASE_SNAPSHOT_JSON nvarchar(max) NOT NULL,
        ANALYSIS_SNAPSHOT_JSON nvarchar(max) NOT NULL
    );

    CREATE UNIQUE INDEX UX_AF_MONITORED_CASES_SIN_ID
        ON dbo.AF_MONITORED_CASES (SIN_ID);
END;
