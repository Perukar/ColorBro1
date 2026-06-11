'use strict';

// test_repo_hygiene_contract.js
// PERUKAR — Repo Hygiene Contract
// Purpose: Verify .gitignore covers required transient artifact patterns
//          and that no transient files are tracked in git.
// Safety: Read-only. Does not modify any files. Does not touch www/core.js.
// Type: Infrastructure/documentation guard — NOT a runtime safety test.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passed = 0;
let failed = 0;
const results = [];

function assert(name, condition, detail) {
  if (condition) {
    results.push('  PASS ' + name);
    passed++;
  } else {
    results.push('  FAIL ' + name + (detail ? ' — ' + detail : ''));
    failed++;
  }
}

// ── Group runner ──────────────────────────────────────────────────────────────
const GROUPS = [];
function group(name, fn) { GROUPS.push([name, fn]); }

// ── Helpers ───────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname);

function readGitignore() {
  const p = path.join(ROOT, '.gitignore');
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

function gitLsFiles() {
  try {
    return execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch (e) {
    return null;
  }
}

function gitStatusIgnored() {
  try {
    return execSync('git status --short --ignored', { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    return null;
  }
}

function matchesTransient(filepath, patterns) {
  const name = path.basename(filepath);
  const norm = filepath.replace(/\\/g, '/');
  for (const pat of patterns) {
    if (pat.endsWith('/')) {
      // directory prefix
      const dir = pat.slice(0, -1);
      if (norm === dir || norm.startsWith(dir + '/')) return pat;
    } else if (pat.startsWith('*.')) {
      const ext = pat.slice(1); // e.g. '.tmp'
      if (name.endsWith(ext)) return pat;
    } else if (pat.includes('*')) {
      // simple glob: starts-with match (e.g. npm-debug.log*)
      const prefix = pat.replace(/\*/g, '');
      if (name.startsWith(prefix)) return pat;
    } else {
      if (name === pat || norm === pat) return pat;
    }
  }
  return null;
}

// ── Group 1: .gitignore exists ────────────────────────────────────────────────
group('gitignore-exists', () => {
  const content = readGitignore();
  assert('gitignore file present', content !== null, '.gitignore not found at repo root');
});

// ── Group 2: Required ignore entries ─────────────────────────────────────────
group('required-ignore-entries', () => {
  const content = readGitignore() || '';
  const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

  const REQUIRED = [
    '.tmp.driveupload/',
    '*.tmp',
    '*.log',
    'coverage/',
    'test-results/',
    'playwright-report/',
    'node_modules/',
    '.env',
    '.env.*',
    '*.local',
    'index.lock.stale*',
    '.lock.stale',
  ];

  for (const entry of REQUIRED) {
    assert('gitignore contains: ' + entry, lines.includes(entry),
      'entry "' + entry + '" not found in .gitignore');
  }
});

// ── Group 3: No tracked transient files ───────────────────────────────────────
group('no-tracked-transient-files', () => {
  const tracked = gitLsFiles();
  if (tracked === null) {
    assert('git ls-files available', false, 'git command failed');
    return;
  }
  assert('git ls-files returned results', tracked.length > 0, 'no tracked files found (unexpected)');

  const FORBIDDEN = [
    '.tmp.driveupload/',
    '.DS_Store',
    'Thumbs.db',
    'desktop.ini',
    '.env',
    '*.tmp',
    '*.temp',
    '*.cache',
    '*.log',
    'index.lock.stale*',
    '.lock.stale',
    'coverage/',
    'test-results/',
    'playwright-report/',
    'node_modules/',
  ];

  const violations = [];
  for (const f of tracked) {
    const matched = matchesTransient(f, FORBIDDEN);
    if (matched) violations.push(f + ' (matched: ' + matched + ')');
  }

  assert('no forbidden transient files tracked by git',
    violations.length === 0,
    violations.length > 0 ? 'tracked: ' + violations.join(', ') : '');
});

// ── Group 4: .tmp.driveupload/ is ignored, not untracked ─────────────────────
group('driveupload-ignored-not-untracked', () => {
  const driveuploadPath = path.join(ROOT, '.tmp.driveupload');
  const exists = fs.existsSync(driveuploadPath);

  if (!exists) {
    // Folder absent — pass (nothing to be untracked)
    assert('.tmp.driveupload absent or ignored (absent)', true);
    return;
  }

  const statusOutput = gitStatusIgnored() || '';
  // Untracked appears as "?? .tmp.driveupload/"
  const appearsUntracked = statusOutput.split('\n').some(l => /^\?\?.*\.tmp\.driveupload/.test(l));
  // Ignored appears as "!! .tmp.driveupload/"
  const appearsIgnored = statusOutput.split('\n').some(l => /^!!.*\.tmp\.driveupload/.test(l));

  assert('.tmp.driveupload/ is not untracked', !appearsUntracked,
    '.tmp.driveupload/ appears as ?? (untracked) — add to .gitignore');
  assert('.tmp.driveupload/ appears as ignored', appearsIgnored,
    '.tmp.driveupload/ not listed as !! ignored in git status --ignored');
});

// ── Group 5: www/core.js not modified by this task ───────────────────────────
group('core-js-unmodified', () => {
  try {
    const diff = execSync('git diff --name-only', { cwd: ROOT, encoding: 'utf8' }).trim();
    const modifiedFiles = diff.split('\n').filter(Boolean);
    const coreModified = modifiedFiles.some(f => f === 'www/core.js' || f.endsWith('/core.js'));
    assert('www/core.js not modified', !coreModified,
      'www/core.js appears in git diff — this task must not change runtime behavior');
  } catch (e) {
    assert('git diff available', false, 'git diff failed: ' + e.message);
  }
});

// ── Group 6: .gitignore diff check ───────────────────────────────────────────
group('gitignore-diff-check', () => {
  try {
    execSync('git diff --check', { cwd: ROOT, encoding: 'utf8' });
    assert('git diff --check passes', true);
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    assert('git diff --check passes', false, out.trim().slice(0, 200));
  }
});

// ── Group 7: No .env files tracked ───────────────────────────────────────────
group('no-env-files-tracked', () => {
  const tracked = gitLsFiles();
  if (tracked === null) { assert('git ls-files available', false); return; }
  const envFiles = tracked.filter(f => {
    const name = path.basename(f);
    return name === '.env' || name.startsWith('.env.');
  });
  assert('no .env files tracked', envFiles.length === 0,
    envFiles.length > 0 ? 'tracked: ' + envFiles.join(', ') : '');
});

// ── Group 8: node_modules not tracked ────────────────────────────────────────
group('node-modules-not-tracked', () => {
  const tracked = gitLsFiles();
  if (tracked === null) { assert('git ls-files available', false); return; }
  const nmFiles = tracked.filter(f => f.startsWith('node_modules/') || f.includes('/node_modules/'));
  assert('node_modules/ not tracked', nmFiles.length === 0,
    nmFiles.length > 0 ? 'tracked ' + nmFiles.length + ' node_modules files' : '');
});

// ── Run all groups ────────────────────────────────────────────────────────────
console.log('\n--- REPO HYGIENE CONTRACT GROUPS (' + GROUPS.length + ') ---');
for (const [name, fn] of GROUPS) {
  try { fn(); } catch (e) {
    results.push('  ERROR ' + name + ': ' + e.message);
    failed++;
  }
}

for (const line of results) console.log(line);
console.log('\nTotal: ' + passed + ' passed, ' + failed + ' failed');

if (failed > 0) {
  console.error('\nWWW repo hygiene contract FAILED (' + failed + ' assertions failed)');
  process.exit(1);
}
console.log('\nWWW repo hygiene contract passed (' + passed + ' assertions, ' + GROUPS.length + ' groups)');
