import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../src/items.mjs';
import { PIXEL_ART_STANDARDS, auditWearableCatalog } from '../src/art-pipeline.mjs';

test('wearable catalog is covered by the shared eight-direction art contract', () => {
  const audit = auditWearableCatalog(ITEMS);
  assert.ok(audit.total > 40);
  assert.equal(audit.rows.length, audit.total);
  assert.ok(audit.rows.every(row => row.directions === PIXEL_ART_STANDARDS.directions.length));
  assert.ok(audit.rows.every(row => row.clips === PIXEL_ART_STANDARDS.requiredClips.length));
  assert.ok(audit.rows.every(row => row.editable));
});

test('two-handed wearables remain anchored in hand1 for equip migration', () => {
  const audit = auditWearableCatalog(ITEMS);
  const twoHanded = audit.rows.filter(row => ITEMS[row.id].twoHanded);
  assert.ok(twoHanded.length > 0);
  assert.ok(twoHanded.every(row => !row.issues.some(issue => issue.code === 'two-hand-slot')));
});

test('audit flags missing wearable metadata without rejecting non-wearable supplies', () => {
  const audit = auditWearableCatalog({
    hat: { name: 'Good hat', slot: 'head', base: 'hat', color: '#fff', description: 'A test hat.' },
    bad: { name: 'Bad thing', slot: 'back', base: 'unknown', color: '#fff' },
    supply: { name: 'Supply', stack: 1 },
  });
  assert.equal(audit.total, 2);
  assert.equal(audit.rows.find(row => row.id === 'hat').status, 'ready');
  assert.equal(audit.rows.find(row => row.id === 'bad').status, 'blocked');
});
