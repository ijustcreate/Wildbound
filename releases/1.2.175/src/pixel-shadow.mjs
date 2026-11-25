// Rasterize a shadow to world-aligned cells before the camera scales it.
// Appending spans to one path lets overlapping casters share a single fill.
export function addPixelShadowPolygon(ctx, points, step = 2, bounds) {
  if (points.length < 3) return;
  const yValues = points.map(point => point[1]);
  const firstRow = Math.floor(Math.max(Math.min(...yValues), bounds?.top ?? -Infinity) / step);
  const endRow = Math.ceil(Math.min(Math.max(...yValues), bounds?.bottom ?? Infinity) / step);
  const leftCell = Math.floor((bounds?.left ?? -Infinity) / step);
  const rightCell = Math.ceil((bounds?.right ?? Infinity) / step);
  const crossings = [];

  for (let row = firstRow; row < endRow; row++) {
    const y = (row + .5) * step;
    crossings.length = 0;
    let [ax, ay] = points.at(-1);
    for (const [bx, by] of points) {
      if ((ay > y) !== (by > y)) crossings.push(ax + (bx - ax) * (y - ay) / (by - ay));
      ax = bx;
      ay = by;
    }
    if (crossings.length > 2) crossings.sort((a, b) => a - b);
    if (crossings.length === 2 && crossings[0] > crossings[1]) crossings.reverse();
    for (let i = 0; i < crossings.length; i += 2) {
      const left = Math.max(leftCell, Math.ceil(crossings[i] / step - .5));
      const right = Math.min(rightCell, Math.ceil(crossings[i + 1] / step - .5));
      if (right > left) ctx.rect(left * step, row * step, (right - left) * step, step);
    }
  }
}
