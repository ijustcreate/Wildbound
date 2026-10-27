import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('current web saves survive reload and never change original saves or clear unrelated data', () => {
  const values = new Map([['wildbound-session', 'historical'], ['other-app', 'keep']]);
  const native = {get length(){return values.size;}, key(i){return [...values.keys()][i] ?? null;}, getItem(k){return values.get(String(k)) ?? null;}, setItem(k,v){values.set(String(k),String(v));}, removeItem(k){values.delete(String(k));}};
  const source = fs.readFileSync(new URL('../src/web-storage.js', import.meta.url), 'utf8');
  const load = () => {const window = {localStorage: native};vm.runInNewContext(source, {window});return window.localStorage;};
  let current = load();
  assert.equal(current.getItem('wildbound-session'), null);
  current.setItem('wildbound-session', 'new expedition');
  assert.equal(native.getItem('wildbound-session'), 'historical');
  current = load();
  assert.equal(current.getItem('wildbound-session'), 'new expedition');
  assert.equal(current.length, 1);
  assert.equal(current.key(0), 'wildbound-session');
  assert.equal(current.key(1), null);
  current.removeItem('wildbound-session');
  current.setItem('editor-draft', 'draft');
  current.clear();
  assert.equal(current.length, 0);
  assert.deepEqual([...values], [['wildbound-session', 'historical'], ['other-app', 'keep']]);
});
