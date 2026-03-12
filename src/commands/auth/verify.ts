import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { promptIfMissing } from '../../lib/prompts.js';

export default class AuthVerify extends BaseCommand {
  static description = 'Verify your email with the 6-digit code';

  static examples = [
    '$ memorykit auth verify',
    '$ memorykit auth verify --email user@example.com --code 123456 --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    email: Flags.string({ description: 'Account email' }),
    code: Flags.string({ description: '6-digit verification code' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthVerify);
    const dashboard = this.getDashboardClient();

    const storedEmail = this.credentialsManager.getProfile(this.profileName).email;
    const email = await promptIfMissing(flags.email ?? storedEmail, { message: 'Email:' });
    const code = await promptIfMissing(flags.code, {
      message: 'Enter 6-digit verification code:',
      validate: (v) => /^\d{6}$/.test(v) || 'Must be a 6-digit code',
    });

    const spinner = this.output.spinner('Verifying...');
    const result = await dashboard.verify(email, code);
    spinner.stop();

    this.output.success(result, `Email ${result.email} verified successfully.`);
  }
}
