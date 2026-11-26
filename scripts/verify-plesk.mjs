import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../.output/plesk-upload/', import.meta.url));
async function walk(dir, prefix = '') {
  const files = [];
  for (const name of await readdir(dir)) {
    const relative = prefix + name;
    if ((await stat(path.join(dir, name))).isDirectory()) files.push(...await walk(path.join(dir, name), relative + '/'));
    else files.push(relative);
  }
  return files.sort();
}

const files = await walk(root);
for (const required of ['index.html', '.htaccess', 'README.md']) {
  if (!files.includes(required)) throw new Error(`Package is missing ${required}`);
}
const html = await readFile(path.join(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="(\/[^"?#]+)"/g)) {
  if (!files.includes(match[1].slice(1))) throw new Error(`Missing HTML asset ${match[1]}`);
}
const hashes = {};
for (const file of files) {
  if (/(?:^|\/)(?:\.env[^/]*|\.git|node_modules)(?:\/|$)|\.(?:map|sql|tsx?)$/.test(file)) throw new Error(`Unsafe upload entry: ${file}`);
  if (file === 'manifest.json') continue;
  const bytes = await readFile(path.join(root, file));
  if (/\.(?:html|js|css)$/.test(file)) {
    const text = bytes.toString();
    if (/sb_secret_[A-Za-z0-9_-]{20,}|SUPABASE_SERVICE_ROLE_KEY|LOVABLE_API_KEY|cloudflare:|\/src\/plesk\.tsx/.test(text)) throw new Error(`Server-only content in ${file}`);
    for (const token of text.matchAll(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)) {
      try {
        const claims = JSON.parse(Buffer.from(token[1], 'base64url').toString());
        if (claims.role !== 'anon') throw new Error('Non-public JWT in upload package');
      } catch (error) {
        if (error.message === 'Non-public JWT in upload package') throw error;
      }
    }
  }
  hashes[file] = createHash('sha256').update(bytes).digest('hex');
}
await writeFile(path.join(root, 'manifest.json'), JSON.stringify({ algorithm: 'sha256', files: hashes }, null, 2) + '\n');
console.log(`Verified ${files.length} static package files; no server credentials or source maps shipped.`);