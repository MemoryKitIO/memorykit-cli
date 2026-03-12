import type { CredentialsManager } from './credentials-manager.js';
import type {
  LoginResponse,
  UserResponse,
  VerifyResponse,
  CompanyResponse,
  ProjectResponse,
  ApiKeyWithSecretResponse,
  ApiKeyResponse,
} from './types.js';

const DEFAULT_TIMEOUT = 30_000;

export class DashboardClient {
  private readonly baseUrl: string;
  private readonly credentials: CredentialsManager;
  private readonly profile: string;

  constructor(baseUrl: string, credentials: CredentialsManager, profile: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.credentials = credentials;
    this.profile = profile;
  }

  // -- Auth --

  async register(email: string, password: string, gdprConsent: boolean): Promise<UserResponse> {
    return this.request<UserResponse>('POST', '/api/v1/auth/register', {
      email, password, gdpr_consent: gdprConsent,
    });
  }

  async verify(email: string, token: string): Promise<VerifyResponse> {
    return this.request<VerifyResponse>('POST', '/api/v1/auth/verify', { email, token });
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('POST', '/api/v1/auth/login', { email, password });
  }

  async refresh(): Promise<LoginResponse> {
    const creds = this.credentials.getProfile(this.profile);
    if (!creds.refreshToken) throw new Error('No refresh token stored. Run `memorykit auth login` first.');
    return this.request<LoginResponse>('POST', '/api/v1/auth/refresh', {
      refresh_token: creds.refreshToken,
    });
  }

  // -- Companies --

  async createCompany(name: string, slug: string, levelNumber = 1): Promise<CompanyResponse> {
    return this.requestWithAuth<CompanyResponse>('POST', '/api/v1/companies', {
      name, slug, level_number: levelNumber,
    });
  }

  async listCompanies(): Promise<CompanyResponse[]> {
    return this.requestWithAuth<CompanyResponse[]>('GET', '/api/v1/companies');
  }

  // -- Projects --

  async createProject(companyId: string, name: string, slug: string): Promise<ProjectResponse> {
    return this.requestWithAuth<ProjectResponse>(
      'POST', `/api/v1/companies/${companyId}/projects`,
      { name, slug },
    );
  }

  async listProjects(companyId: string): Promise<ProjectResponse[]> {
    return this.requestWithAuth<ProjectResponse[]>(
      'GET', `/api/v1/companies/${companyId}/projects`,
    );
  }

  // -- API Keys --

  async createApiKey(
    companyId: string,
    projectId: string,
    name: string,
    scopes: string[] = ['read', 'write'],
  ): Promise<ApiKeyWithSecretResponse> {
    return this.requestWithAuth<ApiKeyWithSecretResponse>(
      'POST', `/api/v1/companies/${companyId}/api-keys`,
      { project_id: projectId, name, scopes },
    );
  }

  async listApiKeys(companyId: string): Promise<ApiKeyResponse[]> {
    return this.requestWithAuth<ApiKeyResponse[]>(
      'GET', `/api/v1/companies/${companyId}/api-keys`,
    );
  }

  async revokeApiKey(companyId: string, apiKeyId: string): Promise<void> {
    await this.requestWithAuth<void>(
      'DELETE', `/api/v1/companies/${companyId}/api-keys/${apiKeyId}`,
    );
  }

  // -- Internal --

  private async request<T>(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...headers,
        },
        body: body != null ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.status === 204) return undefined as T;

      const json = await res.json() as Record<string, unknown>;

      if (!res.ok) {
        const msg = (json['detail'] as string) ?? (json['message'] as string) ?? res.statusText;
        const err = new Error(msg) as Error & { statusCode: number };
        err.statusCode = res.status;
        throw err;
      }

      return json as T;
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${DEFAULT_TIMEOUT}ms`);
      }
      throw error;
    }
  }

  private async requestWithAuth<T>(method: string, path: string, body?: unknown): Promise<T> {
    const creds = this.credentials.getProfile(this.profile);
    if (!creds.accessToken) {
      throw new Error('Not authenticated. Run `memorykit auth login` or `memorykit init` first.');
    }

    const headers = { Authorization: `Bearer ${creds.accessToken}` };

    try {
      return await this.request<T>(method, path, body, headers);
    } catch (error) {
      // Auto-refresh on 401
      if ((error as Error & { statusCode?: number }).statusCode === 401 && creds.refreshToken) {
        const refreshed = await this.refresh();
        this.credentials.update(this.profile, {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
        });
        const newHeaders = { Authorization: `Bearer ${refreshed.access_token}` };
        return this.request<T>(method, path, body, newHeaders);
      }
      throw error;
    }
  }
}
