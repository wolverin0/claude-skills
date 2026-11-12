'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const SECTIONS = ['Context', 'Current State', 'Open Threads', 'Next Steps',
  'Constraints & Gotchas', 'Relevant Files', 'Corr ID', 'Suggested Skills & Setup'];
const MAX_BYTES = 256 * 1024;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const TOKEN = /^[A-Za-z0-9_.:-]{1,160}$/;
const SENTINEL = /^(?:(?:session(?:-id)?|corr(?:-id)?|correlation(?:-id)?|handoff)-)?(?:unknown|null|undefined|unverified|unavailable|none|nil|unset|missing|pending|tbd|todo|invalid|na|not-(?:available|applicable|verified|known))(?:-(?:session(?:-id)?|corr(?:-id)?|identity))?$/;
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const unknownIdentity = value => typeof value !== 'string' || SENTINEL.test(value.toLowerCase().replace(/[._:]+/g, '-'));

function projectIdentity(cwd) {
  let canonical = fs.realpathSync(cwd).replace(/\\/g, '/').replace(/\/$/, '');
  if (process.platform === 'win32') canonical = canonical.toLowerCase();
  return digest(canonical);
}

function checkIdentity(meta) {
  if (!meta || typeof meta.session_id !== 'string' || typeof meta.corr !== 'string'
    || typeof meta.project_id !== 'string' || typeof meta.generation !== 'string'
    || unknownIdentity(meta.session_id) || unknownIdentity(meta.corr)
    || !TOKEN.test(meta.session_id || '') || !TOKEN.test(meta.corr || '')
    || !UUID.test(meta.generation || '') || !/^[a-f0-9]{64}$/.test(meta.project_id || '')) {
    throw new Error('handoff identity is unknown or invalid');
  }
}

function checkBody(body) {
  if (Buffer.byteLength(body, 'utf8') > MAX_BYTES || body.includes('\u0000')) throw new Error('invalid handoff size/content');
  if (/<!--\s*handoff(?:-complete)?:/i.test(body)) throw new Error('draft contains reserved publication markers');
  // Mask non-visible material without moving heading/body offsets. Comments
  // may span lines or remain unclosed; neither they nor fenced examples prove
  // the presence of a section or any readable state within it.
  const uncommented = body.replace(/<!--[\s\S]*?(?:-->|$)/g, (comment) => comment.replace(/[^\r\n]/g, ' '));
  let fence = null;
  const visible = uncommented.split(/(?<=\n)/).map((line) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})([^\r\n]*)\r?(?:\n)?$/);
    if (fence) {
      // A closing fence permits whitespace only. ` ```md ` is code content,
      // not a close that can expose subsequent hidden headings to validation.
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && /^[ \t]*$/.test(marker[2])) fence = null;
      return line.replace(/[^\r\n]/g, ' ');
    }
    if (marker) {
      if (marker[1][0] === '`' && marker[2].includes('`')) throw new Error('malformed fenced block');
      fence = marker[1];
      return line.replace(/[^\r\n]/g, ' ');
    }
    // Handoff prose uses visible Markdown only. Raw HTML can suppress Markdown
    // parsing (script/style/pre/textarea and generic blocks), or hide body text
    // via attributes/CSS. Reject tags, declarations, CDATA and instructions
    // outside fenced literal examples rather than trying to emulate a browser.
    if (/<(?:\/?[a-z][a-z0-9-]*(?=[\s/>]|$)|![a-z]|!\[CDATA\[|\?)/i.test(line)) throw new Error('raw HTML is not allowed outside fenced examples');
    return line;
  }).join('');
  if (fence) throw new Error('unterminated fenced block');
  const headings = [...visible.matchAll(/^## ([^\r\n]+)\r?$/gm)];
  for (const section of SECTIONS) {
    const matches = headings.filter((m) => m[1] === section);
    if (matches.length !== 1) throw new Error(`missing or duplicate section: ${section}`);
    const start = matches[0].index + matches[0][0].length;
    const end = headings.find((m) => m.index > matches[0].index)?.index ?? visible.length;
    if (!visible.slice(start, end).trim()) throw new Error(`empty section: ${section}`);
  }
}

function createPublished(body, identity) {
  checkIdentity(identity);
  checkBody(body);
  const meta = { schema: 1, status: 'complete', session_id: identity.session_id,
    project_id: identity.project_id, generation: identity.generation, corr: identity.corr,
    created_at: identity.created_at || new Date().toISOString(), body_sha256: digest(body) };
  if (!Number.isFinite(Date.parse(meta.created_at))) throw new Error('invalid creation time');
  return `<!-- handoff: ${JSON.stringify(meta)} -->\n${body}\n<!-- handoff-complete: ${meta.generation} -->\n`;
}

function validatePublished(markdown, expected = {}) {
  if (typeof markdown !== 'string' || Buffer.byteLength(markdown) > MAX_BYTES + 2048) throw new Error('invalid publication size');
  const head = markdown.match(/^<!-- handoff: (\{[^\r\n]+\}) -->\n/);
  if (!head) throw new Error('missing publication metadata');
  const meta = JSON.parse(head[1]);
  checkIdentity(meta);
  if (meta.schema !== 1 || meta.status !== 'complete' || !Number.isFinite(Date.parse(meta.created_at))) throw new Error('incomplete publication');
  for (const key of ['session_id', 'project_id', 'generation', 'corr']) {
    if (Object.prototype.hasOwnProperty.call(expected, key) && unknownIdentity(expected[key])) throw new Error(`handoff ${key} identity is unknown or invalid`);
    if (expected[key] !== undefined && expected[key] !== meta[key]) throw new Error(`handoff ${key} mismatch`);
  }
  const tail = `\n<!-- handoff-complete: ${meta.generation} -->\n`;
  if (!markdown.endsWith(tail)) throw new Error('publication is unfinished');
  const body = markdown.slice(head[0].length, -tail.length);
  checkBody(body);
  if (digest(body) !== meta.body_sha256) throw new Error('handoff checksum mismatch');
  return meta;
}

// Publish a fully fsynced temporary inode using an exclusive hard link. Unlike
// rename, link never replaces an existing destination. Unsupported filesystems fail closed.
function publishExclusive(file, bytes) {
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  let fd;
  let ownsTemporary = false;
  let ownStat;
  let linked = false;
  let failure;
  try {
    fd = fs.openSync(temporary, 'wx', 0o600);
    ownsTemporary = true;
    ownStat = fs.fstatSync(fd, { bigint: true });
    fs.writeFileSync(fd, bytes);
    ownStat = fs.fstatSync(fd, { bigint: true });
    fs.fsyncSync(fd);
    fs.closeSync(fd); fd = undefined;
    fs.linkSync(temporary, file);
    linked = true;
  } catch (error) {
    failure = error;
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch (error) { failure = failure || error; }
    }
    if (ownsTemporary) {
      try {
        const actual = fs.lstatSync(temporary, { bigint: true });
        if (!ownStat || !actual.isFile() || actual.isSymbolicLink() || actual.ino !== ownStat.ino
          || actual.dev !== ownStat.dev || actual.nlink !== (linked ? 2n : 1n)) throw new Error('temporary identity or hardlink state is ambiguous');
        fs.unlinkSync(temporary);
      } catch (error) {
        const cleanupCode = error.code || 'IDENTITY_UNKNOWN';
        const publicationCode = failure ? (failure.code || failure.name) : null;
        const aborted = new Error(`publication temporary cleanup failed [${cleanupCode}]; publication error=${publicationCode || 'none'}; retained evidence: ${path.basename(temporary)}; expected_sha256=${digest(bytes)}`, { cause: error });
        aborted.code = 'EPUBLISH_CLEANUP';
        aborted.publicationError = failure;
        aborted.cleanupError = error;
        aborted.temporary_name = path.basename(temporary);
        aborted.temporary_expected_sha256 = digest(bytes);
        throw aborted;
      }
    }
  }
  if (failure) throw failure;
  const published = fs.lstatSync(file, { bigint: true });
  if (!published.isFile() || published.isSymbolicLink() || published.nlink !== 1n
    || published.ino !== ownStat.ino || published.dev !== ownStat.dev || published.size !== ownStat.size) {
    throw new Error('publication identity changed after temporary cleanup');
  }
}

// Explicit retry only: no scanning, no arbitrary unlink, no fallback to an
// overwrite. A surviving hardlink must be the exact named publisher temporary,
// the sole additional link, and the same stable inode with expected content.
function recoverLinkedPublication(file, temporaryName, expected, bodySha256) {
  const prefix = path.basename(file) + '.';
  if (typeof temporaryName !== 'string' || path.basename(temporaryName) !== temporaryName
    || !temporaryName.startsWith(prefix) || !temporaryName.endsWith('.tmp')
    || !UUID.test(temporaryName.slice(prefix.length, -4))) throw new Error('invalid publication temporary alias');
  checkIdentity(expected);
  const temporary = path.join(path.dirname(file), temporaryName);
  const before = fs.lstatSync(file, { bigint: true });
  if (!before.isFile() || before.isSymbolicLink() || ![1n, 2n].includes(before.nlink)
    || before.size > BigInt(MAX_BYTES + 2048)) throw new Error('publication linked state is ambiguous');
  let alias;
  try { alias = fs.lstatSync(temporary, { bigint: true }); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (before.nlink === 2n && !alias) throw new Error('publication alias identity is unknown');
  if (alias && (!alias.isFile() || alias.isSymbolicLink() || alias.dev !== before.dev || alias.ino !== before.ino
    || alias.nlink !== 2n || before.nlink !== 2n)) throw new Error('temporary alias is not the same publication inode');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const same = stat => stat.isFile() && stat.dev === before.dev && stat.ino === before.ino
      && stat.size === before.size && stat.mtimeNs === before.mtimeNs && stat.ctimeNs === before.ctimeNs
      && stat.nlink === before.nlink;
    if (!same(fs.fstatSync(fd, { bigint: true }))) throw new Error('publication identity changed before recovery read');
    const bytes = fs.readFileSync(fd);
    if (!same(fs.fstatSync(fd, { bigint: true })) || !same(fs.lstatSync(file, { bigint: true })) || BigInt(bytes.length) !== before.size) throw new Error('publication changed during recovery read');
    const markdown = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const meta = validatePublished(markdown, expected);
    if (meta.body_sha256 !== bodySha256) throw new Error('generation already published with different content');
    if (alias) {
      if (!same(fs.lstatSync(temporary, { bigint: true })) || !same(fs.lstatSync(file, { bigint: true }))) throw new Error('publication alias raced recovery');
      try { fs.unlinkSync(temporary); } catch (error) {
        const aborted = new Error(`publication recovery cleanup unlink failed [${error.code || 'UNKNOWN'}]; evidence retained`, { cause: error });
        aborted.code = 'EPUBLISH_CLEANUP';
        throw aborted;
      }
    }
    const after = fs.fstatSync(fd, { bigint: true }), named = fs.lstatSync(file, { bigint: true });
    if (!after.isFile() || after.nlink !== 1n || after.dev !== before.dev || after.ino !== before.ino
      || named.dev !== after.dev || named.ino !== after.ino || named.nlink !== 1n || named.isSymbolicLink()
      || after.size !== before.size || after.mtimeNs !== before.mtimeNs) throw new Error('publication recovery is unfinished or raced');
    const final = readRegular(file);
    if (final !== markdown) throw new Error('publication changed after recovery cleanup');
    return { recovered_temporary: alias ? temporaryName : null, publication_sha256: digest(bytes) };
  } finally { fs.closeSync(fd); }
}

function handoffsDirectory(cwd) {
  const root = fs.realpathSync(cwd);
  const dir = path.join(root, 'handoffs');
  try { fs.mkdirSync(dir, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  if (!fs.lstatSync(dir).isDirectory() || fs.lstatSync(dir).isSymbolicLink() || fs.realpathSync(dir) !== dir) throw new Error('handoffs directory is redirected');
  return dir;
}

function readRegular(file, maxBytes = MAX_BYTES + 2048) {
  const before = fs.lstatSync(file);
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1 || before.size > maxBytes) throw new Error('handoff evidence is not a bounded regular file');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const current = fs.fstatSync(fd);
    if (current.ino !== before.ino || current.dev !== before.dev || current.size !== before.size || current.nlink !== 1) throw new Error('handoff evidence changed during read');
    const bytes = fs.readFileSync(fd);
    const after = fs.fstatSync(fd);
    if (bytes.length !== current.size || after.mtimeMs !== current.mtimeMs || after.size !== current.size) throw new Error('handoff evidence changed during read');
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } finally { fs.closeSync(fd); }
}

module.exports = { SECTIONS, MAX_BYTES, checkIdentity, projectIdentity, createPublished, validatePublished,
  publishExclusive, recoverLinkedPublication, handoffsDirectory, readRegular };
