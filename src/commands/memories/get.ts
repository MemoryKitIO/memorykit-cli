import { Args } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class MemoriesGet extends BaseCommand {
  static description = 'Get a memory by ID';

  static examples = ['$ memorykit memories get MEMORY_ID'];

  static args = {
    id: Args.string({ description: 'Memory ID', required: true }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args } = await this.parse(MemoriesGet);
    const sdk = this.getMemoryKitSDK();

    const spinner = this.output.spinner('Loading memory...');
    const memory = await sdk.memories.get(args.id);
    spinner.stop();

    this.output.success(memory, [
      '',
      `  ID:      ${memory.id}`,
      `  Title:   ${memory.title ?? '—'}`,
      `  Type:    ${memory.type}`,
      `  Status:  ${memory.status}`,
      `  Tags:    ${memory.tags.length > 0 ? memory.tags.join(', ') : '—'}`,
      `  Tokens:  ${memory.tokenCount ?? '—'}`,
      `  Created: ${memory.createdAt}`,
      '',
    ].join('\n'));
  }
}
