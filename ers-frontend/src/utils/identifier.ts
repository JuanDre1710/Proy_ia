import { IdentifierType, SearchIdentifier } from '../models/domain';
import { IdentifierValidationResult } from '../models/search';

export function inferIdentifierType(identifier: string): IdentifierType | null {
  const normalized = identifier.replace(/\D/g, '');
  if (/^\d{8}$/.test(normalized)) {
    return 'DNI';
  }
  if (/^\d{11}$/.test(normalized)) {
    const prefix = normalized.slice(0, 2);
    return prefix === '30' || prefix === '33' || prefix === '34' ? 'CUIT' : 'CUIL';
  }
  return null;
}

export function validateIdentifier(value: string): SearchIdentifier | null {
  const normalized = value.replace(/\D/g, '');
  const type = inferIdentifierType(normalized);
  return type ? { value: normalized, type } : null;
}

export function validateIdentifierWithFeedback(value: string): IdentifierValidationResult {
  const normalized = value.replace(/\D/g, '');

  if (!normalized) {
    return {
      isValid: false,
      normalizedValue: '',
      identifierType: null,
      error: 'Ingresa un identificador para evaluar.'
    };
  }

  if (!/^\d+$/.test(normalized)) {
    return {
      isValid: false,
      normalizedValue: normalized,
      identifierType: null,
      error: 'Solo se permiten numeros.'
    };
  }

  if (![8, 11].includes(normalized.length)) {
    return {
      isValid: false,
      normalizedValue: normalized,
      identifierType: null,
      error: 'El identificador debe tener 8 u 11 digitos.'
    };
  }

  const identifierType = inferIdentifierType(normalized);

  if (!identifierType) {
    return {
      isValid: false,
      normalizedValue: normalized,
      identifierType: null,
      error: 'No se pudo determinar si es DNI, CUIL o CUIT.'
    };
  }

  return {
    isValid: true,
    normalizedValue: normalized,
    identifierType,
    error: null
  };
}
