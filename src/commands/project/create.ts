import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { promptIfMissing, slugify } from '../../lib/prompts.js';

export default class ProjectCreate extends BaseCommand {
  static description = 'Create a new project';

  static examples = [
    '$ memorykit project create',
    '$ memorykit project create --name "My Project" --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({ description: 'Project name' }),
    slug: Flags.string({ description: 'URL slug (auto-generated from name)' }),
    'company-id': Flags.string({ description: 'Company ID (uses stored default)' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ProjectCreate);
    const dashboard = this.getDashboardClient();

    const companyId = flags['company-id'] ?? this.credentialsManager.getProfile(this.profileName).companyId;
    if (!companyId) {
      this.error('No company selected. Use --company-id or run `memorykit company create` first.');
    }

    const name = await promptIfMissing(flags.name, { message: 'Project name:' });
    const slug = flags.slug ?? slugify(name);

    const spinner = this.output.spinner('Creating project...');
    const project = await dashboard.createProject(companyId, name, slug);
    spinner.stop();

    this.credentialsManager.update(this.profileName, {
      projectId: project.id,
      projectName: project.name,
    });

    this.output.success(project, `Project "${project.name}" created (${project.id}).`);
  }
}
