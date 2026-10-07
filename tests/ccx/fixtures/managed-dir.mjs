// Preload for the attribution tests: redirects reads under this platform's managed settings directory to MANAGED_DIR,
// so a test can place managed-settings.json and managed-settings.d without writing to a system path.
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';

const REAL = process.platform === 'win32' ? 'C:\\Program Files\\ClaudeCode'
  : process.platform === 'darwin' ? '/Library/Application Support/ClaudeCode' : '/etc/claude-code';
const map = (p) => (typeof p === 'string' && p.startsWith(REAL) ? process.env.MANAGED_DIR + p.slice(REAL.length) : p);
for (const name of ['readFileSync', 'readdirSync']) {
  const real = fs[name];
  fs[name] = (p, ...rest) => real(map(p), ...rest);
}
syncBuiltinESMExports();
