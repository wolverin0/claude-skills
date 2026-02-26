#!/usr/bin/env node

/**
 * atomic-json.mjs — Cross-platform atomic JSON file operations
 *
 * Zero external dependencies. Works on Linux, macOS, and Windows.
 * Replaces bash helpers (flock + jq) for environments that lack them.
 *
 * Usage:
 *   node atomic-json.mjs write <file> <json-string>
 *   node atomic-json.mjs read <file>
 *   node atomic-json.mjs append-index <index-file> <debate-id>
 *   node atomic-json.mjs merge <file> <partial-json>
 */

import { readFileSync, writeFileSync, renameSync, unlinkSync, existsSync, mkdirSync, openSync, closeSync, ftruncateSync, writeSync, readSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// --- Lock Implementation (mkdir-based, cross-platform) ---

const LOCK_TIMEOUT_MS = 5000;
const LOCK_RETRY_MS = 50;

function acquireLock(filePath) {
  const lockDir = filePath + '.lock';
  const deadline = Date.now() + LOCK_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      mkdirSync(lockDir);
      return lockDir;
    } catch (err) {
      if (err.code === 'EEXIST') {
        // Check for stale lock (older than 30s)
        try {
          const stat = statSync(lockDir);
          if (Date.now() - stat.mtimeMs > 30000) {
            try { unlinkSync(lockDir); } catch { /* ignore */ }
            try { require('fs').rmdirSync(lockDir); } catch { /* ignore */ }
            continue;
          }
        } catch { /* stat failed, lock may have been released */ }

        // Wait and retry
        const waitUntil = Date.now() + LOCK_RETRY_MS;
        while (Date.now() < waitUntil) { /* busy wait */ }
        continue;
      }
      throw err;
    }
  }

  throw new Error(`Could not acquire lock on ${filePath} after ${LOCK_TIMEOUT_MS}ms`);
}

function releaseLock(lockDir) {
  try {
    // rmdir only works on empty directories — that's our lock
    require('fs').rmdirSync(lockDir);
  } catch {
    // Already released or doesn't exist
  }
}

// Use dynamic import for fs.rmdirSync since we're in ESM
import { rmdirSync } from 'node:fs';

function releaseLockESM(lockDir) {
  try {
    rmdirSync(lockDir);
  } catch {
    // Already released
  }
}

// --- Atomic Write ---

function atomicWrite(filePath, data) {
  const absPath = resolve(filePath);
  const tmpPath = absPath + '.tmp.' + process.pid;

  // Validate JSON
  try {
    JSON.parse(data);
  } catch (err) {
    console.error(`ERROR: Invalid JSON: ${err.message}`);
    process.exit(1);
  }

  const lockDir = acquireLock(absPath);
  try {
    // Ensure parent directory exists
    const dir = dirname(absPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Write to temp file
    writeFileSync(tmpPath, data + '\n', 'utf8');

    // Atomic rename
    renameSync(tmpPath, absPath);
  } catch (err) {
    // Cleanup temp file on failure
    try { unlinkSync(tmpPath); } catch { /* ignore */ }
    throw err;
  } finally {
    releaseLockESM(lockDir);
  }
}

// --- Atomic Read ---

function atomicRead(filePath) {
  const absPath = resolve(filePath);

  if (!existsSync(absPath)) {
    console.error(`ERROR: File not found: ${absPath}`);
    process.exit(1);
  }

  const lockDir = acquireLock(absPath);
  try {
    const content = readFileSync(absPath, 'utf8');
    // Validate it's valid JSON
    JSON.parse(content);
    return content.trim();
  } finally {
    releaseLockESM(lockDir);
  }
}

// --- Append to Index ---

function appendIndex(indexFile, debateId) {
  const absPath = resolve(indexFile);
  const lockDir = acquireLock(absPath);

  try {
    let index;

    if (existsSync(absPath)) {
      const content = readFileSync(absPath, 'utf8');
      index = JSON.parse(content);
    } else {
      // Ensure parent directory exists
      const dir = dirname(absPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      index = { debates: [] };
    }

    // Check if already present
    if (index.debates.includes(debateId)) {
      console.log(`Already in index: ${debateId}`);
      return;
    }

    // Append
    index.debates.push(debateId);

    // Atomic write
    const tmpPath = absPath + '.tmp.' + process.pid;
    writeFileSync(tmpPath, JSON.stringify(index, null, 2) + '\n', 'utf8');
    renameSync(tmpPath, absPath);

    console.log(`Added to index: ${debateId}`);
  } catch (err) {
    console.error(`ERROR: Failed to update index: ${err.message}`);
    process.exit(1);
  } finally {
    releaseLockESM(lockDir);
  }
}

// --- Merge (partial update) ---

function mergeJson(filePath, partialJson) {
  const absPath = resolve(filePath);

  let partial;
  try {
    partial = JSON.parse(partialJson);
  } catch (err) {
    console.error(`ERROR: Invalid partial JSON: ${err.message}`);
    process.exit(1);
  }

  const lockDir = acquireLock(absPath);
  try {
    let current = {};
    if (existsSync(absPath)) {
      current = JSON.parse(readFileSync(absPath, 'utf8'));
    }

    // Shallow merge (top-level keys)
    const merged = { ...current, ...partial };

    // Deep merge for known nested objects
    if (current.telemetry && partial.telemetry) {
      merged.telemetry = { ...current.telemetry, ...partial.telemetry };
      if (current.telemetry.round_durations && partial.telemetry.round_durations) {
        merged.telemetry.round_durations = {
          ...current.telemetry.round_durations,
          ...partial.telemetry.round_durations
        };
      }
    }
    if (current.sessions && partial.sessions) {
      merged.sessions = { ...current.sessions, ...partial.sessions };
    }

    const tmpPath = absPath + '.tmp.' + process.pid;
    writeFileSync(tmpPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
    renameSync(tmpPath, absPath);
  } catch (err) {
    console.error(`ERROR: Failed to merge: ${err.message}`);
    process.exit(1);
  } finally {
    releaseLockESM(lockDir);
  }
}

// --- CLI Entry Point ---

const [,, command, ...args] = process.argv;

switch (command) {
  case 'write': {
    if (args.length < 2) {
      console.error('Usage: atomic-json.mjs write <file> <json-string>');
      process.exit(1);
    }
    atomicWrite(args[0], args[1]);
    break;
  }

  case 'read': {
    if (args.length < 1) {
      console.error('Usage: atomic-json.mjs read <file>');
      process.exit(1);
    }
    console.log(atomicRead(args[0]));
    break;
  }

  case 'append-index': {
    if (args.length < 2) {
      console.error('Usage: atomic-json.mjs append-index <index-file> <debate-id>');
      process.exit(1);
    }
    appendIndex(args[0], args[1]);
    break;
  }

  case 'merge': {
    if (args.length < 2) {
      console.error('Usage: atomic-json.mjs merge <file> <partial-json>');
      process.exit(1);
    }
    mergeJson(args[0], args[1]);
    break;
  }

  default:
    console.error(`Unknown command: ${command}`);
    console.error('Commands: write, read, append-index, merge');
    process.exit(1);
}
