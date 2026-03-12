import { Command, Flags } from '@oclif/core';
import { MemoryKit } from '@memorykitio/sdk';
import { ConfigManager } from './lib/config-manager.js';
import { CredentialsManager } from './lib/credentials-manager.js';
import { DashboardClient } from './lib/dashboard-client.js';
import { OutputFormatter } from './lib/output.js';

export abstract class BaseCommand extends Command {
  static baseFlags = {
    json: Flags.boolean({ description: 'Output as JSON (machine-readable)', default: false }),
    profile: Flags.string({ description: 'Named credential profile', default: 'default' }),
  };

  protected configManager!: ConfigManager;
  protected credentialsManager!: CredentialsManager;
  protected output!: OutputFormatter;
  protected profileName!: string;

  async init(): Promise<void> {
    await super.init();
    const { flags } = await this.parse(this.constructor as typeof BaseCommand);
    this.profileName = (flags as Record<string, unknown>)['profile'] as string ?? 'default';
    const jsonMode = (flags as Record<string, unknown>)['json'] as boolean ?? false;
    this.configManager = new ConfigManager();
    this.credentialsManager = new CredentialsManager();
    this.output = new OutputFormatter(jsonMode, this);
  }

  protected getDashboardClient(): DashboardClient {
    const baseUrl = this.configManager.get('baseUrl');
    return new DashboardClient(baseUrl, this.credentialsManager, this.profileName);
  }

  protected getMemoryKitSDK(): MemoryKit {
    const creds = this.credentialsManager.getProfile(this.profileName);
    if (!creds.apiKey) {
      throw new Error('No API key configured. Run `memorykit init` or `memorykit apikey create` first.');
    }
    const baseUrl = this.configManager.get('baseUrl');
    return new MemoryKit({
      apiKey: creds.apiKey,
      baseUrl: `${baseUrl}/v1`,
    });
  }

  protected async catch(err: Error & { exitCode?: number }): Promise<void> {
    this.output?.error(err);
    if (!this.output) {
      await super.catch(err);
    }
  }
}
