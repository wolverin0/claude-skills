#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const localContract = path.join(__dirname, 'handoff-contract.cjs');
const contract = require(fs.existsSync(localContract) ? localContract : path.join(__dirname, '../src/handoff-contract.cjs'));

function main(argv = process.argv.slice(2)) {
  const allowed = new Set(['--draft', '--session-id', '--project-dir', '--generation', '--corr']);
  const optional = '--recover-linked-temp';
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    if ((!allowed.has(argv[i]) && argv[i] !== optional) || args[argv[i]] !== undefined || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error('invalid publisher arguments');
    args[argv[i]] = argv[i + 1];
  }
  if ([...allowed].some((key) => !args[key])) throw new Error('publisher requires draft, session-id, project-dir, generation and corr');
  const cwd = fs.realpathSync(args['--project-dir']);
  const directory = contract.handoffsDirectory(cwd);
  const draft = path.resolve(args['--draft']);
  if (path.dirname(draft) !== directory || fs.lstatSync(draft).isSymbolicLink()) throw new Error('draft must be a regular file directly inside project handoffs/');
  if (!fs.statSync(draft).isFile() || fs.statSync(draft).size > contract.MAX_BYTES) throw new Error('invalid draft');
  const body = contract.readRegular(draft, contract.MAX_BYTES);
  const identity = { session_id: args['--session-id'], project_id: contract.projectIdentity(cwd),
    generation: args['--generation'], corr: args['--corr'] };
  const markdown = contract.createPublished(body, identity);
  const file = path.join(directory, `handoff-${identity.generation}.md`);
  if (args[optional]) {
    const recovered = contract.recoverLinkedPublication(file, args[optional], identity,
      contract.validatePublished(markdown, identity).body_sha256);
    console.log(JSON.stringify({ status: 'prepared', file: path.basename(file), ...identity, ...recovered }));
    return;
  }
  try { contract.publishExclusive(file, markdown); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (!fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink()) throw new Error('existing publication is not a regular file');
    const existing = contract.readRegular(file);
    const meta = contract.validatePublished(existing, identity);
    if (meta.body_sha256 !== contract.validatePublished(markdown, identity).body_sha256) throw new Error('generation already published with different content');
  }
  console.log(JSON.stringify({ status: 'prepared', file: path.basename(file), ...identity }));
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`handoff publication aborted: ${error.message}`); process.exitCode = 1; }
}
module.exports = { main };
