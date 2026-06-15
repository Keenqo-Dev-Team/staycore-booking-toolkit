/**
 * Minimal coloured logger — zero deps, works on every TTY where ANSI escapes
 * are supported. Non-TTY output (CI, pipes) is automatically stripped.
 */

const useColor = process.stdout.isTTY && process.env['NO_COLOR'] !== '1';

const paint = (open: string, close: string) => (s: string) =>
  useColor ? `\x1b[${open}m${s}\x1b[${close}m` : s;

export const bold = paint('1', '22');
export const dim = paint('2', '22');
export const gold = paint('33', '39');
export const cyan = paint('36', '39');
export const green = paint('32', '39');
export const red = paint('31', '39');
export const grey = paint('90', '39');

export function logInfo(msg: string): void {
  console.log(`${cyan('ℹ')} ${msg}`);
}
export function logSuccess(msg: string): void {
  console.log(`${green('✓')} ${msg}`);
}
export function logWarn(msg: string): void {
  console.log(`${gold('⚠')} ${msg}`);
}
export function logError(msg: string): void {
  console.error(`${red('✗')} ${msg}`);
}
export function logStep(step: number, total: number, msg: string): void {
  console.log(`${grey(`[${step}/${total}]`)} ${msg}`);
}
