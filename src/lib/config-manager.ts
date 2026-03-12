import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { CLIConfig } from './types.js';

const DEFAULT_CONFIG: CLIConfig = {
  defaultProfile: 'default',
  baseUrl: 'https://api.memorykit.io',
};

export class ConfigManager {
  private readonly configDir: string;
  private readonly configPath: string;

  constructor() {
    this.configDir = process.env['MEMORYKIT_CONFIG_DIR'] ?? path.join(os.homedir(), '.memorykit');
    this.configPath = path.join(this.configDir, 'config.json');
    this.ensureDir();
  }

  get dir(): string {
    return this.configDir;
  }

  read(): CLIConfig {
    if (!fs.existsSync(this.configPath)) {
      return { ...DEFAULT_CONFIG };
    }
    const raw = fs.readFileSync(this.configPath, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  }

  write(config: CLIConfig): void {
    const tmp = this.configPath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(config, null, 2), 'utf-8');
    fs.renameSync(tmp, this.configPath);
  }

  get(key: keyof CLIConfig): string {
    return this.read()[key];
  }

  set(key: keyof CLIConfig, value: string): void {
    const config = this.read();
    (config as unknown as Record<string, string>)[key] = value;
    this.write(config);
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true, mode: 0o700 });
    }
  }
}
