import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { promptIfMissing, promptConfirm } from '../../lib/prompts.js';

export default class AuthRegister extends BaseCommand {
  static description = 'Create a new MemoryKit account';

  static examples = [
    '$ memorykit auth register',
    '$ memorykit auth register --email user@example.com --password secret123 --gdpr-consent --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    email: Flags.string({ description: 'Account email' }),
    password: Flags.string({ description: 'Account password' }),
    'gdpr-consent': Flags.boolean({ description: 'GDPR data processing consent', default: false }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthRegister);
    const dashboard = this.getDashboardClient();

    const email = await promptIfMissing(flags.email, { message: 'Email:' });
    const password = await promptIfMissing(flags.password, {
      message: 'Password:',
      type: 'password',
      validate: (v) => v.length >= 8 || 'Password must be at least 8 characters',
    });
    const gdprConsent = await promptConfirm(
      flags['gdpr-consent'] || undefined,
      'I consent to data processing (GDPR)',
    );

    if (!gdprConsent) {
      this.error('GDPR consent is required to create an account.');
    }

    const spinner = this.output.spinner('Registering...');
    const user = await dashboard.register(email, password, gdprConsent);
    spinner.stop();

    this.credentialsManager.update(this.profileName, { email });

    this.output.success(user, `Account created for ${user.email}. Check your email for a verification code.`);
  }
}
