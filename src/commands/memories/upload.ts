import * as fs from 'node:fs';
import * as path from 'node:path';
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class MemoriesUpload extends BaseCommand {
  static description = 'Upload a file as a memory';

  static examples = [
    '$ memorykit memories upload ./document.pdf',
    '$ memorykit memories upload ./notes.md --title "My Notes" --tags notes --json',
  ];

  static args = {
    file: Args.string({ description: 'File path to upload', required: true }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
    title: Flags.string({ description: 'Memory title' }),
    type: Flags.string({ description: 'Memory type', default: 'document' }),
    tags: Flags.string({ description: 'Comma-separated tags' }),
    'user-id': Flags.string({ description: 'Scope to a user ID' }),
    language: Flags.string({ description: 'Content language' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MemoriesUpload);
    const sdk = this.getMemoryKitSDK();

    const filePath = path.resolve(args.file);
    if (!fs.existsSync(filePath)) {
      this.error(`File not found: ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const file = new Blob([buffer], { type: 'application/octet-stream' });

    const spinner = this.output.spinner(`Uploading ${fileName}...`);
    const memory = await sdk.memories.upload({
      file,
      ...(flags.title ? { title: flags.title } : { title: fileName }),
      ...(flags.type ? { type: flags.type as 'text' | 'document' | 'conversation' | 'code' } : {}),
      ...(flags.tags ? { tags: flags.tags.split(',').map((t) => t.trim()) } : {}),
      ...(flags['user-id'] ? { userId: flags['user-id'] } : {}),
      ...(flags.language ? { language: flags.language } : {}),
    });
    spinner.stop();

    this.output.success(memory, `Uploaded: ${memory.id} (status: ${memory.status})`);
  }
}
