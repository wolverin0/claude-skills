#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node redact-artifacts.js [root] [extra-secret ...]\n\nScans test-manifest*, test-manifest, and .playwright-cli folders under root.\nAlso accepts a manifest folder directly as root.\n\nRedacts env vars:\n  VALIDATION_EMAIL\n  VALIDATION_PASSWORD\n  VALIDATION_SECRET\n`);
  process.exit(0);
}
const root = path.resolve(args[0] || process.cwd());
const targets = args.slice(1);
const secretValues = [
  process.env.VALIDATION_PASSWORD,
  process.env.VALIDATION_EMAIL,
  process.env.VALIDATION_SECRET,
  ...targets,
].filter(Boolean);

const defaultDirs = ['test-manifest', '.playwright-cli'];
const textExt = new Set(['.json', '.yml', '.yaml', '.txt', '.log', '.html', '.md', '.csv']);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function redactFile(file) {
  if (!textExt.has(path.extname(file).toLowerCase())) return 0;
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return 0;
  }
  let changed = false;
  for (const secret of secretValues) {
    if (!secret || secret.length < 4) continue;
    if (text.includes(secret)) {
      text = text.split(secret).join('[redacted]');
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, text);
    return 1;
  }
  return 0;
}

function collectTargets(rootDir) {
  const files = [];
  const base = path.basename(rootDir).toLowerCase();
  if (base === '.playwright-cli' || base.startsWith('test-manifest')) {
    return walk(rootDir, files);
  }
  if (!fs.existsSync(rootDir)) return files;
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === '.playwright-cli' || entry.name.startsWith('test-manifest')) {
      walk(path.join(rootDir, entry.name), files);
    }
  }
  for (const dir of defaultDirs) walk(path.join(rootDir, dir), files);
  return [...new Set(files)];
}

let files = collectTargets(root);
let changed = 0;
for (const file of files) changed += redactFile(file);

const leaks = [];
for (const file of files) {
  if (!textExt.has(path.extname(file).toLowerCase())) continue;
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  for (const secret of secretValues) {
    if (secret && secret.length >= 4 && text.includes(secret)) leaks.push(file);
  }
}

if (leaks.length) {
  console.error(JSON.stringify({ ok: false, changed, leaks }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, changed, checked: files.length }, null, 2));
