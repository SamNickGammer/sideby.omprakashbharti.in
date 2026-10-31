// Select a complete, branch-scoped set of local credentials without printing secrets.
import { readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { randomBytes } from 'node:crypto';
const target = process.argv[2];
if (!['dev', 'production'].includes(target)) throw new Error('Usage: node scripts/use-environment.mjs dev|production [--allow-production]');
if (target === 'production' && !process.argv.includes('--allow-production')) throw new Error('Production requires --allow-production. Local work should use dev.');
const file = `.env.${target}.local`;
const raw = readFileSync(file, 'utf8');
const env = parseEnv(raw);
if (env.NEON_BRANCH !== target) throw new Error(`Expected NEON_BRANCH=${target}; refusing to mix environments.`);
const expected = target === 'dev' ? 'ep-fancy-band-b5ghlgra' : 'ep-empty-butterfly-b5b98swy';
for (const key of ['DATABASE_URL', 'DATABASE_URL_UNPOOLED', 'NEON_AUTH_BASE_URL', 'NEON_AUTH_JWKS_URL', 'NEON_REALTIME_URL']) {
  if (!env[key] || !new URL(env[key]).hostname.startsWith(expected)) throw new Error(`Wrong branch endpoint in ${key}`);
}
const branchId = target === 'dev' ? 'br-steep-hill-b5ey5820' : 'br-mute-tree-b53goij1';
if (!env.AWS_ENDPOINT_URL_S3 || !new URL(env.AWS_ENDPOINT_URL_S3).hostname.startsWith(branchId + '.')) throw new Error('Storage branch mismatch');
for (const key of ['AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','NEON_REALTIME_SECRET']) if (!env[key]) throw new Error(`Missing ${key}`);
function set(key, value) { env[key] = value; }
set('STORAGE_BUCKET', env.STORAGE_BUCKET || 'assets');
set('NEON_AUTH_COOKIE_SECRET', env.NEON_AUTH_COOKIE_SECRET || randomBytes(32).toString('hex'));
if (target === 'dev') set('APP_ORIGIN', 'http://127.0.0.1:3005');
if (!env.APP_ORIGIN) throw new Error('APP_ORIGIN must be configured');
const output = Object.entries(env).map(([key,value]) => `${key}=${JSON.stringify(value)}`).join('\n') + '\n';
for (const path of [file, '.env.local', 'apps/parent-web/.env.local']) {
  writeFileSync(path, output, {mode:0o600}); chmodSync(path,0o600);
}
console.log(`Selected ${target} credentials for root scripts and parent web. Restart the local server.`);
