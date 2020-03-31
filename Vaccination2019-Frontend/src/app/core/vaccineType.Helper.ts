import {VaccineType} from '../../models/vaccines.model';

export function formatVaccineType(type: VaccineType) {
  if (type) {
    return `${type.producer}, ${type.drug}, ${type.dosage}`;
  }
  return '';
}