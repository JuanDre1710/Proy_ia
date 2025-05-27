from predictor_fraude import evaluar_caso

# Diccionario con todas las columnas requeridas por el modelo
input_data = {
    "months_as_customer": 84,
    "age": 45,
    "policy_state": "OH",
    "policy_csl": "250/500",
    "policy_deductable": 500,
    "policy_annual_premium": 1050.75,
    "umbrella_limit": 2000000,
    "insured_zip": 12345,
    "insured_sex": "MALE",
    "insured_education_level": "Bachelor",
    "insured_occupation": "engineer",
    "insured_hobbies": "chess",
    "insured_relationship": "husband",
    "capital-gains": 0,
    "capital-loss": 0,
    "incident_type": "Collision",
    "collision_type": "Rear Collision",
    "incident_severity": "Major Damage",
    "authorities_contacted": "Police",
    "incident_state": "NY",
    "incident_city": "New York",
    "incident_location": "123 Main St",
    "incident_hour_of_the_day": 14,
    "number_of_vehicles_involved": 2,
    "property_damage": "YES",
    "bodily_injuries": 1,
    "witnesses": 2,
    "police_report_available": "YES",
    "total_claim_amount": 25000,
    "injury_claim": 5000,
    "property_claim": 7000,
    "vehicle_claim": 13000,
    "auto_make": "Toyota",
    "auto_model": "Camry",
    "auto_year": 2015,
    "anio": 2020,
    "mes": 5,
    "dia": 10,
    "dia_semana": 0  # 0 = Lunes
}

# Ejecutar evaluación
resultado = evaluar_caso(input_data)

# Mostrar resultado
print("\n🧠 Resultado de la IA:")
print(f"Score: {resultado['score']}")
print(f"Clasificación: {resultado['clasificacion']}")
print("Explicación:")
for item in resultado["explicacion"]:
    print(f" - {item['variable']} → impacto: {item['impacto']}")
