export type SupplierCountry = "USA" | "UK";
export type SupplierCurrency = "USD" | "GBP";
export type SupplierStatus = "active" | "suspended";
export type ComplianceAgreement = "BAA" | "DPA" | "both";

export interface Supplier {
  id: number;
  name: string;
  country: SupplierCountry;
  categories: string[];
  monthly_rate: number;
  currency: SupplierCurrency;
  compliance_agreement: ComplianceAgreement | null;
  contract_renewal_date: string | null;
  contact_email: string | null;
  notes: string | null;
  status: SupplierStatus;
  updated_at: string;
}

export interface SupplierPayload {
  name: string;
  country: SupplierCountry;
  categories: string[];
  monthly_rate: number;
  currency: SupplierCurrency;
  compliance_agreement?: ComplianceAgreement | null;
  contract_renewal_date?: string | null;
  contact_email?: string | null;
  notes?: string | null;
  status?: SupplierStatus;
}

export interface SupplierFilters {
  country?: SupplierCountry;
  category?: string;
}
