#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const home = os.homedir();
const groups = {
  validation: [
    path.join(home, '.agents', 'skills', 'validation'),
    path.join(home, '.claude', 'skills', 'validation'),
    path.join(home, '.codex', 'skills', 'validation'),
  ],
  'battle-test': [
    path.join(home, '.claude', 'skills', 'battle-test'),
    path.join(home, '.codex', 'skills', 'battle-test'),
  ],
};

function files(root, dir = root) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(root, full) : [path.relative(root, full).replace(/\\/g, '/')];
  }).sort();
}

function digest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function compare(name, roots) {
  const allFiles = [...new Set(roots.flatMap(root => files(root)))].sort();
  const differences = [];
  for (const rel of allFiles) {
    const values = roots.map(root => {
      const file = path.join(root, rel);
      return fs.existsSync(file) ? digest(file) : 'MISSING';
    });
    if (new Set(values).size > 1) differences.push({ file: rel, values });
  }
  for (const root of roots) if (!fs.existsSync(root)) differences.push({ root, error: 'root-missing' });
  return { name, roots, fileCount: allFiles.length, differences, equal: differences.length === 0 };
}

const requested = process.argv.includes('--skill')
  ? process.argv[process.argv.indexOf('--skill') + 1]
  : 'all';
const names = requested === 'all' ? Object.keys(groups) : [requested];
if (names.some(name => !groups[name])) {
  console.error('Usage: node verify-provider-parity.js [--skill validation|battle-test|all]');
  process.exit(2);
}
const results = names.map(name => compare(name, groups[name]));
console.log(JSON.stringify({ ok: results.every(result => result.equal), results }, null, 2));
process.exit(results.every(result => result.equal) ? 0 : 1);
