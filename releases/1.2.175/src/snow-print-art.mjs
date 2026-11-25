const snowPrintColors = { r: '#f0f7f7', s: '#a9beca', d: '#829aa8' };

function snowPrintFacings(cardinal, diagonal) {
  // Author the diagonal separately to keep the heel, tread gaps, and paw pads
  // intact. Quarter turns then stay on the world-pixel grid.
  return Array.from({ length: 8 }, (_, facing) => {
    const mask = facing % 2 ? diagonal : cardinal;
    const angle = Math.floor(facing / 2) * Math.PI / 2;
    const cos = Math.round(Math.cos(angle)), sin = Math.round(Math.sin(angle));
    const pixels = { r: [], s: [], d: [] };
    for (const [row, line] of mask.entries()) {
      for (let column = 0; column < line.length; column++) {
        const tone = line[column];
        if (tone === '.') continue;
        const x = column - Math.floor(line.length / 2);
        const y = row - Math.floor(mask.length / 2);
        pixels[tone].push([x * cos - y * sin, x * sin + y * cos]);
      }
    }
    return Object.entries(snowPrintColors).map(([tone, color]) => [color, pixels[tone]]);
  });
}

const boots = snowPrintFacings([
  '.....rr.',
  '.rr.rsss',
  'rddsddds',
  '.ds.sdds',
  '.....ss.',
], [
  '.rr....',
  'rds....',
  '.ds.rr.',
  '...dssr',
  '..sddss',
  '..sdds.',
  '...ss..',
]);

const paws = snowPrintFacings([
  '....rs.',
  '.rs....',
  'rdd..rs',
  '.ds....',
  '....rs.',
], [
  '.......',
  '.rs....',
  'rdd..r.',
  '.ds..s.',
  '......s',
  '..r.s..',
  '...s...',
]);

export function drawSnowPrint(c, mark) {
  const facing = (Math.round(mark.angle / (Math.PI / 4)) + 8) % 8;
  const x = Math.round(mark.x), y = Math.round(mark.y);
  for (const [color, pixels] of (mark.animal ? paws : boots)[facing]) {
    c.fillStyle = color;
    for (const [px, py] of pixels) c.fillRect(x + px, y + py, 1, 1);
  }
}
