#!/usr/bin/env node
// Deploys the built dist/ to Yandex Object Storage via the `yc` CLI.
// Zero npm dependencies — shells out to `yc storage s3api put-object`,
// same tool the sibling nikita.sh repo's scripts/deploy.mjs uses.
//
// Usage (always run via `npm run deploy`, which builds first):
//   npm run deploy -- --dry-run                    # preview everything, no network calls, no dist/ upload
//   CAT_NIKITA_BUCKET=<bucket> npm run deploy       # deploy the full dist/ manifest
//   npm run deploy -- --bucket <bucket>             # same, bucket passed explicitly instead
//   npm run deploy -- assets/index-abc123.js        # deploy only this file (still validated against the manifest)
//
// The bucket name is never hardcoded here or anywhere else in this repo —
// set CAT_NIKITA_BUCKET in your local .env (gitignored) or export it in
// your shell. `npm run deploy` loads .env automatically if present
// (Node's --env-file-if-exists), so a local .env is enough.
//
// With no file arguments, uploads every file under dist/ (built fresh by
// `npm run build` beforehand) — not "files changed since last deploy".
// index.html is always uploaded last, after every hashed asset it
// references, so there's never a window where a live index.html points at
// an asset that isn't there yet.

import { readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

// -------- content-type table --------
// S3-compatible storage doesn't infer charset from extension, so this is
// the part that replaces picking it by hand (and getting it wrong).

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function contentTypeFor(key) {
  const ext = extname(key).toLowerCase();
  const type = CONTENT_TYPES[ext];
  if (!type) {
    console.warn(
      `warning: no content-type mapping for "${ext}" (${key}) — falling back to application/octet-stream`,
    );
    return 'application/octet-stream';
  }
  return type;
}

// -------- manifest: everything under dist/, index.html forced last --------

function buildManifest() {
  if (!existsSync(DIST)) {
    console.error(
      `Error: ${relative(ROOT, DIST)}/ doesn't exist. Run "npm run build" first (or just "npm run deploy", which does).`,
    );
    process.exit(1);
  }
  const files = [];
  for (const name of readdirSync(DIST, { recursive: true })) {
    if (name.split(/[\\/]/).some((part) => part.startsWith('.'))) continue; // .DS_Store etc.
    const full = join(DIST, name);
    if (statSync(full).isDirectory()) continue;
    files.push(relative(DIST, full).split('\\').join('/'));
  }
  // index.html last: it references hashed asset filenames, so every asset
  // it points at must already exist in the bucket before it goes live.
  files.sort((a, b) => (a === 'index.html' ? 1 : 0) - (b === 'index.html' ? 1 : 0));
  return files;
}

// -------- args --------

function parseArgs(argv) {
  const args = { dryRun: false, bucket: null, profile: process.env.YC_PROFILE || null, files: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') args.dryRun = true;
    else if (argv[i] === '--bucket') args.bucket = argv[++i];
    else if (argv[i] === '--profile') args.profile = argv[++i];
    else if (argv[i].startsWith('--')) {
      console.error(`Error: unknown flag "${argv[i]}".`);
      process.exit(1);
    } else {
      args.files.push(argv[i].replace(/^\.\//, '').split('\\').join('/'));
    }
  }
  if (!args.bucket) args.bucket = process.env.CAT_NIKITA_BUCKET || null;
  return args;
}

// Narrows the full manifest down to just the requested files, if any were
// given — erroring out (not silently skipping) on anything not present in
// dist/, so a typo can't silently deploy nothing.
function selectFiles(fullManifest, requested) {
  if (!requested.length) return fullManifest;
  const manifestSet = new Set(fullManifest);
  const invalid = requested.filter((f) => !manifestSet.has(f));
  if (invalid.length) {
    console.error(`Error: not found in dist/: ${invalid.join(', ')}`);
    console.error('Run with --dry-run (no file arguments) to see everything deployable.');
    process.exit(1);
  }
  return fullManifest.filter((f) => requested.includes(f));
}

function warnIfDirty() {
  try {
    const out = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' });
    if (out.trim()) {
      console.warn(
        "warning: working tree has uncommitted changes — deploying what was just built, not necessarily what's committed.\n",
      );
    }
  } catch {
    // not a git repo / git unavailable — nothing to warn about
  }
}

// -------- run --------

function main() {
  const args = parseArgs(process.argv.slice(2));
  const fullManifest = buildManifest();
  const manifest = selectFiles(fullManifest, args.files);
  const selectionNote = args.files.length
    ? ` (${manifest.length} of ${fullManifest.length} files selected)`
    : '';

  if (args.dryRun) {
    console.log(
      `Dry run${selectionNote} — ${manifest.length} file(s) would be uploaded to bucket "${args.bucket || '<bucket not set>'}":\n`,
    );
    for (const key of manifest) {
      console.log(`  ${key.padEnd(40)} -> ${contentTypeFor(key)}`);
    }
    console.log('\nNo network calls made.');
    return;
  }

  if (!args.bucket) {
    console.error(
      'Error: no bucket specified. Set CAT_NIKITA_BUCKET (e.g. in .env) or pass --bucket <name>.',
    );
    process.exit(1);
  }

  warnIfDirty();

  console.log(`Deploying ${manifest.length} file(s)${selectionNote} to bucket "${args.bucket}":\n`);

  const results = { ok: [], failed: [] };
  for (const key of manifest) {
    const contentType = contentTypeFor(key);
    const body = join(DIST, key);
    const cmd = [
      'storage',
      's3api',
      'put-object',
      '--body',
      body,
      '--bucket',
      args.bucket,
      '--key',
      key,
      '--content-type',
      contentType,
    ];
    if (args.profile) cmd.push('--profile', args.profile);

    try {
      execFileSync('yc', cmd, { stdio: 'pipe' });
      console.log(`  uploaded  ${key}`);
      results.ok.push(key);
    } catch (err) {
      console.error(`  FAILED    ${key}: ${err.stderr ? err.stderr.toString().trim() : err.message}`);
      results.failed.push(key);
    }
  }

  console.log(`\n${results.ok.length} uploaded, ${results.failed.length} failed.`);
  if (results.failed.length) {
    console.error('Failed keys: ' + results.failed.join(', '));
    process.exit(1);
  }
}

main();
