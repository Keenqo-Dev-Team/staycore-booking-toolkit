#!/usr/bin/env node
import { main } from '../dist/cli.js';

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error('\x1b[31m✗\x1b[39m', err?.message ?? err);
    process.exit(1);
  },
);
