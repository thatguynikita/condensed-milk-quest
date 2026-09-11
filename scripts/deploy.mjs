#!/usr/bin/env node
// Deploys the built dist/ to S3-compatible object storage via the AWS CLI.
// Works with both real AWS S3 and Yandex Object Storage — they differ only
// by the endpoint, so leave S3_ENDPOINT unset for AWS and point it at
// https://storage.yandexcloud.net for Yandex.
//
// Zero npm dependencies — shells out to `aws s3api`, which must be
// installed and authenticated.
//
// Usage (always run via `npm run deploy`, which builds first):
//   npm run deploy -- --dry-run               # preview everything, no network calls, no upload
//   npm run deploy                             # deploy the full dist/ manifest
//   npm run deploy -- --bucket <bucket>        # bucket passed explicitly instead of via S3_BUCKET
//   npm run deploy -- --profile <name>         # use a specific ~/.aws profile
//   npm run deploy -- assets/index-abc123.js   # deploy only this file (still validated against the manifest)
//
// Env vars — set them in your local .env (gitignored); `npm run deploy`
// picks it up automatically via Node's --env-file-if-exists:
//   S3_BUCKET    target bucket. Never hardcoded here or anywhere in this repo.
//   S3_ENDPOINT  endpoint URL. Blank/unset = real AWS.
//   S3_REGION    region passed through to the CLI (e.g. ru-central1 for Yandex).
// AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY are read by `aws` itself, as is
// AWS_PROFILE — leave them unset to fall back to ~/.aws/credentials.
//
// With no file arguments, uploads every file under dist/ (built fresh by
// `npm run build` beforehand) — not "files changed since last deploy".
// index.html is always uploaded last, after every hashed asset it
// references, so there's never a window where a live index.html points at
// an asset that isn't there yet. If any asset fails, index.html is skipped
// entirely rather than going live pointing at something missing.
//
// A full deploy also prunes: once every upload has succeeded, any key in
// the bucket that no longer exists in dist/ is deleted. Deploying a subset
// of files (by passing filenames) never prunes.

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

// -------- cache-control --------

function cacheControlFor(key) {
  // index.html must be revalidated or a deploy never reaches anyone.
  if (key === 'index.html') return 'no-cache';
  // Vite content-hashes everything under assets/ — a changed file gets a new
  // name, so the old one can be cached indefinitely.
  if (key.startsWith('assets/')) return 'public, max-age=31536000, immutable';
  // Favicons, og-image, webmanifest: stable but not hashed, so not immutable.
  return 'public, max-age=86400';
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
  const args = {
    dryRun: false,
    bucket: null,
    profile: null,
    endpoint: process.env.S3_ENDPOINT || null,
    region: process.env.S3_REGION || null,
    files: [],
  };
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
  if (!args.bucket) args.bucket = process.env.S3_BUCKET || null;
  return args;
}

// Flags shared by every `aws s3api` call. An unset endpoint has to be
// omitted entirely rather than passed empty — the CLI would swallow the
// following argument as its value.
function connectionArgs(args) {
  const flags = [];
  if (args.endpoint) flags.push('--endpoint-url', args.endpoint);
  if (args.region) flags.push('--region', args.region);
  if (args.profile) flags.push('--profile', args.profile);
  return flags;
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

function errText(err) {
  return err.stderr ? err.stderr.toString().trim() : err.message;
}

// -------- prune: drop bucket keys that dist/ no longer has --------

function listRemoteKeys(args) {
  const out = execFileSync(
    'aws',
    [
      's3api',
      'list-objects-v2',
      '--bucket',
      args.bucket,
      '--query',
      'Contents[].Key',
      '--output',
      'text',
      ...connectionArgs(args),
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const trimmed = out.trim();
  if (!trimmed || trimmed === 'None') return [];
  return trimmed.split(/\s+/);
}

function prune(args, keep) {
  let remote;
  try {
    remote = listRemoteKeys(args);
  } catch (err) {
    console.error(`\nwarning: couldn't list the bucket to prune stale files: ${errText(err)}`);
    return 0;
  }

  const stale = remote.filter((key) => !keep.has(key));
  if (!stale.length) {
    console.log('\nNothing stale to prune.');
    return 0;
  }

  console.log(`\nPruning ${stale.length} file(s) no longer in dist/:\n`);
  let failed = 0;
  for (const key of stale) {
    try {
      execFileSync(
        'aws',
        ['s3api', 'delete-object', '--bucket', args.bucket, '--key', key, ...connectionArgs(args)],
        { stdio: 'pipe' },
      );
      console.log(`  deleted   ${key}`);
    } catch (err) {
      console.error(`  FAILED    ${key}: ${errText(err)}`);
      failed++;
    }
  }
  return failed;
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
      `Dry run${selectionNote} — ${manifest.length} file(s) would be uploaded to bucket "${args.bucket || '<bucket not set>'}" via ${args.endpoint || 'AWS S3 (default endpoint)'}:\n`,
    );
    for (const key of manifest) {
      console.log(`  ${key.padEnd(34)} ${contentTypeFor(key).padEnd(38)} ${cacheControlFor(key)}`);
    }
    console.log(
      args.files.length
        ? '\nPruning is skipped when specific files are given, so nothing would be deleted.'
        : '\nAfterwards, any key in the bucket not listed above would be deleted. Listing\nthem needs a network call, so they are not shown here.',
    );
    console.log('\nNo network calls made.');
    return;
  }

  if (!args.bucket) {
    console.error('Error: no bucket specified. Set S3_BUCKET (e.g. in .env) or pass --bucket <name>.');
    process.exit(1);
  }

  warnIfDirty();

  console.log(`Deploying ${manifest.length} file(s)${selectionNote} to bucket "${args.bucket}":\n`);

  const results = { ok: [], failed: [], skipped: [] };
  for (const key of manifest) {
    // index.html sorts last, so by the time we reach it every asset it
    // references has been attempted. Publishing it over a failed asset
    // would point the live site at something that isn't there.
    if (key === 'index.html' && results.failed.length) {
      console.error(`  SKIPPED   ${key} — not publishing an index that points at failed uploads`);
      results.skipped.push(key);
      continue;
    }

    const cmd = [
      's3api',
      'put-object',
      '--body',
      join(DIST, key),
      '--bucket',
      args.bucket,
      '--key',
      key,
      '--content-type',
      contentTypeFor(key),
      '--cache-control',
      cacheControlFor(key),
      ...connectionArgs(args),
    ];

    try {
      execFileSync('aws', cmd, { stdio: 'pipe' });
      console.log(`  uploaded  ${key}`);
      results.ok.push(key);
    } catch (err) {
      console.error(`  FAILED    ${key}: ${errText(err)}`);
      results.failed.push(key);
    }
  }

  const skippedNote = results.skipped.length ? `, ${results.skipped.length} skipped` : '';
  console.log(`\n${results.ok.length} uploaded, ${results.failed.length} failed${skippedNote}.`);

  if (results.failed.length) {
    console.error('Failed keys: ' + results.failed.join(', '));
    console.error('Skipping the prune step — the bucket is left as-is.');
    process.exit(1);
  }

  // Only a full deploy knows the complete set of keys that should exist.
  if (args.files.length) {
    console.log('Pruning skipped: specific files were given, so the rest of the bucket is untouched.');
    return;
  }

  const pruneFailures = prune(args, new Set(fullManifest));
  if (pruneFailures) {
    console.error(`\n${pruneFailures} file(s) could not be deleted. Uploads themselves all succeeded.`);
    process.exit(1);
  }
}

main();
