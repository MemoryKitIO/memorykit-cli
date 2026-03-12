import { BaseCommand } from '../../base-command.js';

export default class ConfigList extends BaseCommand {
  static description = 'List all CLI configuration values';

  static examples = ['$ memorykit config list'];

  static flags = { ...BaseCommand.baseFlags };

  async run(): Promise<void> {
    const config = this.configManager.read();

    this.output.table(
      Object.entries(config).map(([key, value]) => ({ key, value: String(value) })),
      { key: { header: 'Key' }, value: { header: 'Value' } },
    );
  }
}
