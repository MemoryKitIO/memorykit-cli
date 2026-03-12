import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import type { MemoryStatus } from '@memorykitio/sdk';

export default class MemoriesList extends BaseCommand {
  static description = 'List memories';

  static examples = [
    '$ memorykit memories list',
    '$ memorykit memories list --limit 50 --status completed',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({ description: 'Max results', default: 20 }),
    cursor: Flags.string({ description: 'Pagination cursor' }),
    status: Flags.string({ description: 'Filter by status (pending, processing, completed, failed)' }),
    type: Flags.string({ description: 'Filter by type' }),
    'user-id': Flags.string({ description: 'Filter by user ID' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(MemoriesList);
    const sdk = this.getMemoryKitSDK();

    const spinner = this.output.spinner('Loading memories...');
    const result = await sdk.memories.list({
      limit: flags.limit,
      ...(flags.cursor ? { cursor: flags.cursor } : {}),
      ...(flags.status ? { status: flags.status as MemoryStatus } : {}),
      ...(flags.type ? { type: flags.type as 'text' | 'document' | 'conversation' | 'code' } : {}),
      ...(flags['user-id'] ? { userId: flags['user-id'] } : {}),
    });
    spinner.stop();

    this.output.table(
      result.data.map((m) => ({
        id: m.id,
        title: m.title ?? '—',
        type: m.type,
        status: m.status,
        tokens: m.tokenCount ?? '—',
        created: m.createdAt,
      })),
      {
        id: { header: 'ID' },
        title: { header: 'Title' },
        type: { header: 'Type' },
        status: { header: 'Status' },
        tokens: { header: 'Tokens' },
        created: { header: 'Created' },
      },
    );
  }
}
