import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/core.mjs';
const {Renderer}=await import('../src/render.mjs');

function render(players) {
  const marks = [], savedTransforms = [];
  let path, transform = {};
  const ctx = {
    save() { savedTransforms.push({...transform}); },
    restore() { transform = savedTransforms.pop(); },
    translate(x, y) { Object.assign(transform, {x, y}); },
    rotate(angle) { transform.angle = angle; },
    scale(x, y) { transform.scale = [x, y]; },
    beginPath() { path = null; },
    arc(x, y, r) { path = {kind:'dot', x, y, r}; },
    ellipse(x, y) { path = {kind:'room', x, y}; },
    moveTo(x, y) { path = {kind:'arrow', ...transform, tip:[x, y]}; },
    lineTo(x, y) { path.side = [x, y]; },
    bezierCurveTo() { path.rounded = true; },
    closePath() { path.closed = true; },
    fill() { marks.push({...path, color:this.fillStyle}); },
    stroke() { marks.push({...path, stroke:this.strokeStyle, width:this.lineWidth}); },
    fillRect(x, y, w, h) { marks.push({kind:'rect', x, y, w, h, color:this.fillStyle}); },
    strokeRect() {},
    fillText() {},
  };
  const game = {players, enemies:[], loot:[], portals:[{x:800, y:800}], explored:new Set(), time:1, ping:{x:800, y:800, until:2, color:'#ff0000'}};
  Renderer.prototype.minimap.call({age:1}, ctx, game, 400, 300);
  return marks;
}

test('Living heroes draw facing arrows in party colors at their map coordinates', () => {
  const marks = render([
    {x:800, y:800, hp:10, color:'#123abc', faceX:1, faceY:0},
    {x:0, y:1600, hp:20, color:'#ff8822', faceX:-1, faceY:-1},
  ]);
  const arrows = marks.filter(mark => mark.kind === 'arrow' && mark.color);
  assert.deepEqual(arrows.map(({x, y, color, angle}) => [x, y, color, angle]), [
    [321, 250, '#ff8822', -3 * Math.PI / 4],
    [353.5, 217.5, '#123abc', 0],
  ]);
  for (const arrow of arrows) {
    assert.deepEqual(arrow.scale, [1, 1]);
    assert.ok(arrow.tip[0] > arrow.side[0] && arrow.tip[1] === 0 && arrow.rounded && arrow.closed);
  }
  const ping = marks.findIndex(mark => mark.stroke === '#ff0000');
  assert.ok(ping >= 0 && ping < marks.findIndex(mark => mark.kind === 'arrow'));
  const primary = marks.filter(mark => mark.kind === 'arrow' && mark.x === 353.5);
  assert.deepEqual(primary.map(mark => mark.stroke || mark.color), ['#101e1d', '#123abc', '#fff9e9']);
  assert.ok(primary[0].width > primary[2].width);
  assert.equal(marks.at(-1), primary[2]);
});

test('Room and downed markers remain distinct and living players have a fallback color', () => {
  const marks = render([{x:100, y:100, hp:0}, {x:200, y:200, hp:10, room:'portal'}, {x:300, y:300, hp:10}]);
  assert.ok(marks.some(mark => mark.kind === 'rect' && mark.color === '#ffdda4'));
  assert.ok(marks.some(mark => mark.kind === 'room' && mark.stroke === '#cc81ff'));
  const arrows = marks.filter(mark => mark.kind === 'arrow' && mark.color);
  assert.deepEqual(arrows.map(({color, angle}) => [color, angle]), [['#75e6c6', Math.PI / 2]]);
});
