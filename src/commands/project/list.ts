import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ProjectList extends BaseCommand {
  static description = 'List projects in a company';

  static examples = ['$ memorykit project list'];

  static flags = {
    ...BaseCommand.baseFlags,
    'company-id': Flags.string({ description: 'Company ID (uses stored default)' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ProjectList);
    const dashboard = this.getDashboardClient();

    const companyId = flags['company-id'] ?? this.credentialsManager.getProfile(this.profileName).companyId;
    if (!companyId) {
      this.error('No company selected. Use --company-id or run `memorykit company create` first.');
    }

    const spinner = this.output.spinner('Loading projects...');
    const projects = await dashboard.listProjects(companyId);
    spinner.stop();

    this.output.table(
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        active: p.is_active ? 'yes' : 'no',
      })),
      {
        id: { header: 'ID' },
        name: { header: 'Name' },
        slug: { header: 'Slug' },
        active: { header: 'Active' },
      },
    );
  }
}
