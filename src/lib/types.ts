// =====================================================
// CardSocial - TypeScript Type Definitions
// =====================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  primary_color: string;
  secondary_color: string;
  rut: string | null;
  address: string | null;
  villa: string | null;
  commune: string | null;
  region: string | null;
  org_type: 'municipality' | 'jjvv' | 'corporation';
  parent_org_id: string | null; // For JJVV linked to a Municipality
  settings: {
    certificate_prices?: {
      active: number;
      inactive: number;
      resident: number;
    };
    signatures?: {
      president: { name: string; title: string; enabled: boolean };
      secretary: { name: string; title: string; enabled: boolean };
    };
    reasons?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'validator' | 'viewer' | 'auditor' | 'municipal_admin' | 'municipal_viewer';
  created_at: string;
}

export interface Beneficiary {
  id: string;
  org_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  rut: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  address: string | null;
  address_number: string | null;
  comuna: string | null;
  date_of_birth: string | null;
  custom_fields: Record<string, unknown>;
  status: 'active' | 'inactive' | 'blocked';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DigitalCard {
  id: string;
  beneficiary_id: string;
  org_id: string;
  card_number: string;
  qr_code: string;
  status: 'active' | 'expired' | 'blocked' | 'revoked' | 'draft';
  issued_at: string;
  expires_at: string | null;
  metadata: Record<string, unknown>;
}

export interface Benefit {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  type: 'subsidy' | 'bonus' | 'aid' | 'other';
  total_quantity: number | null;
  remaining_quantity: number | null;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'inactive' | 'exhausted';
  settings: Record<string, unknown>;
  extended_end_date: string | null;
  extension_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface BenefitAssignment {
  id: string;
  benefit_id: string;
  beneficiary_id: string;
  org_id: string;
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  assigned_at: string;
  used_at: string | null;
  validated_by: string | null;
  notes: string | null;
  // Joined data
  benefit?: Benefit;
  beneficiary?: Beneficiary;
}

export interface ValidationLog {
  id: string;
  assignment_id: string | null;
  beneficiary_id: string | null;
  card_id: string | null;
  org_id: string;
  validated_by: string;
  action: 'scan' | 'validate' | 'mark_used' | 'revoke' | 'block';
  result: 'success' | 'failed' | 'denied';
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  blockchain_tx_hash: string | null;
  blockchain_status: string;
  created_at: string;
}

// =====================================================
// Form / Input Types
// =====================================================

export interface BeneficiaryFormData {
  full_name: string;
  rut: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  address?: string;
  address_number?: string;
  date_of_birth?: string;
  custom_fields?: Record<string, unknown>;
  status?: 'active' | 'inactive' | 'blocked';
  notes?: string;
}

export interface BenefitFormData {
  name: string;
  description?: string;
  type: 'subsidy' | 'bonus' | 'aid' | 'other';
  total_quantity?: number;
  start_date?: string;
  end_date?: string;
}

export interface OrganizationFormData {
  name: string;
  slug: string;
  description?: string;
  primary_color?: string;
  secondary_color?: string;
}

// =====================================================
// Dashboard Types
// =====================================================

export interface DashboardStats {
  totalBeneficiaries: number;
  activeBeneficiaries: number;
  activeCards: number;
  totalBenefits: number;
  benefitsDelivered: number;
  benefitsPending: number;
  recentValidations: ValidationLog[];
}

// =====================================================
// QR Validation Types
// =====================================================

export interface QRValidationResult {
  valid: boolean;
  beneficiary?: Beneficiary;
  card?: DigitalCard;
  organization?: Organization;
  availableBenefits?: BenefitAssignment[];
  error?: string;
}

// =====================================================
// Bulk Upload Types
// =====================================================

export interface BulkUploadRow {
  full_name: string;
  rut: string;
  email?: string;
  phone?: string;
  address?: string;
  address_number?: string;
  date_of_birth?: string;
  [key: string]: string | undefined;
}

export interface BulkUploadResult {
  total: number;
  success: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// =====================================================
// Meeting / Attendance Types
// =====================================================

export interface Meeting {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  meeting_date: string;
  status: 'active' | 'closed' | 'cancelled';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingAttendance {
  id: string;
  meeting_id: string;
  beneficiary_id: string;
  card_id: string | null;
  org_id: string;
  registered_by: string | null;
  registered_at: string;
  // Joined data
  beneficiary?: Beneficiary;
}

// =====================================================
// Certificate Types
// =====================================================

export type CertificateType = 'socio_activo' | 'socio_inactivo' | 'residente';
export type CertificateStatus = 'active' | 'expired' | 'revoked';

export interface Certificate {
  id: string;
  org_id: string;
  beneficiary_id: string | null;
  folio: number;
  type: CertificateType;
  status: CertificateStatus;
  reason: string;
  cost: number;
  resident_data?: {
    full_name: string;
    rut: string;
    address: string;
    address_number?: string;
    villa: string;
  };
  issued_at: string;
  expires_at: string;
  metadata: Record<string, any>;
  // Joined data
  beneficiaries?: Beneficiary;
}

export interface CertificateFormData {
  beneficiary_id?: string;
  type: CertificateType;
  reason: string;
  resident_data?: {
    full_name: string;
    rut: string;
    address: string;
    address_number?: string;
    villa: string;
  };
}
