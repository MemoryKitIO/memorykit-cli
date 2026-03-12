import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { promptIfMissing, slugify } from '../../lib/prompts.js';

export default class CompanyCreate extends BaseCommand {
  static description = 'Create a new company';

  static examples = [
    '$ memorykit company create',
    '$ memorykit company create --name "My Startup" --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({ description: 'Company name' }),
    slug: Flags.string({ description: 'URL slug (auto-generated from name)' }),
    level: Flags.integer({ description: 'Level number', default: 1 }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(CompanyCreate);
    const dashboard = this.getDashboardClient();

    const name = await promptIfMissing(flags.name, { message: 'Company name:' });
    const slug = flags.slug ?? slugify(name);

    const spinner = this.output.spinner('Creating company...');
    const company = await dashboard.createCompany(name, slug, flags.level);
    spinner.stop();

    this.credentialsManager.update(this.profileName, {
      companyId: company.id,
      companyName: company.name,
    });

    this.output.success(company, `Company "${company.name}" created (${company.id}).`);
  }
}
