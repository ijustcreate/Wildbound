import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { reserveBuildVersion } from '../scripts/build-version.cjs';

const allocator = fileURLToPath(new URL('../scripts/build-version.cjs', import.meta.url));

function checkout(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-build-versions-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync('git', ['init', '--quiet', root]);
  return root;
}

test('build version advances past old packages and reservations', t => {
  const root = checkout(t);
  const preview = path.join(root, 'dist', 'night-hunt-old', 'Wildbound-win32-x64');
  fs.mkdirSync(preview, { recursive: true });
  fs.writeFileSync(path.join(preview, 'wildbound-build.json'), '{"version":"1.2.99","preview":true}');
  fs.mkdirSync(path.join(root, 'dist', '1.2.105'));
  assert.equal(reserveBuildVersion(root, '1.2.90'), '1.2.106');
  assert.equal(reserveBuildVersion(root, '1.2.107'), '1.2.107');
  assert.equal(reserveBuildVersion(root, '1.2.107'), '1.2.108');
  fs.mkdirSync(path.join(root, 'dist', 'web-1.2.110'));
  assert.equal(reserveBuildVersion(root, '1.2.90'), '1.2.111');
});

test('concurrent packages in linked worktrees each reserve a different consecutive version', async t => {
  const root = checkout(t);
  const linked = path.join(root, 'linked');
  execFileSync('git', ['-c', 'user.name=Build Test', '-c', 'user.email=build@example.invalid',
    'commit', '--quiet', '--allow-empty', '-m', 'Build fixture'], { cwd: root });
  execFileSync('git', ['worktree', 'add', '--quiet', '--detach', linked, 'HEAD'], { cwd: root });
  const script = 'const { reserveBuildVersion } = require(process.argv[1]); console.log(reserveBuildVersion(process.argv[2], "1.2.114"));';
  const run = promisify(execFile);
  const builds = await Promise.all([root, linked, root, linked].map(directory =>
    run(process.execPath, ['-e', script, allocator, directory])));
  assert.deepEqual(builds.map(build => build.stdout.trim()).sort(), ['1.2.114', '1.2.115', '1.2.116', '1.2.117']);
});
