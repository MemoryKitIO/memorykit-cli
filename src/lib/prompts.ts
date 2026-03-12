import { input, password, confirm, select } from '@inquirer/prompts';

export async function promptIfMissing(
  flagValue: string | undefined,
  options: {
    message: string;
    type?: 'input' | 'password';
    validate?: (v: string) => boolean | string;
  },
): Promise<string> {
  if (flagValue !== undefined) return flagValue;

  if (!process.stdin.isTTY) {
    throw new Error(`Missing required input: "${options.message}". Use the corresponding flag in non-interactive mode.`);
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

  if (!process.stdin.isTTY) {
    throw new Error(`Missing required confirmation: "${message}". Use the corresponding flag in non-interactive mode.`);
  }

  return confirm({ message });
}

export async function promptSelect<T extends string>(
  flagValue: T | undefined,
  options: {
    message: string;
    choices: Array<{ name: string; value: T }>;
  },
): Promise<T> {
  if (flagValue !== undefined) return flagValue;

  if (!process.stdin.isTTY) {
    throw new Error(`Missing required selection: "${options.message}". Use the corresponding flag in non-interactive mode.`);
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
