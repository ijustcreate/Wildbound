// A smooth turtle carapace: lifted at the forehead, tapered over the nape,
// with a single longitudinal ridge instead of leaves or tiled scutes.
export function drawAlanTurtleHelmet(c, head, d) {
  const ox = Math.round(head.x), oy = Math.round(head.y);
  const pixel = (x, y, color) => {
    c.fillStyle = color;
    c.fillRect(ox + x, oy + y, 1, 1);
  };
  const ink = '#192c21', shade = '#294b30', body = '#3c633d';
  const light = '#52794a', ridge = '#6b8d55', lip = '#213b28';
  const side = d === 2 || d === 6;
  const back = d >= 3 && d <= 5;

  if (side) {
    // The long back edge follows the drawn low brim while the short front
    // rises near the face. Keep the crown near the front third of the shell.
    const facing = d === 2 ? -1 : 1;
    const top = [-7, -9, -10, -10, -10, -9, -8, -7, -6, -5, -4];
    for (let i = 0; i < top.length; i++) {
      const x = facing * (2 - i);
      for (let y = top[i]; y <= -3; y++) {
        const color = y === top[i] ? ink : y === -3 ? lip :
          y <= top[i] + 1 ? light : i > 9 ? shade : body;
        pixel(x, y, color);
      }
    }
    // One raised line runs continuously from front to back along the shell.
    for (let i = 1; i < top.length - 1; i++) {
      const x = facing * (2 - i), y = top[i] + 1;
      pixel(x, y, i > 7 ? light : ridge);
    }
    pixel(facing * 2, -7, ridge);
    return true;
  }

  const halfWidths = [2, 4, 5, 6, 6, 6];
  for (let row = 0; row < halfWidths.length; row++) {
    const y = -10 + row, half = halfWidths[row];
    for (let x = -half; x <= half; x++) {
      const edge = Math.abs(x) === half;
      pixel(x, y, edge ? ink : row === 0 ? light :
        x < -half + 2 ? light : x > half - 2 ? shade : body);
    }
  }
  for (let x = -6; x <= 6; x++) pixel(x, -4, lip);
  // The center line faces the viewer front and back, and angles in the turns.
  const turn = d === 1 || d === 3 ? -1 : d === 5 || d === 7 ? 1 : 0;
  for (let row = 0; row < 5; row++) {
    const x = turn ? Math.round(turn * row / 3) : 0;
    pixel(x, -10 + row, row === 0 ? '#79945c' : ridge);
  }
  if (back) {
    pixel(-4, -3, shade); pixel(-3, -3, shade);
    pixel(3, -3, shade); pixel(4, -3, shade);
  } else {
    pixel(turn, -4, ridge);
    pixel(turn, -3, light);
  }
  return true;
}
