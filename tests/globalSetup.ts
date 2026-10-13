import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

/** Make sure the generated engine bundle exists and is current before tests run. */
export default function setup(): void {
    execFileSync(process.execPath, [resolve(__dirname, '../scripts/build-engine.mjs')], { stdio: 'inherit' });
}
