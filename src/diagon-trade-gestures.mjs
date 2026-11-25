const DURATIONS = {
  satchel: { rise: .4, span: 2.05, period: 6.8, offset: .75 },
  vial: { rise: .45, span: 2.4, period: 7.6, offset: 0 },
  fork: { rise: .375, span: 1.8, period: 4.4, offset: 0 },
};

const ease = value => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

export function tradeGestureActor(actor, time, conversation) {
  const node = conversation?.node;
  const kind = actor.residentId === 'dara' ? 'satchel'
    : actor.id === 'alley-apothecary' ? 'vial'
      : actor.residentId === 'hermione' && (node === 'topic' || node?.startsWith('reply:')) ? 'fork' : null;
  if (!kind || actor.moving || actor.darkWizardAlarm || actor.fortescueCone) return actor;
  const { rise, span, period, offset } = DURATIONS[kind];
  const elapsed = kind === 'fork' ? Math.max(0, time - (conversation.residentGestureAt ?? time)) : time;
  const beat = (elapsed + offset) % period;
  if (beat <= 0 || beat >= span) return actor;
  const amount = ease(Math.min(beat, span - beat) / rise);
  return { ...actor, animationAction: 'idle', tradeGesture: { kind, beat, amount } };
}

export function fitTradeGesture(pose, { kind, beat, amount }) {
  const sort = Math.sin(beat * 14) * .65;
  const tap = Math.max(0, 1 - Math.abs(beat - .78) / .15) + Math.max(0, 1 - Math.abs(beat - 1.04) / .15);
  const hands = kind === 'satchel' ? [[-2, 8, 17], [3 + sort, 9, 22 + sort]]
    : kind === 'vial' ? [[-2, 7, 19], [12, 4.5, 24.5 + sort]]
      : [[3 + tap * 4, 5, 20 + tap * 5], [10.5, 4, 22]];
  for (const [index, side] of ['L', 'R'].entries()) {
    const hand = 'hand' + side, elbow = 'elbow' + side;
    const delta = pose[hand].map((value, axis) => (hands[index][axis] - value) * amount);
    pose[hand] = pose[hand].map((value, axis) => value + delta[axis]);
    pose[elbow] = pose[elbow].map((value, axis) => value + delta[axis] * .35);
  }
}

export function paintTradeProp(pixel, { kind, beat, amount }, left, right, facing) {
  if (amount < .24) return;
  const back = facing >= 3 && facing <= 5;
  const narrow = facing === 2 || facing === 6;
  const edge = '#33272a';
  if (kind === 'satchel') {
    const x = left.x, y = left.y, w = narrow ? 8 : 12, half = w / 2;
    const opening = beat > .38 && beat < 1.53;
    pixel(x-half+1,y-8,w-2,10,edge);pixel(x-half,y-6,w,6,edge);
    pixel(x-half+1,y-6,w-2,6,back?'#695047':'#926044');
    pixel(x-half+1,y-7,w-2,2,opening?'#4c362f':'#b18357');
    if (opening) pixel(x-2,y-9,4,2,'#dfc89b');
    if (!back&&!opening) pixel(x-1,y-5,2,2,'#ddb171');
  } else if (kind === 'vial') {
    const x = right.x, y = right.y, w = narrow ? 6 : 8, half = w / 2;
    pixel(x-half+1,y-8,w-2,8,edge);pixel(x-half,y-6,w,5,edge);
    pixel(x-2,y-12,4,4,edge);pixel(x-1,y-12,2,2,'#ba9164');
    pixel(x-1,y-10,2,2,'#adc9ae');
    pixel(x-half+1,y-6,w-2,2,'#709e9e');pixel(x-half+1,y-4,w-2,3,'#417b70');
    pixel(x-half+1,y-5,1,3,'#c5e8c8');
    if (beat > .82 && beat < 1.13) pixel(x-half+1,y-6,2,1,'#edf4ca');
  } else {
    const x = right.x, y = right.y, w = narrow ? 5 : 7, half = Math.floor(w / 2);
    pixel(x-1,y-7,3,7,edge);
    pixel(x-half,y-9,w,4,edge);pixel(x-half,y-13,2,5,edge);pixel(x+half-1,y-13,2,5,edge);
    pixel(x-half+1,y-12,1,4,'#dae2cf');pixel(x+half-1,y-12,1,4,'#91a7a6');
    pixel(x-half+1,y-9,w-2,1,'#bdcebe');
    pixel(x,y-8,1,6,'#b6c7c1');
    if (beat >= .78 && beat < .88 || beat >= 1.04 && beat < 1.14) {
      pixel(x-half-2,y-12,1,1,'#e6d8a6');pixel(x+half+2,y-11,1,1,'#e6d8a6');
    }
  }
}
