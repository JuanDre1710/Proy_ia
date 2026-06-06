IF OBJECT_ID('dbo.AF_INCREMENTAL_CONTROL', 'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.AF_INCREMENTAL_CONTROL
        WHERE PROCESS_NAME = 'siniestros_incremental_monitor'
   )
BEGIN
    INSERT INTO dbo.AF_INCREMENTAL_CONTROL (
        PROCESS_NAME,
        ULTIMA_FECHA_PROCESADA,
        ULTIMO_ID_PROCESADO,
        ULTIMA_EJECUCION,
        ESTADO,
        MENSAJE_ERROR
    )
    VALUES (
        'siniestros_incremental_monitor',
        '2012-02-03T17:22:11.893',
        0,
        NULL,
        'pending',
        NULL
    );
END;
