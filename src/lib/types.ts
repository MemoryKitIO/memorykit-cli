// ---------------------------------------------------------------------------
// Dashboard API response types (snake_case, matching Backend)
// ---------------------------------------------------------------------------

// Auth

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  companies: CompanyBrief[];
}

export interface CompanyBrief {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface UserResponse {
  id: string;
  email: string;
  email_verified: boolean;
  is_active: boolean;
  gdpr_consent: boolean;
  gdpr_consent_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerifyResponse {
  id: string;
  email: string;
  email_verified: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Company

export interface CompanyResponse {
  id: string;
  name: string;
  slug: string;
  level_number: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Project

export interface ProjectResponse {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// API Key

export interface ApiKeyResponse {
  id: string;
  company_id: string;
  name: string;
  scopes: string[];
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyWithSecretResponse extends ApiKeyResponse {
  api_key: string;
}

// Config & Credentials

export interface CLIConfig {
  defaultProfile: string;
  baseUrl: string;
}

export interface ProfileCredentials {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  email?: string;
  companyId?: string;
  companyName?: string;
  projectId?: string;
  projectName?: string;
  apiKey?: string;
}

export interface CredentialsFile {
  profiles: Record<string, ProfileCredentials>;
}
