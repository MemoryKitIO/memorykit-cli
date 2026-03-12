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

    this.output.success(status, [
      '',
      `  Project: ${status.project}`,
      `  Plan:    ${status.plan}`,
      '',
      '  Usage:',
      `    Memories: ${status.usage.memoriesTotal} / ${status.usage.memoriesLimit} (${status.usage.memoriesToday} today)`,
      `    Queries:  ${status.usage.queriesThisMonth} / ${status.usage.queriesLimit}`,
      `    Storage:  ${status.usage.storageMb} MB / ${status.usage.storageLimitMb} MB`,
      '',
    ].join('\n'));
  }
}
