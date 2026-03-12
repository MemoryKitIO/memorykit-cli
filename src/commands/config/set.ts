import { Args } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import type { CLIConfig } from '../../lib/types.js';

export default class ConfigSet extends BaseCommand {
  static description = 'Set a CLI configuration value';

  static examples = [
    '$ memorykit config set baseUrl https://api.staging.memorykit.io',
  ];

  static args = {
    key: Args.string({ description: 'Config key', required: true, options: ['baseUrl', 'defaultProfile'] }),
    value: Args.string({ description: 'Value to set', required: true }),
  };

  static flags = { ...BaseCommand.baseFlags };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigSet);
    this.configManager.set(args.key as keyof CLIConfig, args.value);
    this.output.success({ [args.key]: args.value }, `Set ${args.key} = ${args.value}`);
  }
}
