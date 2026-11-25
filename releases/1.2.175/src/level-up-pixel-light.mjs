const PIXEL_SIZE = 2;
const FRAMES_PER_SECOND = 32;
const FRAME_COUNT = 50;
const ATLAS_COLUMNS = 8;

const GOLD = [
  [160, 88, 31],
  [210, 128, 31],
  [239, 161, 41],
  [252, 197, 57],
  [255, 222, 98],
  [255, 244, 173],
  [255, 255, 235],
];
const COVERAGE = [0, 55, 117, 187, 255];
// The ordered pattern stays fixed to the actor as the light expands.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function shadeLight({data, width, height}) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      if (!alpha) continue;
      const dither = (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16;
      const coverage = Math.floor(alpha * (4 / 255) + dither);
      data[index + 3] = COVERAGE[coverage];
      if (!coverage) continue;

      const light = (data[index + 1] * 3 + data[index + 2]) / 4;
      const shade = Math.max(0, Math.min(6, Math.floor((light - 105) * (6 / 145) + 1 - dither)));
      const [r, g, b] = GOLD[shade];
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
    }
  }
}

// Rasterize each short animation once. Split views and co-op reuse the same
// two small atlases, with no canvas readback after a frame has been shaded.
export function createLevelUpPixelLight(paint, bounds) {
  const {x, y, width, height} = bounds;
  const frameWidth = width / PIXEL_SIZE;
  const frameHeight = height / PIXEL_SIZE;
  const ready = new Uint8Array(FRAME_COUNT);
  let atlas, atlasPen, framePen;

  return function drawPixelLight(ctx, age) {
    const frame = Math.floor(age * FRAMES_PER_SECOND);
    if (frame < 0 || frame >= FRAME_COUNT) return;
    if (!atlas) {
      atlas = document.createElement('canvas');
      atlas.width = frameWidth * ATLAS_COLUMNS;
      atlas.height = frameHeight * Math.ceil(FRAME_COUNT / ATLAS_COLUMNS);
      atlasPen = atlas.getContext('2d');
      const scratch = document.createElement('canvas');
      scratch.width = frameWidth;
      scratch.height = frameHeight;
      framePen = scratch.getContext('2d', {willReadFrequently: true});
    }
    const sx = (frame % ATLAS_COLUMNS) * frameWidth;
    const sy = Math.floor(frame / ATLAS_COLUMNS) * frameHeight;
    if (!ready[frame]) {
      framePen.resetTransform();
      framePen.clearRect(0, 0, frameWidth, frameHeight);
      framePen.save();
      framePen.scale(1 / PIXEL_SIZE, 1 / PIXEL_SIZE);
      framePen.translate(-x, -y);
      paint(framePen, frame / FRAMES_PER_SECOND);
      framePen.restore();
      const pixels = framePen.getImageData(0, 0, frameWidth, frameHeight);
      shadeLight(pixels);
      atlasPen.putImageData(pixels, sx, sy);
      ready[frame] = 1;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atlas, sx, sy, frameWidth, frameHeight, x, y, width, height);
  };
}
