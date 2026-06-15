import { spawn } from 'node:child_process';

export type RunOptions = {
  cwd: string;
};

export async function run(cmd: string, args: string[], opts: RunOptions): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 0));
  });
}

function detectPackageManager(): 'pnpm' | 'npm' | 'yarn' | 'bun' {
  const ua = process.env['npm_config_user_agent'] ?? '';
  if (ua.startsWith('pnpm/')) return 'pnpm';
  if (ua.startsWith('yarn/')) return 'yarn';
  if (ua.startsWith('bun/')) return 'bun';
  return 'npm';
}

export async function installDependencies(projectDir: string): Promise<{ pm: string; code: number }> {
  const pm = detectPackageManager();
  const args = pm === 'yarn' ? [] : ['install'];
  const code = await run(pm, args, { cwd: projectDir });
  return { pm, code };
}

export async function gitInit(projectDir: string): Promise<number> {
  const init = await run('git', ['init', '-q'], { cwd: projectDir });
  if (init !== 0) return init;
  await run('git', ['add', '-A'], { cwd: projectDir });
  return run('git', ['commit', '-q', '-m', 'chore: scaffold from create-staycore-site'], {
    cwd: projectDir,
  });
}
