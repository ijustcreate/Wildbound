import {DAY_LENGTH, timeOfDay} from './night-cycle.mjs';

const MINUTES_PER_DAY = 24 * 60;
const SUNRISE_MINUTE = 6 * 60;
const PHASES = {
  day: {label: 'Day', color: '#efdb9e'},
  dusk: {label: 'Dusk', color: '#ffc097'},
  night: {label: 'Night', color: '#bbd6ff'},
  dawn: {label: 'Dawn', color: '#f9c7ba'},
};

export function wildClockReading(g) {
  const elapsed = g.sky?.elapsed || 0;
  const cycleTime = ((elapsed % DAY_LENGTH) + DAY_LENGTH) % DAY_LENGTH;
  // The simulation starts at sunrise and completes one in-world day per cycle.
  const minutes = (SUNRISE_MINUTE + Math.floor(cycleTime * MINUTES_PER_DAY / DAY_LENGTH)) % MINUTES_PER_DAY;
  const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
  const minute = String(minutes % 60).padStart(2, '0');
  return {time: `${hour}:${minute}`, phase: timeOfDay(g), progress: cycleTime / DAY_LENGTH};
}

export function drawWildClock(ctx, g, right, bottom, mapWidth) {
  const {time, phase, progress} = wildClockReading(g);
  const {label, color} = PHASES[phase];
  const width = Math.max(84, Math.round(mapWidth));
  const left = Math.round(right) - width;
  const top = Math.round(bottom) - 22;

  ctx.save();
  ctx.fillStyle = '#162b27f2';
  ctx.fillRect(left, top, width, 22);
  ctx.fillStyle = '#726b4d';
  ctx.fillRect(left, top, width, 1);
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f8efd7';
  ctx.fillText(time, left + 6, top + 8);
  ctx.font = '8px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = color;
  ctx.fillText(label, left + width - 6, top + 8);
  ctx.fillStyle = '#465450';
  ctx.fillRect(left + 6, top + 16, width - 12, 2);
  ctx.fillStyle = color;
  ctx.fillRect(left + 6, top + 16, 1 + Math.floor(progress * (width - 13)), 2);
  ctx.restore();
}
