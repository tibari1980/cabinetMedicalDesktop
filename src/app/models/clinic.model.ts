export interface ClinicInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string; // Format Base64 pour stockage local
  version?: string;
}
