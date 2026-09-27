import test from 'node:test';
import assert from 'node:assert/strict';
import { drawPlayer, defaultPlayerMotion, poseAt, projectPoint, directionVector } from '../src/player-motion.mjs';
import { DEFAULT_APPEARANCE } from '../src/appearance.mjs';

test('Base trousers cover the shirt endpoint between the hips in front and rear run poses', () => {
  const model = defaultPlayerMotion();
  for (const direction of [0, 4]) for (let frame = 0; frame < 8; frame++) {
    const pixels = new Map();
    const ctx = { fillStyle: '', fillRect(x, y, w, h) {
      for (let py = Math.floor(y); py < y + h; py++)
        for (let px = Math.floor(x); px < x + w; px++) pixels.set(`${px},${py}`, this.fillStyle);
    }};
    const pose = poseAt(model, 'run', frame);
    const pelvis = projectPoint(pose.pelvis, direction);
    const [faceX, faceY] = directionVector(direction);
    drawPlayer(ctx, { faceX, faceY, equipment: {}, appearance: { ...DEFAULT_APPEARANCE, shirt: '#00ff00', pants: '#bb2288' } }, 0, model, pose);
    assert.equal(pixels.get(`${Math.round(pelvis.x)},${Math.round(pelvis.y + 2)}`), '#bb2288', `direction ${direction}, frame ${frame}`);
  }
});
