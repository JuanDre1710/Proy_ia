IF OBJECT_ID('dbo.AF_INCREMENTAL_CONTROL', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.AF_INCREMENTAL_CONTROL', 'PROCESS_NAME') IS NULL
       AND COL_LENGTH('dbo.AF_INCREMENTAL_CONTROL', 'PROCESO') IS NOT NULL
    BEGIN
        EXEC sp_rename 'dbo.AF_INCREMENTAL_CONTROL.PROCESO', 'PROCESS_NAME', 'COLUMN';
    END;

    IF COL_LENGTH('dbo.AF_INCREMENTAL_CONTROL', 'PROCESS_NAME') IS NULL
    BEGIN
        EXEC sp_executesql N'
            ALTER TABLE dbo.AF_INCREMENTAL_CONTROL
                ADD PROCESS_NAME nvarchar(100) NULL;
        ';
    END;

    EXEC sp_executesql N'
        UPDATE dbo.AF_INCREMENTAL_CONTROL
        SET PROCESS_NAME = ''siniestros_incremental_monitor''
        WHERE PROCESS_NAME IS NULL OR LTRIM(RTRIM(CONVERT(nvarchar(100), PROCESS_NAME))) = '''';
    ';

    UPDATE dbo.AF_INCREMENTAL_CONTROL
    SET ULTIMA_FECHA_PROCESADA = '2012-02-03T17:22:11.893'
    WHERE ULTIMA_FECHA_PROCESADA IS NULL;

    UPDATE dbo.AF_INCREMENTAL_CONTROL
    SET ULTIMO_ID_PROCESADO = 0
    WHERE ULTIMO_ID_PROCESADO IS NULL;

    UPDATE dbo.AF_INCREMENTAL_CONTROL
    SET ESTADO = 'pending'
    WHERE ESTADO IS NULL OR LTRIM(RTRIM(CONVERT(nvarchar(30), ESTADO))) = '';

    EXEC sp_executesql N'
        ALTER TABLE dbo.AF_INCREMENTAL_CONTROL
            ALTER COLUMN PROCESS_NAME nvarchar(100) NOT NULL;
    ';

    ALTER TABLE dbo.AF_INCREMENTAL_CONTROL
        ALTER COLUMN ULTIMA_FECHA_PROCESADA datetime2 NOT NULL;

    ALTER TABLE dbo.AF_INCREMENTAL_CONTROL
        ALTER COLUMN ULTIMO_ID_PROCESADO bigint NOT NULL;

    ALTER TABLE dbo.AF_INCREMENTAL_CONTROL
        ALTER COLUMN ULTIMA_EJECUCION datetime2 NULL;

    ALTER TABLE dbo.AF_INCREMENTAL_CONTROL
        ALTER COLUMN ESTADO nvarchar(30) NOT NULL;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID('dbo.AF_INCREMENTAL_CONTROL')
          AND name = 'UX_AF_INCREMENTAL_CONTROL_PROCESS_NAME'
    )
    BEGIN
        EXEC sp_executesql N'
            CREATE UNIQUE INDEX UX_AF_INCREMENTAL_CONTROL_PROCESS_NAME
                ON dbo.AF_INCREMENTAL_CONTROL (PROCESS_NAME);
        ';
    END;
END;

IF OBJECT_ID('dbo.AF_INCREMENTAL_CONTROL', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.AF_INCREMENTAL_CONTROL', 'PROCESS_NAME') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (
            SELECT 1
            FROM dbo.AF_INCREMENTAL_CONTROL
            WHERE PROCESS_NAME = ''siniestros_incremental_monitor''
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
                ''siniestros_incremental_monitor'',
                ''2012-02-03T17:22:11.893'',
                0,
                NULL,
                ''pending'',
                NULL
            );
        END;
    ';
END;
