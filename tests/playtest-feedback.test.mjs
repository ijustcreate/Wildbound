import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import test from 'node:test';
import feedback from '../services/playtest-feedback/worker.mjs';

const origin = 'https://ijustcreate.github.io';
const endpoint = 'https://feedback.example/api/feedback';

function request(report, {method = 'POST', source = origin} = {}) {
  return new Request(endpoint, {
    method,
    headers: {Origin: source, 'Content-Type': 'application/json'},
    body: method === 'POST' ? JSON.stringify(report) : undefined,
  });
}

function database() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../services/playtest-feedback/drizzle/0000_playtest_reports.sql', import.meta.url), 'utf8'));
  const DB = {
    prepare: query => {
      const statement = sql.prepare(query);
      return {bind: (...values) => ({
        run: () => ({meta: {changes: statement.run(...values).changes}}),
        first: () => statement.get(...values),
      })};
    },
  };
  return {DB, sql};
}

const example = {
  id: '9ce24203-3fd2-4def-92d5-31cc6b3a5df1',
  category: 'bug', message: ' The door stayed closed. ', version: '1.2.139', screen: 'play',
};

test('feedback accepts an anonymous report and retry stores one row', async () => {
  const {DB, sql} = database();
  const preflight = await feedback.fetch(request(undefined, {method: 'OPTIONS'}), {DB});
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), origin);
  for (let retry = 0; retry < 2; retry++) {
    const response = await feedback.fetch(request(example), {DB});
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {received: true});
  }
  const rows = sql.prepare('SELECT category, message, game_version, game_screen FROM playtest_reports').all();
  assert.deepEqual(rows.map(row => ({...row})), [
    {category: 'bug', message: 'The door stayed closed.', game_version: '1.2.139', game_screen: 'play'},
  ]);
  sql.close();
});

test('feedback rejects unrelated origins, oversized reports and requests for private data', async () => {
  const {DB, sql} = database();
  const outsider = await feedback.fetch(request(example, {source: 'https://example.com'}), {DB});
  assert.equal(outsider.status, 403);
  assert.equal(outsider.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal((await feedback.fetch(request(example, {method: 'GET'}), {DB})).status, 405);
  assert.equal((await feedback.fetch(request({...example, message: 'a'.repeat(2401)}), {DB})).status, 400);
  assert.equal((await feedback.fetch(request({...example, message: 'a'.repeat(13000)}), {DB})).status, 400);
  assert.equal((await feedback.fetch(request({...example, message: '   '}), {DB})).status, 400);
  assert.equal((await feedback.fetch(request(example), {DB: null})).status, 503);
  assert.equal(sql.prepare('SELECT COUNT(*) AS count FROM playtest_reports').get().count, 0);
  sql.close();
});
