import { BaseCommand } from '../base-command.js';

export default class Status extends BaseCommand {
  static description = 'Show project usage and billing status';

  static examples = ['$ memorykit status', '$ memorykit status --json'];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const sdk = this.getMemoryKitSDK();

    const spinner = this.output.spinner('Loading status...');
    const status = await sdk.status.get();
    spinner.stop();

    // Cast to real API shape (SDK types may not match actual API response)
    const s = status as unknown as Record<string, unknown>;
    const usage = s['usage'] as Record<string, unknown> | undefined;
    const billing = s['billing'] as Record<string, string> | undefined;

    const lines = [
      '',
      `  Project: ${s['project'] ?? s['projectId'] ?? '—'}`,
      `  Plan:    ${s['plan'] ?? '—'}`,
      '',
      '  Usage:',
    ];

    if (usage) {
      // Handle both camelCase (SDK) and snake_case (raw API) field names
      const mem = usage['memoriesTotal'] ?? usage['memories_total'] ?? usage['memories'] ?? 0;
      const memLimit = usage['memoriesLimit'] ?? usage['memories_limit'] ?? '∞';
      const memToday = (usage['memoriesToday'] ?? usage['memories_today']) as number | undefined;
      lines.push(`    Memories: ${mem} / ${memLimit}${memToday != null ? ` (${memToday} today)` : ''}`);

      const q = usage['queriesThisMonth'] ?? usage['queries_this_month'] ?? usage['queries'] ?? 0;
      const qLimit = usage['queriesLimit'] ?? usage['queries_limit'] ?? '∞';
      lines.push(`    Queries:  ${q} / ${qLimit}`);

      const stor = usage['storageMb'] ?? usage['storage_mb'] ?? usage['storage'] ?? 0;
      const storLimit = usage['storageLimitMb'] ?? usage['storage_limit_mb'] ?? usage['storageLimit'] ?? '∞';
      lines.push(`    Storage:  ${stor} MB / ${storLimit} MB`);
    }

    if (billing) {
      lines.push('', '  Billing period:');
      lines.push(`    ${billing['currentPeriodStart']} — ${billing['currentPeriodEnd']}`);
    }

    lines.push('');
    this.output.success(status, lines.join('\n'));
  }
}
