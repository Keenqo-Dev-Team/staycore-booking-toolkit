import { createInterface } from 'node:readline/promises';
import { bold, dim, gold } from './logger.js';

const PRESETS = ['love-room', 'chateau-luxe', 'gite-nature', 'city-business'] as const;
export type PresetId = (typeof PRESETS)[number];

export function isPreset(value: string): value is PresetId {
  return (PRESETS as readonly string[]).includes(value);
}

export const AVAILABLE_PRESETS: readonly string[] = PRESETS;

export async function promptInput(
  question: string,
  options: { default?: string; required?: boolean } = {},
): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const suffix = options.default ? dim(` (${options.default})`) : '';
    const required = options.required ? gold(' *') : '';
    const answer = await rl.question(`${bold(question)}${required}${suffix} `);
    const trimmed = answer.trim();
    if (!trimmed && options.default !== undefined) return options.default;
    if (!trimmed && options.required) {
      // Re-prompt on empty + required.
      return promptInput(question, options);
    }
    return trimmed;
  } finally {
    rl.close();
  }
}

export async function promptChoice(
  question: string,
  choices: readonly string[],
  defaultChoice?: string,
): Promise<string> {
  console.log(bold(question));
  choices.forEach((c, i) => {
    const marker = c === defaultChoice ? gold('●') : ' ';
    console.log(`  ${marker} ${i + 1}. ${c}`);
  });
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = await rl.question(`${dim('Pick a number')} ${dim(`(${defaultChoice ?? '1'})`)} `);
    const trimmed = ans.trim();
    if (!trimmed && defaultChoice) return defaultChoice;
    const idx = Number.parseInt(trimmed, 10);
    if (Number.isFinite(idx) && idx >= 1 && idx <= choices.length) {
      return choices[idx - 1] as string;
    }
    if (choices.includes(trimmed)) return trimmed;
    return defaultChoice ?? (choices[0] as string);
  } finally {
    rl.close();
  }
}
