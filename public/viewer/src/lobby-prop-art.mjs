// Native world-pixel artwork. No bitmap stretching, fonts, randomness, or DOM.
// Coordinates follow the existing lobby furniture/fixtures, with room below for captions.
export const LOBBY_PROP_ART_BOUNDS = Object.freeze({
  environment: Object.freeze({ x: -47, y: -35, w: 94, h: 65 }),
  'dice-count': Object.freeze({ x: -43, y: -34, w: 86, h: 64 }),
  'character-station': Object.freeze({ x: -42, y: -38, w: 84, h: 68 }),
  difficulty: Object.freeze({ x: -28, y: -147, w: 56, h: 177 }),
});

const P = Object.freeze({
  ink: '#292922', woodDark: '#493122', woodShade: '#65432c', wood: '#8a5c36',
  woodLight: '#b78049', woodEdge: '#d5a564', grain: '#74492c',
  brassDark: '#77552c', brass: '#bd9148', brassLight: '#f0cf81',
  paperShade: '#b9a16a', paper: '#e2c98d', paperLight: '#f7e5b5',
  greenDark: '#203c34', greenShade: '#2d5546', green: '#3e735b', greenLight: '#659477',
  stoneDark: '#4b5149', stone: '#787b66', stoneLight: '#a5a58a',
});

function rect(c, color, x, y, w, h) {
  c.fillStyle = color; c.fillRect(x, y, w, h);
}

function pixels(c, rows, x, y, color, unit = 1) {
  for (const [j, row] of rows.entries()) for (let i = 0; i < row.length; i++) {
    if (row[i] !== '.') rect(c, color, x + i * unit, y + j * unit, unit, unit);
  }
}

function at(c, o, paint) {
  c.save();
  try { c.imageSmoothingEnabled = false; c.translate(Math.round(o.x), Math.round(o.y)); paint(); }
  finally { c.restore(); }
}

function shadow(c, width) {
  // Stepped cast shadow to the lower right; compact contact shadow beneath the feet.
  rect(c, '#20282345', -width / 2 + 5, 20, width - 5, 6);
  rect(c, '#20282345', -width / 2 + 10, 26, width - 15, 4);
  rect(c, '#17221e65', -width / 2 + 9, 16, width - 18, 8);
}

function nail(c, x, y) {
  rect(c, P.brassDark, x, y, 3, 3);
  rect(c, P.brassLight, x, y, 2, 1);
}

function compass(c, x, y) {
  pixels(c, ['..#####..', '.#######.', '#########', '#########', '#########',
    '#########', '#########', '.#######.', '..#####..'], x, y, P.brassDark);
  rect(c, P.brassLight, x + 2, y + 1, 5, 1); rect(c, P.brass, x + 1, y + 2, 7, 5);
  rect(c, P.paperLight, x + 2, y + 2, 5, 5);
  pixels(c, ['..#..', '.###.', '..#..', '..#..', '.....'], x + 2, y + 2, '#b75c43');
  rect(c, P.greenDark, x + 4, y + 5, 1, 2);
}

function scroll(c, x, y, height = 24) {
  rect(c, P.woodDark, x + 1, y + 2, 7, height);
  rect(c, P.paperShade, x, y + 1, 7, height - 2);
  rect(c, P.paper, x + 1, y, 5, height - 2);
  rect(c, P.paperLight, x + 1, y + 2, 2, height - 5);
  rect(c, '#927646', x + 5, y + 2, 1, height - 4);
  rect(c, P.paperLight, x, y, 7, 2); rect(c, P.paperShade, x + 2, y, 3, 1);
  rect(c, '#9e5140', x, y + Math.floor(height / 2), 7, 3);
  rect(c, '#d48157', x + 1, y + Math.floor(height / 2), 2, 2);
}

function legs(c, halfWidth, bottom = 21) {
  for (const x of [-halfWidth + 7, halfWidth - 14]) {
    rect(c, P.ink, x, 2, 8, bottom - 2);
    rect(c, P.woodShade, x + 1, 3, 6, bottom - 4);
    rect(c, P.woodLight, x + 1, 3, 2, bottom - 6);
    rect(c, P.brassDark, x + 1, bottom - 5, 6, 3);
    rect(c, P.brass, x + 1, bottom - 5, 2, 2);
  }
}

const MAP_PALETTES = Object.freeze({
  random: ['#92995f', '#567e71'], forest: ['#72966b', '#385d47'],
  desert: ['#d4ad62', '#ac7442'], ice: ['#bcd3ce', '#779fa9'],
  house: ['#94a372', '#79694e'], temple: ['#719071', '#8d8460'],
  beach: ['#8dc6bb', '#438b92'],
  graveyard: ['#465649', '#9aa38a'],
});

function chart(c, x, y, value) {
  const map = Object.hasOwn(MAP_PALETTES, value) ? value : 'random';
  const [land, detail] = MAP_PALETTES[map];
  rect(c, P.paperShade, x + 1, y + 2, 57, 26);
  rect(c, P.paper, x, y, 57, 25); rect(c, P.paperLight, x + 1, y, 53, 1);
  rect(c, '#cbb47b', x + 3, y + 3, 50, 19); rect(c, land, x + 4, y + 4, 48, 17);
  // Fine border ticks and folded corner are ink on parchment, not a framed icon.
  for (let i = 7; i < 52; i += 7) rect(c, '#aa925e', x + i, y + 2, 1, 1);
  rect(c, P.paperLight, x + 54, y + 19, 3, 5); rect(c, P.paperShade, x + 52, y + 23, 4, 2);
  if(map==='graveyard'){
    rect(c,'#22322b',x+7,y+6,42,12);
    for(const sx of [10,19,28,37]){rect(c,detail,x+sx,y+8,4,8);rect(c,'#d2d3ac',x+sx+1,y+7,2,1);}
    for(const sx of [8,15,22,29,36,43]){rect(c,'#1b292b',x+sx,y+4,1,3);rect(c,'#1b292b',x+sx,y+18,1,3);}
    rect(c,detail,x+43,y+9,7,7);rect(c,'#151f24',x+45,y+12,3,4);
  } else if (map === 'beach') {
    rect(c, '#dec78c', x + 4, y + 4, 18, 17); rect(c, '#dec78c', x + 22, y + 11, 5, 10);
    rect(c, '#b3dfd0', x + 22, y + 4, 2, 7); rect(c, '#b3dfd0', x + 27, y + 11, 2, 10);
    for (const [sx, sy] of [[32, 7], [42, 17], [30, 18]]) rect(c, '#daf1da', x + sx, y + sy, 6, 1);
    rect(c, P.woodShade, x + 16, y + 12, 16, 2); rect(c, P.woodShade, x + 28, y + 10, 2, 6);
  } else if (map === 'house') {
    for (const [sx, sy] of [[9, 6], [29, 11]]) {
      rect(c, detail, x + sx, y + sy, 9, 7); rect(c, '#bd8355', x + sx - 1, y + sy, 11, 2);
      rect(c, P.paperLight, x + sx + 2, y + sy + 3, 3, 2);
    }
    rect(c, '#d2bb82', x + 19, y + 7, 4, 14); rect(c, '#d2bb82', x + 19, y + 17, 22, 3);
  } else if (map === 'temple') {
    for (let tier = 0; tier < 3; tier++) rect(c, detail, x + 18 + tier * 3, y + 16 - tier * 4, 19 - tier * 6, 4);
    rect(c, P.paperLight, x + 25, y + 6, 5, 2); rect(c, P.greenDark, x + 26, y + 14, 3, 5);
    for (const [sx, sy] of [[8, 7], [39, 12], [10, 18]]) pixels(c, ['.#.', '###', '.#.'], x + sx, y + sy, '#395f49');
  } else {
    for (const [sx, sy] of [[9, 5], [31, 6], [23, 14], [41, 14]]) {
      if (map === 'forest' || map === 'random') pixels(c, ['..#..', '.###.', '#####', '..#..'], x + sx, y + sy, detail);
      else pixels(c, ['..##..', '.####.', '######'], x + sx, y + sy, detail);
      if (map === 'ice') rect(c, '#edf3dd', x + sx + 2, y + sy, 2, 1);
    }
    if (map !== 'desert') {
      for (const [sx, sy, w, h] of [[18, 4, 3, 6], [20, 9, 5, 3], [24, 11, 3, 5], [26, 15, 8, 2], [32, 16, 3, 5]])
        rect(c, '#527f91', x + sx, y + sy, w, h);
      rect(c, '#a3c5be', x + 18, y + 4, 1, 5);
    } else {
      rect(c, '#3c8878', x + 39, y + 6, 5, 3); rect(c, '#e8cd8c', x + 6, y + 18, 11, 1);
    }
  }
  // Red survey route, start marker and destination cross remain readable on every terrain.
  for (const [sx, sy] of [[7, 17], [12, 16], [16, 13], [21, 12], [27, 9], [33, 8]])
    rect(c, '#ac5340', x + sx, y + sy, 2, 1);
  pixels(c, ['#.#', '.#.', '#.#'], x + 37, y + 6, '#922e32');
  rect(c, P.paperLight, x + 6, y + 17, 2, 2);
  pixels(c, ['..#..', '..#..', '#####', '..#..', '..#..'], x + 46, y + 14, '#4c5a43');
}

export function drawLobbyMapTable(c, o, environment = 'random') {
  at(c, o, () => {
    shadow(c, 94); legs(c, 47);
    rect(c, P.ink, -47, -35, 94, 44); rect(c, P.woodShade, -46, -34, 92, 41);
    rect(c, P.wood, -46, -34, 90, 32); rect(c, P.woodLight, -45, -33, 88, 2);
    for (const y of [-24, -14, -4]) {
      rect(c, P.grain, -45, y, 89, 1); rect(c, P.woodLight, -39, y + 2, 19, 1);
    }
    rect(c, P.woodDark, -45, -1, 90, 2); rect(c, P.woodLight, -45, 1, 90, 2);
    rect(c, P.woodShade, -45, 3, 90, 5); rect(c, P.grain, -30, 5, 49, 1);
    nail(c, -44, 3); nail(c, 40, 3);
    chart(c, -29, -29, environment);
    scroll(c, -41, -31, 28); scroll(c, 32, -32, 30);
    // Pencil and brass dividers on the uncovered lower edge.
    rect(c, '#bd593f', -21, -2, 20, 2); rect(c, P.paperLight, -23, -2, 2, 2);
    pixels(c, ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'], 18, -3, P.brassLight);
  });
}

function die(c, x, y, value) {
  rect(c, '#172d2866', x + 2, y + 19, 24, 4);
  rect(c, P.ink, x, y + 1, 24, 22); rect(c, '#aa9570', x + 1, y + 4, 22, 18);
  rect(c, '#d2c3a1', x + 1, y + 1, 22, 19); rect(c, '#f6edcf', x + 2, y, 19, 18);
  rect(c, '#fff6dc', x + 3, y, 17, 2); rect(c, '#e5d6b4', x + 2, y + 16, 20, 2);
  rect(c, '#b9a47e', x + 20, y + 3, 2, 15);
  const pips = value === 5 ? [[4, 4], [14, 4], [9, 9], [4, 13], [14, 13]] : [[4, 4], [9, 9], [14, 13]];
  for (const [px, py] of pips) {
    rect(c, '#b9a987', x + px, y + py + 1, 3, 3); rect(c, '#343d36', x + px, y + py, 3, 3);
    rect(c, '#586052', x + px, y + py, 2, 1);
  }
}

export function drawLobbyDiceTray(c, o, count = 2) {
  at(c, o, () => {
    shadow(c, 86); legs(c, 43);
    rect(c, P.ink, -43, -34, 86, 47); rect(c, P.woodShade, -42, -33, 84, 44);
    rect(c, P.wood, -41, -33, 82, 36); rect(c, P.woodEdge, -40, -33, 80, 2);
    rect(c, P.woodLight, -40, -30, 3, 31); rect(c, P.woodDark, -36, -28, 72, 28);
    rect(c, P.brassDark, -35, -27, 70, 27); rect(c, P.greenDark, -33, -25, 66, 23);
    rect(c, P.greenShade, -31, -22, 62, 19); rect(c, P.green, -29, -19, 58, 15);
    // Sparse woven felt specks, inset shadow at the far rail, seam along the near edge.
    for (const [x, y] of [[-25, -16], [-7, -19], [23, -10], [-18, -7], [7, -5], [28, -18]])
      rect(c, P.greenLight, x, y, 1, 1);
    rect(c, P.greenLight, -30, -3, 60, 1);
    rect(c, P.woodDark, -41, 2, 82, 2); rect(c, P.woodLight, -40, 4, 80, 2);
    rect(c, P.wood, -40, 6, 80, 6); rect(c, P.grain, -26, 9, 41, 1);
    for (const x of [-40, 35]) { nail(c, x, -31); nail(c, x, -1); }
    rect(c, P.brassDark, -8, 6, 16, 6); rect(c, P.brass, -7, 6, 14, 4);
    rect(c, P.brassLight, -5, 7, 10, 1);
    // Same one/two-die layout as the existing tray, with readable recessed pips.
    if (String(count) === '1') die(c, -12, -25, 5);
    else { die(c, -28, -25, 3); die(c, 8, -23, 5); }
  });
}

export function drawLobbyExplorerStation(c, o) {
  at(c, o, () => {
    shadow(c, 84); legs(c, 42);
    rect(c, P.ink, -42, -38, 84, 48); rect(c, P.woodShade, -40, -37, 80, 45);
    rect(c, P.woodLight, -40, -37, 78, 2); rect(c, P.wood, -37, -34, 74, 29);
    for (const x of [-21, -4, 13, 30]) rect(c, P.grain, x, -33, 1, 27);
    for (const x of [-34, 33]) { nail(c, x, -33); nail(c, x, -8); }
    // A green canvas rucksack hangs from the peg rail: bedroll, leather straps, pockets.
    rect(c, P.woodDark, -31, -31, 28, 26); rect(c, P.brassDark, -20, -34, 6, 4);
    rect(c, P.ink, -29, -29, 24, 23); rect(c, P.greenDark, -28, -28, 22, 22);
    rect(c, P.green, -27, -28, 19, 19); rect(c, P.greenLight, -26, -27, 3, 16);
    rect(c, '#91a78a', -30, -31, 26, 5); rect(c, '#bac4a0', -29, -31, 24, 1);
    rect(c, '#576e58', -27, -30, 2, 4); rect(c, '#576e58', -9, -30, 2, 4);
    rect(c, P.woodShade, -26, -25, 3, 17); rect(c, P.woodLight, -26, -25, 1, 15);
    rect(c, P.woodShade, -11, -25, 3, 17); rect(c, P.woodLight, -11, -25, 1, 15);
    rect(c, P.greenShade, -22, -16, 10, 8); rect(c, P.greenLight, -21, -16, 8, 2);
    nail(c, -26, -18); nail(c, -11, -18);
    // Brass telescope above the hanging compass, with a blue glass objective.
    rect(c, P.woodDark, 0, -30, 30, 7); rect(c, P.brassDark, 1, -32, 29, 7);
    rect(c, P.brass, 3, -32, 26, 5); rect(c, P.brassLight, 4, -32, 24, 1);
    for (const x of [5, 16, 26]) rect(c, P.brassDark, x, -31, 2, 5);
    rect(c, P.ink, 29, -33, 5, 8); rect(c, '#78b0af', 30, -32, 3, 6);
    rect(c, '#c1e0cc', 30, -32, 1, 3);
    compass(c, 20, -21);
    // Bench top projects forward; a field journal and dividers sit on its lit edge.
    rect(c, P.ink, -42, -7, 84, 9); rect(c, P.woodLight, -41, -7, 81, 6);
    rect(c, P.woodEdge, -40, -7, 79, 1); rect(c, P.woodDark, -41, -1, 82, 3);
    rect(c, P.greenDark, -2, -17, 17, 13); rect(c, P.paperShade, 0, -15, 15, 11);
    rect(c, P.paperLight, 0, -15, 13, 9); rect(c, P.paper, 6, -15, 7, 9);
    rect(c, '#829177', 2, -12, 3, 1); rect(c, '#829177', 8, -12, 4, 1);
    rect(c, '#829177', 2, -9, 3, 1); rect(c, '#829177', 8, -9, 3, 1);
    rect(c, '#c3aa73', 6, -14, 1, 8);
    pixels(c, ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'], 24, -7, P.brassLight);
    for (const x of [-38, 2]) {
      rect(c, P.woodDark, x, 3, 36, 11); rect(c, P.wood, x + 1, 4, 34, 8);
      rect(c, P.woodLight, x + 2, 4, 32, 1); rect(c, P.grain, x + 4, 10, 12, 1);
      rect(c, P.brassDark, x + 15, 6, 7, 4); rect(c, P.brassLight, x + 16, 6, 5, 1);
    }
    rect(c, P.woodDark, -34, 15, 68, 3); rect(c, P.woodLight, -33, 15, 66, 1);
  });
}

const DIFFICULTY = Object.freeze({
  gentle: { light: '#9ed6a2', color: '#689c71', dark: '#345b48', tiers: 1,
    glyph: ['....###....', '..######...', '.########..', '.#######...', '..#####....', '...###.....', '..##.......', '.##........'] },
  adventure: { light: '#f8d987', color: '#d2a04b', dark: '#79542e', tiers: 2,
    glyph: ['.....#.....', '....###....', '...#####...', '..#######..', '.###...###.', '###.....###', '....###....', '....###....'] },
  wild: { light: '#f2ac79', color: '#cf704d', dark: '#763c34', tiers: 3,
    glyph: ['..#.....#..', '.###...###.', '..#######..', '...#####...', '..##.#.##..', '..#######..', '...#####...', '....###....'] },
});

export function drawLobbyDifficultyTotem(c, o, value = 'adventure') {
  const mode = Object.hasOwn(DIFFICULTY, value) ? DIFFICULTY[value] : DIFFICULTY.adventure;
  at(c, o, () => {
    shadow(c, 56);
    // The badge keeps the original overhead clearance, on a braced brass post.
    rect(c, P.woodDark, -3, -98, 7, 38); rect(c, P.brass, -2, -98, 2, 34);
    rect(c, P.ink, -24, -147, 48, 47); rect(c, P.ink, -28, -143, 56, 39);
    rect(c, P.brassDark, -25, -143, 50, 39); rect(c, P.brassLight, -22, -145, 44, 2);
    rect(c, P.brass, -26, -141, 52, 35); rect(c, P.brassLight, -26, -141, 2, 33);
    rect(c, P.woodDark, -22, -139, 44, 32); rect(c, mode.dark, -20, -137, 40, 28);
    rect(c, mode.color, -18, -135, 36, 24);
    pixels(c, mode.glyph, -11, -133, mode.dark, 2); pixels(c, mode.glyph, -11, -135, mode.light, 2);
    for (const x of [-18, 15]) nail(c, x, -142);
    // Stone footing and an angular carved timber face, all within the old 42px fixture.
    rect(c, P.ink, -21, 2, 42, 9); rect(c, P.stoneDark, -20, 3, 40, 7);
    rect(c, P.stone, -19, 1, 37, 5); rect(c, P.stoneLight, -19, 1, 35, 1);
    rect(c, P.ink, -18, -61, 36, 64); rect(c, P.woodShade, -17, -61, 34, 63);
    rect(c, P.wood, -16, -60, 29, 60); rect(c, P.woodLight, -16, -60, 4, 58);
    rect(c, P.woodDark, 13, -59, 4, 60);
    for (const [x, y, h] of [[-9, -35, 15], [8, -26, 16], [-6, -16, 9], [10, -55, 10]])
      rect(c, P.grain, x, y, 1, h);
    // Side wings, brow bevel and incised eyes; upper-left highlights define the carving.
    rect(c, P.ink, -21, -65, 10, 24); rect(c, P.woodLight, -20, -64, 7, 17);
    rect(c, P.ink, 11, -65, 10, 24); rect(c, P.woodShade, 12, -64, 8, 17);
    rect(c, P.woodEdge, -20, -64, 2, 12); rect(c, P.woodLight, 12, -64, 2, 9);
    rect(c, P.woodDark, -17, -54, 34, 15); rect(c, P.woodLight, -16, -56, 13, 4);
    rect(c, P.woodLight, 3, -56, 12, 4); rect(c, P.woodEdge, -16, -56, 12, 1);
    rect(c, P.ink, -13, -48, 9, 7); rect(c, P.ink, 4, -48, 9, 7);
    rect(c, mode.color, -11, -46, 6, 3); rect(c, mode.color, 5, -46, 6, 3);
    rect(c, mode.light, -11, -46, 2, 2); rect(c, mode.light, 5, -46, 2, 2);
    rect(c, P.woodDark, -4, -48, 8, 21); rect(c, P.woodLight, -3, -48, 5, 16);
    rect(c, P.woodEdge, -3, -47, 1, 13); rect(c, P.woodShade, -6, -32, 12, 5);
    rect(c, P.ink, -10, -23, 20, 6); rect(c, P.woodLight, -10, -16, 20, 2);
    for (const x of [-6, 4]) rect(c, P.paper, x, -23, 2, 3);
    // Three carved sockets indicate the selected difficulty even without the caption.
    rect(c, P.woodDark, -15, -11, 30, 8);
    for (let i = 0; i < 3; i++) {
      const x = -12 + 9 * i; rect(c, P.ink, x, -9, 6, 5);
      rect(c, i < mode.tiers ? mode.color : P.woodShade, x + 1, -8, 4, 3);
      if (i < mode.tiers) rect(c, mode.light, x + 1, -8, 3, 1);
    }
    rect(c, P.brassDark, -18, -2, 36, 3); rect(c, P.brassLight, -17, -2, 33, 1);
    pixels(c, ['##..', '.###', '..#.', '.##.'], -20, -3, P.greenShade);
  });
}
