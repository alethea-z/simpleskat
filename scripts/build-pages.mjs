import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist');

async function copyPath(source, target) {
  await cp(resolve(root, source), resolve(dist, target), { recursive: true });
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await copyPath('index.html', 'index.html');
await copyPath('main.js', 'main.js');
await copyPath('styles.css', 'styles.css');
await copyPath('src', 'src');
await copyPath('tests/protocol.html', 'tests/protocol.html');
await copyPath('tests/protocol.json', 'tests/protocol.json');
await copyPath('tests/protocol.md', 'tests/protocol.md');
await copyPath('tests/README.md', 'tests/README.md');
await copyPath('tests/bdd', 'tests/bdd');
await copyPath('package.json', 'package.json');

console.log(`Built GitHub Pages site in ${dist}`);
