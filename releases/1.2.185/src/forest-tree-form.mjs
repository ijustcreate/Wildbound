// Coordinates are on the native tree grid, relative to the ground pivot.
// Each branch lists its crown, height of attachment and base width.
const species = {
  oak: {
    trunk: [[0,-5,11], [-1,-14,10], [-3,-28,8], [1,-48,6], [2,-64,3]],
    crowns: [[-24,-35,19,16], [22,-40,21,18], [-19,-52,22,20], [13,-59,25,19], [-5,-73,23,17]],
    branches: [[0,-19,6], [1,-23,6], [2,-32,5], [3,-38,5], [4,-46,3]],
    trunkBend: 2.6, girth: .19, reach: 3.6, rise: 3.6, attachment: 4, bend: .14, fork: true,
  },
  birch: {
    trunk: [[0,-5,7], [-1,-15,7], [-1,-29,5], [1,-48,4], [0,-67,2]],
    crowns: [[-10,-39,12,16], [9,-48,14,18], [-8,-63,12,17], [5,-76,11,13]],
    branches: [[0,-22,4], [1,-28,4], [2,-41,3], [3,-49,3]],
    trunkBend: 1.7, girth: .15, reach: 2.7, rise: 4, attachment: 4, bend: .11, fork: true,
  },
  maple: {
    trunk: [[0,-5,12], [-1,-13,10], [0,-26,8], [-2,-43,5], [-5,-64,3]],
    crowns: [[-21,-38,16,12], [20,-42,18,15], [13,-62,19,15], [-17,-54,20,16], [-8,-74,16,13], [5,-51,15,12]],
    branches: [[0,-17,6], [1,-20,7], [2,-33,5], [3,-27,6], [4,-43,4], [5,-30,4]],
    trunkBend: 3, girth: .2, reach: 3.1, rise: 3.2, attachment: 4, bend: .20, fork: true,
  },
  pine: {
    trunk: [[0,-5,9], [-1,-15,8], [0,-32,6], [0,-56,4], [0,-82,2]],
    crowns: [[0,-25,26,12], [0,-37,23,11], [0,-49,19,11], [0,-62,14,10], [0,-74,8,12]],
    branches: [],
    trunkBend: 1.2, girth: .15, reach: 1.1, rise: 1.8, attachment: 1.6, bend: .14,
  },
  tallOak: {
    trunk: [[0,-5,12], [-3,-25,11], [-5,-42,9], [0,-64,8], [4,-91,7], [6,-108,5], [-7,-130,3]],
    crowns: [[-26,-56,23,17], [24,-62,24,18], [-8,-71,26,18], [19,-78,20,14],
      [-24,-105,18,14], [19,-111,19,16], [-2,-118,23,17], [-10,-132,17,16]],
    branches: [[0,-32,6], [1,-43,6], [2,-53,4], [3,-65,4], [4,-95,4], [5,-101,4], [6,-104,3], [7,-109,4]],
    trunkBend: 2.6, girth: .16, reach: 3.5, rise: 2.6, attachment: 3, bend: .16, fork: true,
  },
};

export const TALL_TREE_TRUNK_JUNCTION = 4;
export const TALL_TREE_LOWER_CROWNS = 4;

function signed(seed, index) {
  const n = Math.sin(seed * 127.1 + index * 311.7) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}

// Interpolate the actual stem. Branches stay joined when the trunk bends.
export function treeStemAt(trunk, y) {
  for (let i = 1; i < trunk.length; i++) {
    const [endX, endY, endWidth] = trunk[i];
    if (y < endY) continue;
    const [startX, startY, startWidth] = trunk[i - 1];
    const t = Math.max(0, (startY - y) / (startY - endY));
    return [startX + (endX - startX) * t, startWidth + (endWidth - startWidth) * t];
  }
  const [x, , width] = trunk.at(-1);
  return [x, width];
}

export function makeTreeForm(type, seed, branchSpread) {
  const rule = species[type];
  const roll = index => signed(seed, index);
  const girth = 1 + roll(9) * rule.girth;
  const trunk = rule.trunk.map(([x,y,width], i) => [
    i === 0 ? 0 : Math.round(x + roll(13 + i) * rule.trunkBend),
    y,
    Math.max(2, Math.round(width * girth)),
  ]);
  const crownSize = roll(27) * .08;
  const crowns = rule.crowns.map(([x,y,rx,ry], i) => {
    const cy = y + roll(33 + i) * rule.rise;
    const [stemX] = treeStemAt(trunk, cy);
    const reach = type === 'pine' ? (.80 + branchSpread * .20) : 1;
    return [
      type === 'pine' ? stemX + roll(43 + i) * rule.reach : (x + roll(43 + i) * rule.reach) * branchSpread,
      cy,
      rx * (1 + crownSize + roll(53 + i) * .09) * reach,
      ry * (1 + crownSize * .5 + roll(63 + i) * .09),
    ];
  });

  const makeBranch = (i, height, width, tipX, tipY, crown) => {
    const y = height + roll(72 + i) * rule.attachment;
    const [x, stemWidth] = treeStemAt(trunk, y);
    const reach = Math.abs(tipX - x);
    const elbowX = x + (tipX - x) * (.54 + roll(92 + i) * .13);
    const elbowY = tipY + 4 + reach * (.14 + roll(112 + i) * rule.bend);
    const thickness = Math.min(stemWidth, Math.max(2, Math.round(width * (girth + roll(132 + i) * .25))));
    const fork = rule.fork && reach >= 9 && (width >= 4 || roll(152 + i) > .32);
    return {x, y, elbowX, elbowY, tipX, tipY, thickness, crown, fork};
  };

  const branches = rule.branches.map(([crown, height, width], i) => {
    const [cx,cy] = crowns[crown];
    return makeBranch(i, height, width, cx + roll(172 + i) * 3, cy + 4 + roll(192 + i) * 2.5, crown);
  });
  if (type === 'pine') {
    // Conifer branches sit in staggered whorls, with shallower upper tiers.
    crowns.slice(0, -1).forEach(([cx,cy,rx], crown) => {
      for (const side of [-1, 1]) {
        const i = crown * 2 + Number(side > 0);
        const tipX = cx + side * rx * (.52 + roll(210 + i) * .17);
        const tipY = cy + 1 + roll(230 + i) * 2.5;
        branches.push(makeBranch(i, cy + 7 + side, crown < 2 ? 3 : 2, tipX, tipY, crown));
      }
    });
  }
  return {trunk, crowns, branches};
}
