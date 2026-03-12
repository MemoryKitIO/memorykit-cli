import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { promptIfMissing } from '../../lib/prompts.js';

export default class MemoriesCreate extends BaseCommand {
  static description = 'Create a new memory';

  static examples = [
    '$ memorykit memories create --content "Meeting notes from today"',
    '$ memorykit memories create --content "..." --title "Q1 Report" --tags sales,quarterly --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    content: Flags.string({ description: 'Memory content (text)' }),
    title: Flags.string({ description: 'Memory title' }),
    type: Flags.string({ description: 'Memory type (text, document, conversation, code)', default: 'text' }),
    tags: Flags.string({ description: 'Comma-separated tags' }),
    'user-id': Flags.string({ description: 'Scope to a user ID' }),
    language: Flags.string({ description: 'Content language (e.g. en, ru)' }),
    format: Flags.string({ description: 'Content format (plain, markdown, html)' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(MemoriesCreate);
    const sdk = this.getMemoryKitSDK();

    const content = await promptIfMissing(flags.content, { message: 'Memory content:' });

    const spinner = this.output.spinner('Creating memory...');
    const memory = await sdk.memories.create({
      content,
      ...(flags.title ? { title: flags.title } : {}),
      ...(flags.type ? { type: flags.type as 'text' | 'document' | 'conversation' | 'code' } : {}),
      ...(flags.tags ? { tags: flags.tags.split(',').map((t) => t.trim()) } : {}),
      ...(flags['user-id'] ? { userId: flags['user-id'] } : {}),
      ...(flags.language ? { language: flags.language } : {}),
      ...(flags.format ? { format: flags.format as 'plain' | 'markdown' | 'html' } : {}),
    });
    spinner.stop();

    this.output.success(memory, `Memory created: ${memory.id} (status: ${memory.status})`);
  }
}
