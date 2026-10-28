#!/usr/bin/env node
// npm audit gate: fails on every advisory except those Peter accepted in audit-exceptions.json
// (advisory id, package, reason, accepted date, review condition). No dependencies.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const exceptions = JSON.parse(readFileSync(new URL('../audit-exceptions.json', import.meta.url), 'utf8'));
const accepted = new Map(exceptions.map((e) => [e.advisory, e]));

// `npm run` exports the global `allow-scripts` setting as npm_config_allow_scripts; a nested npm reads that
// as a command-line flag and refuses to run in a project (EALLOWSCRIPTS). An audit runs no scripts.
const env = { ...process.env };
delete env.npm_config_allow_scripts;

let raw;
try {
  raw = execFileSync('npm', ['audit', '--json'], { encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
} catch (error) {
  raw = error.stdout; // npm audit exits non-zero when it finds anything
}
let report;
try {
  report = JSON.parse(raw);
} catch {
  report = null;
}
// Fail closed: an npm error or an unexpected report must never pass as "no advisories".
if (!report || report.error || typeof report.vulnerabilities !== 'object' || report.vulnerabilities === null) {
  console.error(`npm audit did not produce a report: ${report?.error?.code ?? 'unparsable output'} ${report?.error?.summary ?? ''}`.trim());
  process.exit(2);
}
const open = [];
const seen = new Set();
for (const vuln of Object.values(report.vulnerabilities)) {
  for (const via of vuln.via) {
    if (typeof via !== 'object') continue; // propagated from another entry, reported there
    const id = String(via.url ?? '').split('/').pop();
    const key = `${vuln.name}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (accepted.has(id)) console.log(`accepted ${id} in ${vuln.name}: ${accepted.get(id).reason}`);
    else open.push(`${vuln.name} ${via.range ?? ''}: ${id} (${via.severity}) ${via.title}`);
  }
}
if (open.length > 0) {
  console.error(`npm audit: ${open.length} advisory(ies) without an accepted exception:\n  ${open.join('\n  ')}`);
  process.exit(1);
}
console.log('npm audit: no advisories beyond the accepted exceptions');
