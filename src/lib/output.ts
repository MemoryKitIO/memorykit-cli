import { Command, ux } from '@oclif/core';

interface ColumnDef {
  header: string;
}

export class OutputFormatter {
  constructor(
    private readonly jsonMode: boolean,
    private readonly cmd: Command,
  ) {}

  success(data: unknown, humanMessage?: string): void {
    if (this.jsonMode) {
      this.cmd.log(JSON.stringify({ ok: true, data }, null, 2));
    } else if (humanMessage) {
      this.cmd.log(humanMessage);
    }
  }

  error(err: Error & { statusCode?: number; code?: string }): void {
    if (this.jsonMode) {
      this.cmd.log(JSON.stringify({
        ok: false,
        error: {
          name: err.name,
          message: err.message,
          ...(err.statusCode ? { statusCode: err.statusCode } : {}),
          ...(err.code ? { code: err.code } : {}),
        },
      }, null, 2));
    } else {
      this.cmd.logToStderr(`Error: ${err.message}`);
    }
  }

  table(data: Record<string, unknown>[], columns: Record<string, ColumnDef>): void {
    if (this.jsonMode) {
      this.cmd.log(JSON.stringify({ ok: true, data }, null, 2));
      return;
    }

    if (data.length === 0) {
      this.cmd.log('No results.');
      return;
    }

    const keys = Object.keys(columns);
    const headers = keys.map((k) => columns[k].header);

    // Calculate column widths
    const widths = keys.map((key, i) => {
      const vals = data.map((row) => String(row[key] ?? ''));
      return Math.max(headers[i].length, ...vals.map((v) => v.length));
    });

    // Print header
    const headerLine = keys.map((_, i) => headers[i].padEnd(widths[i])).join('  ');
    this.cmd.log(headerLine);
    this.cmd.log(widths.map((w) => '─'.repeat(w)).join('  '));

    // Print rows
    for (const row of data) {
      const line = keys.map((key, i) => String(row[key] ?? '').padEnd(widths[i])).join('  ');
      this.cmd.log(line);
    }
  }

  heading(text: string): void {
    if (!this.jsonMode) {
      this.cmd.log(`\n  ${text}\n`);
    }
  }

  step(current: number, total: number, label: string): void {
    if (!this.jsonMode) {
      this.cmd.log(`  Step ${current}/${total}: ${label}`);
    }
  }

  info(message: string): void {
    if (!this.jsonMode) {
      this.cmd.log(message);
    }
  }

  spinner(message: string): { stop: (status?: string) => void } {
    if (this.jsonMode) {
      return { stop: () => {} };
    }
    ux.action.start(message);
    return {
      stop: (status?: string) => ux.action.stop(status ?? 'done'),
    };
  }
}
