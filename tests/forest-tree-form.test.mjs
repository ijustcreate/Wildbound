import test from 'node:test';
import assert from 'node:assert/strict';
import { forestTreeForm, treeBase, treeType } from '../src/forest-tree-art.mjs';
import { treeStemAt, TALL_TREE_LOWER_CROWNS, TALL_TREE_TRUNK_JUNCTION } from '../src/forest-tree-form.mjs';
import { forestSettings } from '../src/forest-settings.mjs';

const tree = { kind: 'tree', procedural: true, x: 550, y: 650, rootY: 680, size: 84 };
const species = [
  ['oak', {}], ['birch', {}], ['maple', {}], ['pine', {}],
  ['oak', { treeVariant: 'two-tier' }], ['oak', { kind: 'leafless_tree' }],
  ['pine', { kind: 'snow_tree' }],
];

test('seeded species vary branch angles and girth while keeping branches on the tapered stem', () => {
  for (const [treeType, flags] of species) {
    const attachmentHeights = new Set(), angles = new Set(), branchWidths = new Set(), girths = new Set();
    for (let seed = 0; seed < 48; seed++) {
      const prop = { ...tree, ...flags, seed, treeType };
      const { trunk, branches, crowns } = forestTreeForm(prop);
      assert.equal(trunk[0][0], 0);
      assert.deepEqual(treeBase(prop), { x: tree.x, y: tree.rootY });
      assert.ok(trunk[0][2] >= 6 && trunk[0][2] <= 15);
      assert.ok(trunk.slice(1).every(([, y, width], i) => y < trunk[i][1] && width <= trunk[i][2]));
      assert.ok(crowns.every(([, , rx, ry]) => rx > 4 && rx < 33 && ry > 5 && ry < 25));
      for (const branch of branches) {
        const [stemX, stemWidth] = treeStemAt(trunk, branch.y);
        assert.equal(branch.x, stemX);
        assert.ok(branch.thickness >= 2 && branch.thickness <= stemWidth);
        const [cx, cy, rx, ry] = crowns[branch.crown];
        assert.ok(Math.abs(branch.tipX - cx) <= rx && Math.abs(branch.tipY - cy) <= ry);
      }
      if (flags.treeVariant) {
        const junctionY = trunk[TALL_TREE_TRUNK_JUNCTION][1];
        assert.ok(branches.every(b => b.crown < TALL_TREE_LOWER_CROWNS ? b.y > junctionY : b.y < junctionY));
      }
      const first = branches[0];
      girths.add(trunk[0][2]);
      attachmentHeights.add(Math.round(first.y));
      angles.add(Math.round(Math.atan2(first.tipY - first.y, first.tipX - first.x) * 180 / Math.PI));
      branchWidths.add(branches.map(b => Math.round(b.thickness)).join(','));
    }
    assert.ok([attachmentHeights, angles, branchWidths, girths].every(values => values.size >= 2), treeType);
  }
});

test('seeded forms survive reload or relocation and respond to live forest controls', () => {
  const prop = { ...tree, treeType: 'oak', seed: 42 };
  const initial = forestTreeForm(prop);
  assert.equal(forestTreeForm(prop), initial);
  assert.deepEqual(forestTreeForm({ ...prop, x: 940 }), initial);
  assert.deepEqual(forestTreeForm({ ...tree, treeType: 'oak' }), forestTreeForm({ ...tree, treeType: 'oak' }));
  assert.equal(treeType({ ...tree, kind: 'snow_tree' }), 'pine');
  const spread = forestSettings.branchSpread;
  try {
    forestSettings.branchSpread = spread * .8;
    const narrow = forestTreeForm(prop);
    assert.notDeepEqual(narrow.branches, initial.branches);
    assert.deepEqual(narrow.trunk, initial.trunk);
  } finally {
    forestSettings.branchSpread = spread;
  }
});
