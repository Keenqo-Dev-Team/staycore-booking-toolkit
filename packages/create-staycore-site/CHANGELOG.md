# create-staycore-site

## 0.1.0

### Minor Changes

- d3e5a94: Initial release of `create-staycore-site` — npx scaffolder for direct booking websites wired to the Stay'Core PMS.

  - Interactive (`npx create-staycore-site mon-site`) and non-interactive (`--non-interactive`) modes
  - Validates the org against `GET /api/v1/book/{slug}` before scaffolding
  - Pulls live properties from the PMS to pre-fill `src/data/properties.ts`
  - Copies the canonical Vite + React + TS + Tailwind template and overlays one of 4 presets (love-room, chateau-luxe, gite-nature, city-business)
  - Auto-detects the user's package manager (pnpm/npm/yarn/bun) and runs `install` + `git init` (skippable with `--no-install` / `--no-git`)
  - Zero external dependencies beyond `@staycore/booking-sdk`
  - 7 vitest unit tests on the args parser
  - End-to-end smoke-tested: scaffold → install → `vite build` against the live STAYFLEX IMMO org (218 kB JS / 18 kB CSS gzipped)

### Patch Changes

- Updated dependencies [47e23fa]
  - @staycore/booking-sdk@0.1.0
