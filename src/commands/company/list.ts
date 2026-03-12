import { BaseCommand } from '../../base-command.js';

export default class CompanyList extends BaseCommand {
  static description = 'List your companies';

  static examples = ['$ memorykit company list'];

  static flags = { ...BaseCommand.baseFlags };

  async run(): Promise<void> {
    const dashboard = this.getDashboardClient();

    const spinner = this.output.spinner('Loading companies...');
    const companies = await dashboard.listCompanies();
    spinner.stop();

    this.output.table(
      companies.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        active: c.is_active ? 'yes' : 'no',
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
