import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { promptConfirm } from '../../lib/prompts.js';

export default class MemoriesDelete extends BaseCommand {
  static description = 'Delete a memory';

  static examples = [
    '$ memorykit memories delete MEMORY_ID',
    '$ memorykit memories delete MEMORY_ID --force --json',
  ];

  static args = {
    id: Args.string({ description: 'Memory ID', required: true }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({ description: 'Skip confirmation', default: false }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MemoriesDelete);
    const sdk = this.getMemoryKitSDK();

    if (!flags.force && !flags.json) {
      const confirmed = await promptConfirm(undefined, `Delete memory ${args.id}? This cannot be undone.`);
      if (!confirmed) {
        this.output.info('Cancelled.');
        return;
      }
    }

    const spinner = this.output.spinner('Deleting memory...');
    await sdk.memories.delete(args.id);
    spinner.stop();

    this.output.success({ id: args.id, deleted: true }, `Memory ${args.id} deleted.`);
  }
}
