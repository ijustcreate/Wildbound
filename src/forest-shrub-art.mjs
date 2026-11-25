// Side sprays read against the dark interior, with the brightest leaves on the upper-left planes.
const shrubStyles = [
  {
    colors: ['#20372b', '#304b31', '#405c37', '#536c40', '#6b8249', '#829255'],
    crowns: [[-17, -13, .76], [-7, -21, .93], [10, -17, .88], [21, -10, .7], [0, -10, .81]],
    bloom: '#d7c888',
  },
  {
    colors: ['#233a30', '#30513e', '#41664b', '#527955', '#6b8b5e', '#849665'],
    crowns: [[-18, -10, .77], [8, -22, .94], [-8, -17, .88], [19, -13, .78], [4, -9, .84]],
    bloom: '#b58b96',
  },
  {
    colors: ['#2c3926', '#404e2a', '#506335', '#62743c', '#798647', '#929851'],
    crowns: [[-18, -9, .73], [-9, -20, 1], [9, -17, .9], [20, -10, .76], [2, -8, .75]],
    berry: '#ab5846',
  },
  {
    colors: ['#203a30', '#2c513d', '#3d6449', '#4e7755', '#63875d', '#7b9567'],
    crowns: [[-18, -12, .77], [5, -20, .98], [18, -14, .77], [-9, -12, .85], [8, -8, .71]],
    berry: '#946a84',
  },
];

const interior = [
  [-28, -8], [-26, -15], [-22, -17], [-20, -21], [-15, -20], [-11, -25],
  [-2, -25], [4, -27], [13, -24], [17, -18], [23, -17], [27, -11],
  [28, -6], [25, -3], [18, 1], [12, -1], [7, 2], [1, 0], [-6, 2],
  [-12, -1], [-18, 1], [-25, -2],
];

const spray = [
  [-13, 1], [-12, -4], [-9, -5], [-9, -8], [-5, -8], [-3, -11],
  [0, -10], [2, -8], [6, -9], [9, -6], [12, -4], [14, 0], [11, 2],
  [9, 5], [6, 4], [3, 7], [0, 5], [-3, 6], [-6, 3], [-8, 4], [-9, 1],
];

// Each leaf is a small connected cluster. The left-hand leaf shapes open away from the stem.
const leafShapes = [
  [[-4, -2], [-1, -2], [-1, -3], [2, -3], [2, -2], [4, -2], [2, 1], [-1, 2], [-1, 1], [-3, 1]],
  [[-3, -4], [-1, -4], [-1, -3], [2, -2], [2, 0], [3, 2], [0, 2], [-2, 1], [-2, -1], [-3, -2]],
  [[-3, 1], [-2, -1], [1, -3], [4, -3], [4, 0], [3, 0], [2, 2], [0, 2], [-1, 3], [-3, 3]],
];

const leafSpray = [
  [-9, -2, 0, 3], [-6, -5, 1, 4], [-2, -7, 1, 5], [2, -5, 2, 4],
  [7, -5, 2, 3], [10, -1, 2, 2], [-4, -1, 0, 4], [1, -1, 2, 3],
  [-7, 2, 1, 2], [-2, 3, 1, 3], [4, 2, 0, 2], [7, 3, 2, 2], [1, 5, 1, 1],
];

export function paintWoodlandShrub(poly, rect, variant, windPose) {
  const { colors, crowns, bloom, berry } = shrubStyles[variant % shrubStyles.length];
  poly(interior, colors[0]);

  for (let index = 0; index < crowns.length; index++) {
    const [x, y, size] = crowns[index];
    const flip = (variant + index) % 2 === 0 ? 1 : -1;
    const lit = index === 1 || index === 2;
    const offset = windPose * (lit ? 1 : .35);
    const pointsAt = (points, dx, dy, scale = 1) => points.map(([u, v]) => [
      x + dx + u * size * scale * flip,
      y + dy + v * size * scale,
    ]);

    poly(pointsAt(spray, offset, 0), colors[0]);
    poly(pointsAt(spray, offset - .6, -.8, .9), colors[lit ? 2 : 1]);
    for (const [dx, dy, shape, tone] of leafSpray) {
      const upper = dy < -3;
      const exposed = dx * flip < 4;
      const color = colors[Math.max(1, tone - Number(!lit) - Number(!exposed && upper))];
      const tip = offset + (upper ? windPose * (index % 2 ? .6 : .25) : 0);
      poly(pointsAt(leafShapes[shape], dx * size * flip + tip, dy * size, .78), color);
    }

    if (index === 2 || index === 4) {
      const fruitX = x + 3 * flip + offset;
      if (bloom) {
        rect(fruitX - 1, y - 2, 3, 1, bloom);
        rect(fruitX, y - 3, 1, 3, bloom);
        rect(fruitX, y - 2, 1, 1, '#ac8253');
      }
      if (berry) {
        rect(fruitX - 1, y - 4, 2, 2, berry);
        rect(fruitX + 3, y, 2, 2, berry);
      }
    }
  }

  poly([[-17, -1], [-14, -3], [-8, -3], [-9, 0], [-14, 1]], colors[1]);
  poly([[11, 0], [14, -3], [18, -3], [19, -2], [16, 0]], colors[1]);
}
