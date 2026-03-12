import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ApiKeyList extends BaseCommand {
  static description = 'List API keys';

  static examples = ['$ memorykit apikey list'];

  static flags = {
    ...BaseCommand.baseFlags,
    'company-id': Flags.string({ description: 'Company ID (uses stored default)' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ApiKeyList);
    const dashboard = this.getDashboardClient();

    const companyId = flags['company-id'] ?? this.credentialsManager.getProfile(this.profileName).companyId;
    if (!companyId) {
      this.error('No company selected. Use --company-id or run `memorykit company create` first.');
    }

    const spinner = this.output.spinner('Loading API keys...');
    const keys = await dashboard.listApiKeys(companyId);
    spinner.stop();

    this.output.table(
      keys.map((k) => ({
        id: k.id,
        name: k.name,
        scopes: k.scopes.join(', '),
        active: k.is_active ? 'yes' : 'no',
        expires: k.expires_at ?? 'never',
      })),
      {
        id: { header: 'ID' },
        name: { header: 'Name' },
        scopes: { header: 'Scopes' },
        active: { header: 'Active' },
        expires: { header: 'Expires' },
      },
    );
  }
}
