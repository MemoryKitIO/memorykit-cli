#!/usr/bin/env node

/**
 * Replaces the local "file:../MemoryKit-TypeScript-SDK" dependency
 * with a real version range before publishing.
 *
 * Usage:
 *   node scripts/prepare-publish.js          # reads SDK version automatically
 *   node scripts/prepare-publish.js 0.2.0    # explicit version
 *   node scripts/prepare-publish.js --revert # restore file: link
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = resolve(__dirname, '..', 'package.json');
const sdkPkgPath = resolve(__dirname, '..', '..', 'MemoryKit-TypeScript-SDK', 'package.json');

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const dep = pkg.dependencies['@memorykitio/sdk'];

if (process.argv.includes('--revert')) {
  pkg.dependencies['@memorykitio/sdk'] = 'file:../MemoryKit-TypeScript-SDK';
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('✓ Reverted to file: link');
  process.exit(0);
}

if (dep.startsWith('file:')) {
  const sdkPkg = JSON.parse(readFileSync(sdkPkgPath, 'utf-8'));
  const version = process.argv[2] || sdkPkg.version;
  pkg.dependencies['@memorykitio/sdk'] = `^${version}`;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✓ Set @memorykitio/sdk to ^${version}`);
} else {
  console.log(`Already set to: ${dep}`);
}
