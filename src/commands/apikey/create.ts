import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { promptIfMissing } from '../../lib/prompts.js';

export default class ApiKeyCreate extends BaseCommand {
  static description = 'Create a new API key';

  static examples = [
    '$ memorykit apikey create',
    '$ memorykit apikey create --name "Production" --scopes read,write --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({ description: 'API key name' }),
    'company-id': Flags.string({ description: 'Company ID (uses stored default)' }),
    'project-id': Flags.string({ description: 'Project ID (uses stored default)' }),
    scopes: Flags.string({ description: 'Comma-separated scopes', default: 'read,write' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ApiKeyCreate);
    const dashboard = this.getDashboardClient();
    const creds = this.credentialsManager.getProfile(this.profileName);

    const companyId = flags['company-id'] ?? creds.companyId;
    if (!companyId) {
      this.error('No company selected. Use --company-id or run `memorykit company create` first.');
    }

    const projectId = flags['project-id'] ?? creds.projectId;
    if (!projectId) {
      this.error('No project selected. Use --project-id or run `memorykit project create` first.');
    }

    const name = await promptIfMissing(flags.name, { message: 'API key name:' });
    const scopes = flags.scopes.split(',').map((s) => s.trim());

    const spinner = this.output.spinner('Creating API key...');
    const apiKey = await dashboard.createApiKey(companyId, projectId, name, scopes);
    spinner.stop();

    // Store the secret for SDK usage
    this.credentialsManager.update(this.profileName, { apiKey: apiKey.api_key });

    this.output.success(apiKey, `API key created: ${apiKey.api_key}\nStored in profile "${this.profileName}".`);
  }
}
