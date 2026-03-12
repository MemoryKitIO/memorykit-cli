import { BaseCommand } from '../../base-command.js';

export default class AuthLogout extends BaseCommand {
  static description = 'Clear stored credentials for the active profile';

  static examples = [
    '$ memorykit auth logout',
    '$ memorykit auth logout --profile staging',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    this.credentialsManager.clearProfile(this.profileName);
    this.output.success({ profile: this.profileName }, `Logged out (profile: ${this.profileName}).`);
  }
}
