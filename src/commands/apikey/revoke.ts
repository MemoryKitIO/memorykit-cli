import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { promptConfirm } from '../../lib/prompts.js';

export default class ApiKeyRevoke extends BaseCommand {
  static description = 'Revoke an API key';

  static examples = [
    '$ memorykit apikey revoke KEY_ID',
    '$ memorykit apikey revoke KEY_ID --force --json',
  ];

  static args = {
    id: Args.string({ description: 'API key ID to revoke', required: true }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
    'company-id': Flags.string({ description: 'Company ID (uses stored default)' }),
    force: Flags.boolean({ description: 'Skip confirmation', default: false }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ApiKeyRevoke);
    const dashboard = this.getDashboardClient();

    const companyId = flags['company-id'] ?? this.credentialsManager.getProfile(this.profileName).companyId;
    if (!companyId) {
      this.error('No company selected. Use --company-id or run `memorykit company create` first.');
    }

    if (!flags.force && !flags.json) {
      const confirmed = await promptConfirm(undefined, `Revoke API key ${args.id}? This cannot be undone.`);
      if (!confirmed) {
        this.output.info('Cancelled.');
        return;
      }
    }

    const spinner = this.output.spinner('Revoking API key...');
    await dashboard.revokeApiKey(companyId, args.id);
    spinner.stop();

    this.output.success({ id: args.id, revoked: true }, `API key ${args.id} revoked.`);
  }
}
