import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { promptIfMissing } from '../../lib/prompts.js';

export default class AuthLogin extends BaseCommand {
  static description = 'Login to your MemoryKit account';

  static examples = [
    '$ memorykit auth login',
    '$ memorykit auth login --email user@example.com --password secret123 --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    email: Flags.string({ description: 'Account email' }),
    password: Flags.string({ description: 'Account password' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogin);
    const dashboard = this.getDashboardClient();

    const storedEmail = this.credentialsManager.getProfile(this.profileName).email;
    const email = await promptIfMissing(flags.email ?? storedEmail, { message: 'Email:' });
    const password = await promptIfMissing(flags.password, { message: 'Password:', type: 'password' });

    const spinner = this.output.spinner('Logging in...');
    const result = await dashboard.login(email, password);
    spinner.stop();

    const creds: Record<string, string | undefined> = {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      email,
    };

    // Auto-select company if exactly one
    if (result.companies.length === 1) {
      creds['companyId'] = result.companies[0].id;
      creds['companyName'] = result.companies[0].name;
    }

    this.credentialsManager.update(this.profileName, creds);

    const companyInfo = result.companies.length > 0
      ? ` (${result.companies.length} company${result.companies.length > 1 ? 'ies' : ''})`
      : '';

    this.output.success(
      { email, companies: result.companies },
      `Logged in as ${email}${companyInfo}.`,
    );
  }
}
