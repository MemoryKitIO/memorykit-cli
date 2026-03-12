import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { promptIfMissing } from '../../lib/prompts.js';

export default class MemoriesSearch extends BaseCommand {
  static description = 'Search memories with hybrid search';

  static examples = [
    '$ memorykit memories search --query "What do you know?"',
    '$ memorykit memories search --query "meeting notes" --limit 5 --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    query: Flags.string({ description: 'Search query', char: 'q' }),
    limit: Flags.integer({ description: 'Max results (1-100)', default: 10 }),
    'score-threshold': Flags.string({ description: 'Minimum score threshold (0-1)' }),
    'include-graph': Flags.boolean({ description: 'Include knowledge graph data', default: false }),
    'user-id': Flags.string({ description: 'Scope to a user ID' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(MemoriesSearch);
    const sdk = this.getMemoryKitSDK();

    const query = await promptIfMissing(flags.query, { message: 'Search query:' });

    const spinner = this.output.spinner('Searching...');
    const result = await sdk.memories.search({
      query,
      limit: flags.limit,
      ...(flags['score-threshold'] ? { scoreThreshold: parseFloat(flags['score-threshold']) } : {}),
      ...(flags['include-graph'] ? { includeGraph: true } : {}),
      ...(flags['user-id'] ? { userId: flags['user-id'] } : {}),
    });
    spinner.stop();

    this.output.success(result, formatResults(result));
  }
}

function formatResults(result: { results: Array<{ memoryId: string; memoryTitle: string | null; content: string; score: number }>; totalResults: number }): string {
  if (result.results.length === 0) {
    return 'No results found.';
  }

  const lines: string[] = [`Found ${result.totalResults} result(s):`, ''];
  for (const r of result.results) {
    lines.push(`  [${r.score.toFixed(3)}] ${r.memoryId}`);
    if (r.memoryTitle) lines.push(`         Title: ${r.memoryTitle}`);
    lines.push(`         ${r.content.slice(0, 200)}${r.content.length > 200 ? '...' : ''}`);
    lines.push('');
  }
  return lines.join('\n');
}
