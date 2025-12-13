/**
 * Prompt Utilities
 *
 * Interactive prompts for CLI
 */

import * as readline from 'node:readline';

export interface PromptOptions {
  message: string;
  defaultValue?: string;
  validator?: (input: string) => boolean | string;
}

export interface SelectOptions {
  message: string;
  choices: Array<{ value: string; label: string }>;
  defaultValue?: string;
}

export interface ConfirmOptions {
  message: string;
  defaultValue?: boolean;
}

/**
 * Create readline interface
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompt for text input
 */
export async function prompt(options: PromptOptions): Promise<string> {
  const rl = createReadlineInterface();

  return new Promise((resolve) => {
    const defaultText = options.defaultValue ? ` (${options.defaultValue})` : '';
    rl.question(`${options.message}${defaultText}: `, (answer) => {
      rl.close();
      const value = answer.trim() || options.defaultValue || '';

      if (options.validator) {
        const validationResult = options.validator(value);
        if (validationResult !== true) {
          console.log(`❌ ${typeof validationResult === 'string' ? validationResult : 'Invalid input'}`);
          resolve(prompt(options)); // Retry
          return;
        }
      }

      resolve(value);
    });
  });
}

/**
 * Prompt for selection from list
 */
export async function select(options: SelectOptions): Promise<string> {
  const rl = createReadlineInterface();

  console.log(options.message);
  options.choices.forEach((choice, index) => {
    const isDefault = choice.value === options.defaultValue;
    const marker = isDefault ? '●' : '○';
    console.log(`  ${marker} ${index + 1}. ${choice.label}`);
  });

  return new Promise((resolve) => {
    rl.question('選択 (番号を入力): ', (answer) => {
      rl.close();
      const index = parseInt(answer.trim(), 10) - 1;

      if (index >= 0 && index < options.choices.length) {
        resolve(options.choices[index].value);
      } else if (!answer.trim() && options.defaultValue) {
        resolve(options.defaultValue);
      } else {
        console.log('❌ 無効な選択です');
        resolve(select(options)); // Retry
      }
    });
  });
}

/**
 * Prompt for yes/no confirmation
 */
export async function confirm(options: ConfirmOptions): Promise<boolean> {
  const rl = createReadlineInterface();

  const defaultText = options.defaultValue !== undefined
    ? options.defaultValue ? ' [Y/n]' : ' [y/N]'
    : ' [y/n]';

  return new Promise((resolve) => {
    rl.question(`${options.message}${defaultText}: `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();

      if (normalized === 'y' || normalized === 'yes') {
        resolve(true);
      } else if (normalized === 'n' || normalized === 'no') {
        resolve(false);
      } else if (!answer.trim() && options.defaultValue !== undefined) {
        resolve(options.defaultValue);
      } else {
        resolve(confirm(options)); // Retry
      }
    });
  });
}

/**
 * Display spinner while async operation runs
 */
export async function withSpinner<T>(
  message: string,
  operation: () => Promise<T>
): Promise<T> {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIndex = 0;
  let interval: NodeJS.Timeout | null = null;

  // Start spinner
  process.stdout.write(`${frames[0]} ${message}`);
  interval = setInterval(() => {
    frameIndex = (frameIndex + 1) % frames.length;
    process.stdout.write(`\r${frames[frameIndex]} ${message}`);
  }, 80);

  try {
    const result = await operation();
    clearInterval(interval);
    process.stdout.write(`\r✓ ${message}\n`);
    return result;
  } catch (error) {
    clearInterval(interval);
    process.stdout.write(`\r✗ ${message}\n`);
    throw error;
  }
}

/**
 * Display progress bar
 */
export function progressBar(current: number, total: number, width: number = 30): string {
  const percent = Math.min(current / total, 1);
  const filled = Math.round(width * percent);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percentText = Math.round(percent * 100).toString().padStart(3);
  return `[${bar}] ${percentText}% (${current}/${total})`;
}

/**
 * Clear console line
 */
export function clearLine(): void {
  process.stdout.write('\r\x1b[K');
}

/**
 * Print styled text
 */
export const styles = {
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
};

/**
 * Print a box around text
 */
export function box(text: string, padding: number = 1): string {
  const lines = text.split('\n');
  const maxWidth = Math.max(...lines.map((l) => l.length));
  const horizontal = '─'.repeat(maxWidth + padding * 2);
  const pad = ' '.repeat(padding);

  const result: string[] = [];
  result.push(`┌${horizontal}┐`);
  
  for (let i = 0; i < padding; i++) {
    result.push(`│${' '.repeat(maxWidth + padding * 2)}│`);
  }

  for (const line of lines) {
    const paddedLine = line.padEnd(maxWidth);
    result.push(`│${pad}${paddedLine}${pad}│`);
  }

  for (let i = 0; i < padding; i++) {
    result.push(`│${' '.repeat(maxWidth + padding * 2)}│`);
  }

  result.push(`└${horizontal}┘`);
  return result.join('\n');
}
