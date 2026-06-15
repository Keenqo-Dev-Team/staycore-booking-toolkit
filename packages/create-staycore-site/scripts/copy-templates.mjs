#!/usr/bin/env node
/**
 * Copy ../../templates into ./templates so the published npm bundle contains
 * the canonical template + presets. Skipped in dev (the CLI also resolves the
 * monorepo path), but mandatory before publishing.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..', '..');
const SRC = path.join(REPO_ROOT, 'templates');
const DEST = path.resolve(SCRIPT_DIR, '..', 'templates');

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.vite') continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(from, to);
    else await fs.copyFile(from, to);
  }
}

await fs.rm(DEST, { recursive: true, force: true });
await copyDir(SRC, DEST);
console.log(`✓ Templates copied to ${DEST}`);
