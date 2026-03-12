import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class MemoriesUpdate extends BaseCommand {
  static description = 'Update a memory';

  static examples = [
    '$ memorykit memories update MEMORY_ID --title "New Title"',
    '$ memorykit memories update MEMORY_ID --tags important,updated --json',
  ];

  static args = {
    id: Args.string({ description: 'Memory ID', required: true }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
    title: Flags.string({ description: 'New title' }),
    content: Flags.string({ description: 'New content' }),
    type: Flags.string({ description: 'New type' }),
    tags: Flags.string({ description: 'New comma-separated tags' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MemoriesUpdate);
    const sdk = this.getMemoryKitSDK();

    const params: Record<string, unknown> = {};
    if (flags.title !== undefined) params['title'] = flags.title;
    if (flags.content !== undefined) params['content'] = flags.content;
    if (flags.type !== undefined) params['type'] = flags.type;
    if (flags.tags !== undefined) params['tags'] = flags.tags.split(',').map((t) => t.trim());

    if (Object.keys(params).length === 0) {
      this.error('Provide at least one flag to update (--title, --content, --type, --tags).');
    }

    const spinner = this.output.spinner('Updating memory...');
    const memory = await sdk.memories.update(args.id, params);
    spinner.stop();

    this.output.success(memory, `Memory ${memory.id} updated.`);
  }
}
