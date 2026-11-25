import {createLevelUpPixelLight} from './level-up-pixel-light.mjs';

const COMBINE_WINDOW = .55;
const CELEBRATION_TIME = 1.8;
const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

export function startLevelUp(game, actor, previousLevel) {
  const current = actor.levelUp;
  const combine = current && game.time - current.at >= 0 && game.time - current.at <= COMBINE_WINDOW;
  actor.levelUp = {
    at: combine ? current.at : game.time,
    updatedAt: game.time,
    from: combine ? current.from : previousLevel,
    to: actor.level,
  };
}

export function activeLevelUp(actor, time) {
  const level = actor.levelUp;
  return level && time >= level.at && time - level.updatedAt < CELEBRATION_TIME ? level : null;
}

function drawGlow(ctx, x, y, rx, ry, center, edge) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  glow.addColorStop(0, center);
  glow.addColorStop(.45, edge);
  glow.addColorStop(1, '#ffd95800');
  ctx.fillStyle = glow;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function drawGroundLight(ctx, age) {
  const energy = ease(age / .09) * (1 - ease((age - .69) / .82));
  if (!energy) return;
  const radius = 13 + 25 * ease(age / .29);
  ctx.save();
  ctx.globalAlpha *= energy;
  drawGlow(ctx, 0, 5, radius * 1.62, radius * .74, '#fff4a8d9', '#f8c33d66');
  ctx.translate(0, 5);
  ctx.scale(1, .40);
  const disc = ctx.createRadialGradient(0, 0, 1, 0, 0, radius);
  disc.addColorStop(0, '#fff7b5df');
  disc.addColorStop(.62, '#ffe75dc9');
  disc.addColorStop(.88, '#fbd33bb5');
  disc.addColorStop(1, '#ffe866c8');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ffe968';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = '#fff4a2';
  ctx.lineWidth = 1.5;
  const turn = age * .68;
  for (let i = 0; i < 3; i++) {
    const angle = turn + i * TAU / 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, angle, angle + 1.37);
    ctx.stroke();
  }
  ctx.fillStyle = '#87601144';
  for (let i = 0; i < 7; i++) {
    const angle = i * 2.39996;
    const distance = radius * (.34 + (i % 3) * .19);
    ctx.fillRect(Math.round(Math.cos(angle) * distance), Math.round(Math.sin(angle) * distance), 2 + i % 2, 3);
  }
  const ripple = clamp((age - .16) / .86);
  ctx.globalAlpha *= Math.sin(ripple * Math.PI) * .62;
  ctx.strokeStyle = '#ffe577';
  ctx.lineWidth = 2.6 * (1 - ripple) + .7;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 3 + ripple * 11, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawColumnRibbon(ctx, start, height, width, bend, colors) {
  const light = ctx.createLinearGradient(0, -height, 0, 5);
  colors.forEach((color, index) => light.addColorStop([0, .25, .70, 1][index], color));
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.moveTo(start + bend, -height);
  ctx.bezierCurveTo(start + bend * .18, -height * .79, start + width * .63, -height * .60, start + width * .54, -height * .48);
  ctx.bezierCurveTo(start + width * .43, -height * .36, start + width * 1.35, -height * .26, start + width * .67, 2);
  ctx.bezierCurveTo(start + width * .45, 8, start - width * .65, 7, start - width * .64, 2);
  ctx.bezierCurveTo(start - width * .75, -height * .13, start - width * 1.14, -height * .32, start - width * .42, -height * .48);
  ctx.bezierCurveTo(start - width * .16, -height * .59, start + bend - width * .32, -height * .73, start + bend, -height);
  ctx.fill();
}

function drawAscendingLight(ctx, age) {
  const energy = ease(age / .16) * (1 - ease((age - .32) / .94));
  if (!energy) return;
  const height = 36 + 71 * ease(age / .28);
  const drift = Math.sin(age * 13) * 2.4;
  ctx.save();
  ctx.globalAlpha *= energy;
  drawGlow(ctx, 0, -height * .31, 32, height * .68, '#ffe875cc', '#ffd04e66');
  drawColumnRibbon(ctx, 0, height, 19, drift, ['#fff4a000', '#ffe59134', '#ffe061a1', '#fff3a8ab']);
  drawColumnRibbon(ctx, -5, height * .79, 7, -3 - drift, ['#fff4a000', '#fff1a725', '#ffdf5693', '#ffea8372']);
  drawColumnRibbon(ctx, 5, height * .84, 7, 4 + drift, ['#fff4a000', '#ffea8429', '#ffd65a8c', '#ffdf4c72']);
  const core = ease(age / .19) * (1 - ease((age - .25) / .52));
  ctx.globalAlpha *= .50 + .5 * core;
  drawGlow(ctx, 0, -height * .27, 17, height * .52, '#ffffe9f0', '#fff4a6a8');
  drawColumnRibbon(ctx, 0, height * .94, 7.5, drift * .55, ['#fffcdd00', '#fff2a968', '#fffbd8ed', '#fffff0']);
  ctx.restore();
}

function drawMotes(ctx, age) {
  const energy = ease(age / .14) * (1 - ease((age - .64) / .83));
  if (!energy) return;
  const alpha = ctx.globalAlpha * energy;
  for (let i = 0; i < 18; i++) {
    const rise = (i * .137 + age * (.66 + i % 4 * .14)) % 1;
    const orbit = i * 2.39996 + age * (1.4 + i % 3 * .3);
    const x = Math.round(Math.cos(orbit) * (32 - rise * 22));
    const y = Math.round(Math.sin(orbit) * 8 * (1 - rise) - rise * (53 + i % 5 * 9));
    ctx.globalAlpha = alpha * Math.sin(rise * Math.PI);
    ctx.fillStyle = i % 5 === 0 ? '#fff4b3' : '#ffe08d';
    ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, 2);
  }
  for (let i = 0; i < 3; i++) {
    const rise = clamp((age - .08 - i * .085) / (.80 + i * .11));
    ctx.globalAlpha = alpha * ease(rise * 7) * (1 - ease((rise - .56) / .44));
    const x = (i === 1 ? -1 : 1) * (12 + i * 6 + Math.sin(rise * Math.PI) * 6);
    const y = -3 - rise * (70 + i * 7);
    drawGlow(ctx, x, y, 8, 16, '#fff2a1d6', '#ffd84b54');
    ctx.fillStyle = '#fff3a1';
    ctx.beginPath();
    ctx.moveTo(x + 1, y - 8);
    ctx.quadraticCurveTo(x + 2, y - 3, x + 3.5, y);
    ctx.quadraticCurveTo(x + 1, y + 2, x - 1, y + 7);
    ctx.quadraticCurveTo(x - 1.5, y + 2, x - 3, y);
    ctx.quadraticCurveTo(x - .5, y - 3, x + 1, y - 8);
    ctx.fill();
  }
}

const TITLE_GLYPHS = {
  L: [16, 16, 16, 16, 16, 16, 31],
  E: [31, 16, 16, 30, 16, 16, 31],
  V: [17, 17, 17, 17, 17, 10, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
};
let levelTitle;

function drawLevelWordmark(ctx, y) {
  if (!levelTitle) {
    levelTitle = document.createElement('canvas');
    levelTitle.width = 53;
    levelTitle.height = 9;
    const pen = levelTitle.getContext('2d');
    const pixels = [];
    let x = 1;
    for (const letter of 'LEVEL UP') {
      if (letter === ' ') {
        x += 4;
        continue;
      }
      TITLE_GLYPHS[letter].forEach((bits, row) => {
        for (let column = 0; column < 5; column++) {
          if (bits & (16 >> column)) pixels.push([x + column, 1 + row]);
        }
      });
      x += 7;
    }
    pen.fillStyle = '#37271b';
    for (const [px, py] of pixels) pen.fillRect(px - 1, py - 1, 3, 3);
    for (const [px, py] of pixels) {
      pen.fillStyle = py <= 3 ? '#fff3bb' : py <= 5 ? '#ffe38e' : '#f6bf65';
      pen.fillRect(px, py, 1, 1);
    }
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(levelTitle, -26, y - 4);
}

function drawLevelTitle(ctx, level, age, labelY) {
  const points = level.to - level.from;
  const arrival = ease((age - .08) / .17);
  if (!arrival) return;
  ctx.save();
  ctx.globalAlpha *= arrival;
  const rule = Math.floor(22 * ease(age / .38));
  const alpha = ctx.globalAlpha;
  ctx.fillStyle = '#ffe38e';
  for (let i = 0; i < rule; i++) {
    const distance = 29 + i * 2;
    ctx.globalAlpha = alpha * (1 - i / rule) * .7;
    ctx.fillRect(-distance - 2, labelY, 2, 1);
    ctx.fillRect(distance, labelY, 2, 1);
  }
  ctx.globalAlpha = alpha;
  drawLevelWordmark(ctx, labelY);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#352315e8';
  ctx.font = '600 6px monospace';
  ctx.lineWidth = 1.15;
  ctx.fillStyle = '#ffe5a9';
  const detail = [`Lv. ${level.from} → ${level.to}`, `+${points} Training Point${points === 1 ? '' : 's'}`];
  detail.forEach((text, index) => {
    const y = labelY + 11 + 8 * index;
    ctx.strokeText(text, 0, y);
    ctx.fillText(text, 0, y);
  });
  ctx.restore();
}

const drawPixelGround = createLevelUpPixelLight(drawGroundLight, {x: -64, y: -26, width: 128, height: 62});
const drawPixelColumn = createLevelUpPixelLight((ctx, age) => {
  drawAscendingLight(ctx, age);
  drawMotes(ctx, age);
}, {x: -48, y: -112, width: 96, height: 156});

export function drawLevelUp(ctx, actor, time, {x, y, labelOffset = 0, layer = 'both'} = actor) {
  const level = activeLevelUp(actor, time);
  if (!level) return;
  const age = time - level.at;
  const fade = clamp((CELEBRATION_TIME - (time - level.updatedAt)) / .42);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.globalAlpha *= fade;
  if (layer !== 'front') drawPixelGround(ctx, age);
  if (layer !== 'back') {
    drawPixelColumn(ctx, age);
    drawLevelTitle(ctx, level, age, Math.round(-59 - labelOffset));
  }
  ctx.restore();
}
