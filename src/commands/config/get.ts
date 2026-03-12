import { Args } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import type { CLIConfig } from '../../lib/types.js';

export default class ConfigGet extends BaseCommand {
  static description = 'Get a CLI configuration value';

  static examples = [
    '$ memorykit config get baseUrl',
  ];

  static args = {
    key: Args.string({ description: 'Config key', required: true, options: ['baseUrl', 'defaultProfile'] }),
  };

  static flags = { ...BaseCommand.baseFlags };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigGet);
    const value = this.configManager.get(args.key as keyof CLIConfig);
    this.output.success({ [args.key]: value }, value);
  }
}
