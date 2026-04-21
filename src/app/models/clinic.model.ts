export interface ClinicInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  version?: string;
  openingHour: number; // ex: 8 pour 08:00
  closingHour: number; // ex: 18 pour 18:00
  country?: string;
  language?: string;
  currency?: string;
  taxTvaRate?: number;
  legalIds?: {
    siret?: string;
    tva?: string;
    ice?: string;
    rc?: string;
    patente?: string;
    if?: string;
  };
}
