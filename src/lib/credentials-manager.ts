import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { CredentialsFile, ProfileCredentials } from './types.js';

const EMPTY_CREDENTIALS: CredentialsFile = { profiles: {} };

export class CredentialsManager {
  private readonly credentialsPath: string;

  constructor() {
    const configDir = process.env['MEMORYKIT_CONFIG_DIR'] ?? path.join(os.homedir(), '.memorykit');
    this.credentialsPath = path.join(configDir, 'credentials.json');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
    }
  }

  readAll(): CredentialsFile {
    if (!fs.existsSync(this.credentialsPath)) {
      return { ...EMPTY_CREDENTIALS, profiles: {} };
    }
    const raw = fs.readFileSync(this.credentialsPath, 'utf-8');
    return JSON.parse(raw) as CredentialsFile;
  }

  getProfile(name: string): ProfileCredentials {
    return this.readAll().profiles[name] ?? {};
  }

  update(profileName: string, partial: Partial<ProfileCredentials>): void {
    const file = this.readAll();
    file.profiles[profileName] = { ...file.profiles[profileName], ...partial };
    this.writeAll(file);
  }

  clearProfile(profileName: string): void {
    const file = this.readAll();
    delete file.profiles[profileName];
    this.writeAll(file);
  }

  listProfiles(): string[] {
    return Object.keys(this.readAll().profiles);
  }

  private writeAll(file: CredentialsFile): void {
    const tmp = this.credentialsPath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(file, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, this.credentialsPath);
  }
}
