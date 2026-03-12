import { input, password, confirm, select } from '@inquirer/prompts';

/** Error thrown when a required flag is missing in non-interactive mode. */
export class MissingFlagError extends Error {
  code = 'MISSING_FLAG';
  flag: string;

  constructor(promptMessage: string, flag?: string) {
    const flagName = flag ?? inferFlagName(promptMessage);
    super(`Missing required flag: --${flagName}`);
    this.name = 'MissingFlagError';
    this.flag = flagName;
  }
}

function inferFlagName(message: string): string {
  // "Email:" → "email", "Company name:" → "company-name"
  return message
    .replace(/[:()?]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

export async function promptIfMissing(
  flagValue: string | undefined,
  options: {
    message: string;
    type?: 'input' | 'password';
    validate?: (v: string) => boolean | string;
    flag?: string;
  },
): Promise<string> {
  if (flagValue !== undefined) return flagValue;

  if (!process.stdin.isTTY) {
    throw new MissingFlagError(options.message, options.flag);
  }

  const fn = options.type === 'password' ? password : input;
  const result = await fn({
    message: options.message,
    validate: options.validate,
  });
  return result;
}

export async function promptConfirm(
  flagValue: boolean | undefined,
  message: string,
): Promise<boolean> {
  if (flagValue !== undefined) return flagValue;

  // Auto-confirm in non-interactive mode (agent use case)
  if (!process.stdin.isTTY) return true;

  return confirm({ message });
}

export async function promptSelect<T extends string>(
  flagValue: T | undefined,
  options: {
    message: string;
    choices: Array<{ name: string; value: T }>;
    flag?: string;
  },
): Promise<T> {
  if (flagValue !== undefined) return flagValue;

  if (!process.stdin.isTTY) {
    throw new MissingFlagError(options.message, options.flag);
  }

  return select(options) as Promise<T>;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}
