import { pixelLine, pixelPolygon } from './pixel-shapes.mjs';

const COOL_STEEL = {
  ink:'#212731', shade:'#596d7e', face:'#a5bec3', edge:'#e9f4e8',
  guardInk:'#3a2c26', guard:'#9c754c', brass:'#d5ad70', grip:'#62473d', binding:'#a37d59',
};

const BLADE_ART = {
  ritual_dagger: {
    ...COOL_STEEL, ink:'#163240', shade:'#247c82', face:'#5bcec1', edge:'#c9fff0',
    guardInk:'#4d3430', guard:'#a86b42', brass:'#f1c478', grip:'#624044', binding:'#ab7560',
    outline:[[-1,2],[-2,4],[-2,8],[-1,11],[0,12],[1,10],[2,5],[1,2]],
    ridge:[[0,3],[0,10],[0,11]], guardWidth:3,
  },
  star_dagger: {
    ...COOL_STEEL, ink:'#202f42', shade:'#3d7798', face:'#92d2dd', edge:'#ebf5df',
    outline:[[-1,2],[-2.4,5],[-2.1,8],[-1,10],[0,12],[1,10],[2.1,8],[2.4,5],[1,2]],
    ridge:[[0,3],[-.5,6],[0,11]], guardWidth:3.5, stone:'#b8e7ed',
  },
  starter_dagger: {
    ...COOL_STEEL, ink:'#2c3134', shade:'#69757a', face:'#a4afa8', edge:'#edebd6',
    outline:[[-1,2],[-1.8,4],[-1.8,9],[.15,12],[1.5,8],[1.5,3],[.8,2]],
    ridge:[[.35,3],[.35,8],[.15,11]], guardWidth:2.45,
  },
  starter_sword: {
    ...COOL_STEEL,
    outline:[[-1.6,2],[-2.4,3.2],[-2.25,9.3],[-1.35,11],[0,12],[1.35,11],[2.25,9.3],[2.4,3.2],[1.6,2]],
    ridge:[[0,3],[0,9],[0,11]], guardWidth:3.7,
  },
  sun_blade: {
    ink:'#60383a', shade:'#bc713b', face:'#f5bb5b', edge:'#fff1ab',
    guardInk:'#5e3832', guard:'#af6c3d', brass:'#ffd278', grip:'#663d3e', binding:'#b47854',
    outline:[[-1.7,2],[-3,4],[-3,8],[-2,10],[-.9,11.4],[0,12],[1.1,11.2],[2.3,9],[3,6.8],[2.5,3.4],[1.5,2]],
    ridge:[[0,3],[-.7,6],[0,11]], guardWidth:4.1, stone:'#fff6be',
  },
  thorn_dagger: {
    ink:'#23342d', shade:'#4e704e', face:'#a2ab69', edge:'#e1dfad',
    guardInk:'#422d26', guard:'#877352', brass:'#c8b27a', grip:'#423e35', binding:'#7d8054',
    outline:[[-1.1,2],[-2.4,5],[-2.6,9],[-1.4,11],[.4,12],[1.25,11],[0,10],[1.1,8],[1.9,4],[1,2]],
    ridge:[[0,3],[-.6,6],[-1.1,9.5]], guardWidth:2.6,
  },
};

const RETURNER_ART = {
  starter_boomerang:{ink:'#453529', shadow:'#886145', face:'#b28a58', light:'#e1bd79', bound:'#9e7753'},
  sun_boomerang:{ink:'#633d35', shadow:'#ae6536', face:'#df963c', light:'#ffe196', bound:'#eaab4e'},
};

function bladeArt(c, art, point) {
  const area = (color, points) => pixelPolygon(c, points.map(point), color);
  const line = (color, a, b) => pixelLine(c, point(a), point(b), color);
  const [edgeStart, edgeJoint, edgeEnd] = art.ridge;

  area(art.ink, art.outline);
  const inside = art.outline.map(([side, forward]) => [side * .77, 3 + (forward - 2) * .87]);
  area(art.shade, inside);
  const litEdge = inside.filter(([side]) => side < 0);
  area(art.face, [edgeStart, ...litEdge, edgeEnd, edgeJoint]);
  line(art.face, edgeJoint, edgeEnd);
  line(art.edge, [edgeStart[0] - .65, edgeStart[1] + 1.5], [edgeEnd[0] - .55, edgeEnd[1] - 1]);

  const guard = art.guardWidth;
  area(art.guardInk, [[-1,-4],[.9,-4],[1.4,-3],[1.05,1.6],[-1.05,1.6],[-1.4,-3]]);
  line(art.grip, [0,-3], [0,1]);
  line(art.binding, [-.3,-2.8], [-.3,-2.1]);
  area(art.guardInk, [[-guard,.8],[-guard,2.5],[-1,2.8],[0,3.3],[1,2.8],[guard,2.5],[guard,.8],[1,.75],[0,.45],[-1,.75]]);
  line(art.guard, [-guard+.7,1.55], [guard-.65,1.55]);
  line(art.brass, [-guard+.8,2.15], [.4,2.15]);
  if (art.stone) line(art.stone,[0,2],[0,2.45]);
}

function twigArt(c, point) {
  const area = (color, points) => pixelPolygon(c, points.map(point), color);
  const line = (color, a, b) => pixelLine(c, point(a), point(b), color);
  area('#44362d', [[-.7,-2],[-1.4,.3],[-.9,4],[-1.65,7],[-1.3,10],[-.5,12],[.65,12],[1,10],[.55,8],[1.3,4],[1.3,-.5],[.45,-2]]);
  area('#936e46', [[-.45,-1],[-.55,4],[-1,7],[-.55,11],[.4,11.5],[.35,9],[-.05,7],[.65,4],[.65,0],[.25,-1]]);
  line('#cca86b',[-.4,5],[-.5,9.7]);
  area('#59402d', [[-.5,6],[1.1,7],[1.6,9.1],[2.85,10], [2.8,11],[1.6,10.8],[.75,9.3],[.3,8],[-.2,8]]);
  line('#a68050',[1,8.65],[2.3,10.35]);
}

export function drawTrialMeleeBlade(c, id, hand, tip) {
  const art = BLADE_ART[id];
  if (!art && id !== 'stick') return false;
  const dx = tip.x - hand.x;
  const dy = tip.y - hand.y;
  const length = Math.hypot(dx, dy);
  if (length < .01) return false;

  const normalX = -dy / length;
  const normalY = dx / length;
  const width = Math.min(1, .6 + length * .055);
  // Keep the grip on the hand. Positive distances follow the existing projected point.
  const point = ([side, distance]) => {
    const along = distance >= 0 ? distance / 12 : distance / length;
    return {
      x: hand.x + dx * along + normalX * side * width,
      y: hand.y + dy * along + normalY * side * width,
    };
  };
  if (art) bladeArt(c, art, point);
  else twigArt(c, point);
  return true;
}

function returnerWing(c, hand, tip, bend, art) {
  const dx = tip.x - hand.x;
  const dy = tip.y - hand.y;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = dy / length * bend;
  const normalY = -dx / length * bend;
  const point = ([along, side]) => ({
    x: hand.x + dx * along + normalX * side,
    y: hand.y + dy * along + normalY * side,
  });
  const area = (color, points) => pixelPolygon(c, points.map(point), color);

  area(art.ink,[[-.2,-1.45],[.1,-1.55],[.55,-.8],[.96,-.5],[1.12,.05],[1.04,1.05],[.82,1.55],[.47,1.45],[.15,1.35],[-.18,1]]);
  area(art.shadow,[[-.08,-.8],[.18,-.9],[.55,-.2],[.97,.15],[.91,.9],[.62,.91],[.33,.75],[-.05,.65]]);
  area(art.face,[[.08,.15],[.35,.08],[.6,.45],[.97,.3],[.91,.94],[.56,1.05],[.27,.92],[.06,.65]]);
  pixelLine(c,point([.28,.72]),point([.81,.92]),art.light);
  pixelLine(c,point([.87,.15]),point([.99,.5]),art.bound);
}

export function drawTrialBoomerang(c, id, hand, a, b) {
  const art = RETURNER_ART[id];
  if (!art) return false;
  const bend = a.x <= b.x ? 1 : -1;
  returnerWing(c, hand, a, bend, art);
  returnerWing(c, hand, b, -bend, art);
  return true;
}

const WHIP_LASH = { ink:'#3b2632', body:'#a45670', thick:'#bc6a80', braid:'#f1a498', binding:'#d6a36c' };

export function drawTrialWhipLash(c, hand, projected, segments) {
  let previous = hand;
  for (let i = 1; i <= segments; i++) {
    const next = {x:projected[i*2], y:projected[i*2+1]};
    pixelLine(c,previous,next,WHIP_LASH.ink,i <= 12 ? 3 : 2);
    previous = next;
  }

  previous = hand;
  let traveled = 0;
  let braidAt = 5;
  let gripEnd = {x:projected[2], y:projected[3]};
  for (let i = 1; i <= segments; i++) {
    const next = {x:projected[i*2], y:projected[i*2+1]};
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.hypot(dx, dy);
    pixelLine(c,previous,next,i <= 10 ? WHIP_LASH.thick : WHIP_LASH.body);
    if (length > 0) {
      if (traveled <= 2.8 && traveled + length >= 2.8) {
        const mix = (2.8 - traveled) / length;
        gripEnd = {x:previous.x + dx * mix,y:previous.y + dy * mix};
      }
      while (braidAt <= traveled + length && i <= 12) {
        const mix = (braidAt - traveled) / length;
        const x = previous.x + dx * mix;
        const y = previous.y + dy * mix;
        c.fillStyle = WHIP_LASH.braid;
        c.fillRect(Math.round(x-.5), Math.round(y-.5), 1, 1);
        braidAt += 3.25;
      }
    }
    traveled += length;
    previous = next;
  }
  pixelLine(c,hand,gripEnd,'#4e3433',3);
  pixelLine(c,{x:(hand.x+gripEnd.x)/2,y:(hand.y+gripEnd.y)/2},gripEnd,WHIP_LASH.binding);
}
