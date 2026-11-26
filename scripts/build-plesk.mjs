import { build } from 'vite';
import { copyFile, writeFile } from 'node:fs/promises';

await build({ configFile: 'vite.plesk.config.ts', mode: 'production' });
for (const file of ['.htaccess', 'README.md', 'TEST-RESULTS.md']) {
  await copyFile(`deployment/plesk/${file}`, `.output/plesk-upload/${file}`);
}
await writeFile('.output/plesk-upload/verification.json', JSON.stringify({
  package: 'Bright Idea Garden / Apache SPA',
  buildCommand: 'npm run build:plesk',
  nodeRuntimeRequired: false,
  checks: {
    staticBuild: 'passed',
    packageIntegrity: 'run by verify-plesk.mjs after packaging',
    browserReleaseChecks: 'See TEST-RESULTS.md for the tested revision; rerun on the final domain',
    finalDomainRedirectAllowlist: 'deferred: demo/final domain not yet chosen; existing auth settings unchanged',
    successfulPasswordLogin: 'requires an account password; authorized-session checks do not prove password login',
  },
}, null, 2) + '\n');
await import('./verify-plesk.mjs');