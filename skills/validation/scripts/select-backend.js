#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createRequire } = require('module');

function commandExists(command, args = ['--help']) {
  const result = spawnSync(command, args, { stdio: 'ignore', shell: process.platform === 'win32' });
  return result.status === 0;
}

function packageHas(root, name) {
  const pkg = path.join(root, 'package.json');
  if (!fs.existsSync(pkg)) return false;
  try {
    const data = JSON.parse(fs.readFileSync(pkg, 'utf8'));
    return !!(data.dependencies?.[name] || data.devDependencies?.[name]);
  } catch {
    return false;
  }
}

function requireFrom(root, name) {
  try {
    const req = createRequire(path.join(root, 'package.json'));
    req.resolve(name);
    return true;
  } catch {
    return false;
  }
}

const root = process.cwd();
const checks = {
  agentBrowser: commandExists('agent-browser'),
  playwrightLocal: packageHas(root, 'playwright') || packageHas(root, '@playwright/test') || requireFrom(root, 'playwright'),
  playwrightCli: commandExists('npx', ['--no-install', 'playwright-cli', '--help']),
  browserHarness: packageHas(root, 'browser-harness') || requireFrom(root, 'browser-harness'),
};

let backend = 'manual';
let reason = 'No deterministic browser backend detected. Ask the user or use an MCP/browser plugin.';
if (process.env.VALIDATION_BACKEND) {
  backend = process.env.VALIDATION_BACKEND;
  reason = 'VALIDATION_BACKEND override is set.';
} else if (checks.agentBrowser) {
  backend = 'agent-browser';
  reason = 'agent-browser command is available.';
} else if (checks.playwrightLocal) {
  backend = 'playwright-local';
  reason = 'Target project has Playwright installed or resolvable.';
} else if (checks.playwrightCli) {
  backend = 'playwright-cli';
  reason = 'playwright-cli is available through npx --no-install.';
} else if (checks.browserHarness) {
  backend = 'browser-harness';
  reason = 'browser-harness package is installed or resolvable.';
}

console.log(JSON.stringify({
  ok: backend !== 'manual',
  backend,
  reason,
  cwd: root,
  checks,
}, null, 2));

process.exit(0);
