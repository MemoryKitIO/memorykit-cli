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

    const raw = memory as unknown as Record<string, unknown>;
    const tags = (memory.tags ?? raw['tags'] ?? []) as string[];
    this.output.success(memory, [
      '',
      `  ID:      ${memory.id}`,
      `  Title:   ${memory.title ?? '—'}`,
      `  Type:    ${memory.type}`,
      `  Status:  ${memory.status}`,
      `  Tags:    ${tags.length > 0 ? tags.join(', ') : '—'}`,
      `  Tokens:  ${(memory.tokenCount ?? raw['token_count'] ?? '—')}`,
      `  Created: ${(memory.createdAt ?? raw['created_at'] ?? '')}`,
      '',
    ].join('\n'));
  }
}
