import {ITEMS, itemKind} from './items.mjs';

export const hasAimWeapon = actor => itemKind(actor.equipment?.hand1) === 'bow' ||
  ['hand1','hand2'].some(slot => ITEMS[actor.equipment?.[slot]]?.magic);

export function updateAimFacing(actor, input) {
  const ax = input.aimX || 0, ay = input.aimY || 0;
  const mx = input.x || 0, my = input.y || 0;
  const aim = Math.hypot(ax, ay), move = Math.hypot(mx, my);
  if (aim > .2) { actor.faceX = ax / aim; actor.faceY = ay / aim; }
  else if (move > .15) { actor.faceX = mx / move; actor.faceY = my / move; }
}
