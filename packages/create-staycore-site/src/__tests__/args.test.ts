import { describe, expect, it } from 'vitest';
import { parseArgs } from '../args.js';

describe('parseArgs', () => {
  it('reads the positional project name', () => {
    const args = parseArgs(['mon-site']);
    expect(args.projectName).toBe('mon-site');
  });

  it('parses --org-slug=value', () => {
    const args = parseArgs(['mon-site', '--org-slug=stayflex-immo']);
    expect(args.orgSlug).toBe('stayflex-immo');
  });

  it('parses --org-slug value (space)', () => {
    const args = parseArgs(['mon-site', '--org-slug', 'stayflex-immo']);
    expect(args.orgSlug).toBe('stayflex-immo');
  });

  it('parses boolean flags', () => {
    const args = parseArgs(['x', '--no-install', '--no-git', '-y']);
    expect(args.noInstall).toBe(true);
    expect(args.noGit).toBe(true);
    expect(args.yes).toBe(true);
  });

  it('parses preset', () => {
    const args = parseArgs(['x', '--preset=love-room']);
    expect(args.preset).toBe('love-room');
  });

  it('parses help', () => {
    expect(parseArgs(['--help']).help).toBe(true);
    expect(parseArgs(['-h']).help).toBe(true);
  });

  it('preserves quoted brand name with spaces', () => {
    const args = parseArgs(['x', '--brand-name=Les Suites Bisous']);
    expect(args.brandName).toBe('Les Suites Bisous');
  });
});
