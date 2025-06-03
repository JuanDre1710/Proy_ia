from pydantic import BaseModel
from typing import Optional

class EvaluacionInput(BaseModel):
    # Variables numéricas
    cliente_id: Optional[int] = None
    dias_entre_siniestro_y_denuncia: Optional[int] = None
    dias_desde_inicio_poliza: Optional[int] = None
    dias_hasta_fin_poliza: Optional[int] = None
    monto_reclamado: Optional[float] = None
    monto_pagado: Optional[float] = None
    valor_asegurado: Optional[float] = None
    valor_comercial: Optional[float] = None
    valor_factura: Optional[float] = None
    antiguedad_bien_en_anios: Optional[int] = None
    cantidad_siniestros_previos: Optional[int] = None
    cantidad_siniestros_mismo_tipo: Optional[int] = None
    dias_desde_ultimo_siniestro: Optional[int] = None
    cantidad_cambios_aseguradora: Optional[int] = None
    antiguedad_como_cliente_meses: Optional[int] = None

    # Variables categóricas (codificadas como números)
    tipo_bien: Optional[int] = None
    estado_bien: Optional[int] = None
    uso_bien: Optional[int] = None
    tipo_siniestro: Optional[int] = None
    estado_siniestro: Optional[int] = None
    provincia_id: Optional[int] = None
    tipo_proveedor: Optional[int] = None
    tipo_cliente: Optional[int] = None

    # Variables booleanas
    es_madrugada_finde: Optional[bool] = None
    es_siniestro_total: Optional[bool] = None
    zona_de_riesgo: Optional[bool] = None
    evento_climatico_registrado: Optional[bool] = None
    ubicacion_inconsistente_con_destino: Optional[bool] = None
    peritaje_realizado: Optional[bool] = None
    peritaje_congruente: Optional[bool] = None
    presencia_acelerantes: Optional[bool] = None
    imagenes_adjuntas: Optional[bool] = None
    imagenes_sospechosas: Optional[bool] = None
    gps_desactivado: Optional[bool] = None
    denuncia_policial: Optional[bool] = None
    hay_testigos: Optional[bool] = None
    certificado_medico: Optional[bool] = None
    factura_valida: Optional[bool] = None
    proveedor_repetido: Optional[bool] = None
    numero_factura_correlativa: Optional[bool] = None
    direccion_repetida_con_otro_cliente: Optional[bool] = None
    telefono_repetido_con_otro_cliente: Optional[bool] = None
    testigo_repetido: Optional[bool] = None
    perito_repetido: Optional[bool] = None
    historial_fraude_confirmado: Optional[bool] = None
    ocupacion_riesgo_alto: Optional[bool] = None
    actividad_comercial_declarante: Optional[bool] = None
    equipaje_reportado_perdido: Optional[bool] = None
    coincide_con_checkin: Optional[bool] = None

    # Etiqueta para reentrenamiento
    fraude_confirmado: Optional[int] = None
