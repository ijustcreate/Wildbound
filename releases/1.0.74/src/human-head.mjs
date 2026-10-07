import { mixGearColor } from './gear-art.mjs';
import { shade, hairCoversEar } from './appearance.mjs';

const palettes = new Map();
export function skinPalette(base) {
  if (!palettes.has(base)) {
    if (palettes.size >= 128) palettes.clear();
    palettes.set(base, { base, ink: '#302b2b',
      shadow: mixGearColor(base, '#523637', .36),
      light: mixGearColor(base, '#fff1d0', .25),
      blush: mixGearColor(base, '#b56867', .28),
      brow: mixGearColor(base, '#42302e', .62),
      lip: mixGearColor(base, '#783f44', .48) });
  }
  return palettes.get(base);
}

// Two passes let hair cover the skull without burying the ear or profile nose.
export function drawHumanHead(c, points, direction, skin, look, visible, foreground = false, outline = '#302b2b') {
  const h = points.head, p = skinPalette(skin);
  const r = (x, y, w, height, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(h.x + x), Math.round(h.y + y), w, height);
  };
  const profile = direction === 2 || direction === 6;
  const back = direction >= 3 && direction <= 5;
  const turn = direction === 0 || direction === 4 ? 0 : direction < 4 ? -1 : 1;
  if (!foreground) {
    r(-3,-6,7,1,p.ink); r(-4,-5,9,1,p.ink);r(-5,-4,11,6,p.ink);
    r(-4,2,9,1,p.ink); r(-3,3,7,1,p.ink);r(profile?turn-1:back?-1:-2,4,profile||back?3:5,1,p.ink);
    r(-4,-4,9,6,p.shadow); r(-3,-5,7,1,p.base);
    r(-3,-4,6,6,p.base); r(-2,2,5,2,p.shadow);
    r(-3,-3,3,3,p.light); r(-2,2,3,1,p.base);
    r(3,0,1,2,p.shadow);r(-2,3,4,1,p.base);
    if (profile) r(turn < 0 ? 2 : -4,-2,2,5,p.shadow);
    return;
  }
  for (const name of ['earL', 'earR']) {
    if (!visible(name)) continue;
    const q = points[name];
    const side = name === 'earL' ? -1 : 1, angle = direction*Math.PI/4;
    const dx = q.x-h.x-side*4*Math.cos(angle), dy = q.y-h.y-side*2*Math.sin(angle);
    // The near ear crosses the silhouette as the head turns, not the face edge.
    const earX = ([side*5,3,1,-4,-side*5,4,-1,-3][direction]) + dx;
    if(look?.face==='elf'){
      const outward=earX<0?-1:earX>0?1:side;
      for(let n=0;n<4;n++){
        const x=earX+outward*n;
        r(x,dy-1-n,1,4-n,p.ink);
        r(x,dy-n,1,Math.max(1,3-n),n>1?p.light:p.base);
      }
      r(earX,dy,1,1,p.blush);
      continue;
    }
    const covered=hairCoversEar(look?.hair);
    if(covered&&back)continue;
    if(covered){
      // A tucked lock exposes only the ear's lower rim, never a skin block on hair.
      r(earX,dy+1,1,2,p.shadow);r(earX,dy+1,1,1,p.base);
    }else{
      r(earX-1,dy-1,2,3,p.shadow); r(earX-1,dy-1,2,2,p.base);
      r(earX-1,dy-1,1,1,p.light); r(earX,dy,1,1,p.blush);
    }
  }
  if (back) return;
  for (const name of ['eyeL', 'eyeR']) {
    if (!visible(name)) continue;
    const q = points[name];
    const x = Math.round(q.x-h.x), y = Math.round(q.y-h.y);
    if(look?.eyesClosed){r(x-1,y,2,1,p.shadow);continue;}
    r(x-1,y-2,2,1,p.brow);
    const pupil=profile?turn:turn?turn:0;
    r(x-1,y,3,2,'#fff3df');
    if(!profile)r(x+(pupil<0?0:-1),y+1,1,1,'#65736e');
    r(x+pupil,y,1,2,look?.eyeColor||outline);
    r(x-1,y-1,3,1,p.shadow);
    r(x-1,y+2,2,1,p.blush);
  }
  if (visible('nose')) {
    const q = points.nose;
    const x = Math.round(q.x-h.x);
    const y = Math.round(q.y-h.y) - (profile ? 0 : 1);
    if (profile) {
      r(x,y,1,2,p.base);
      r(x,y,1,1,p.light);r(x,y+2,1,1,p.blush);
      r(x+turn*2,y+1,1,1,p.base);
    } else {
      r(x,y,1,1,p.light);r(x,y+1,1,1,p.blush);
      r(x+1,y+1,1,1,p.shadow);
    }
  }
  if (visible('mouth')) {
    const x = Math.round(points.mouth.x-h.x) - (profile ? 0 : 1);
    const y = Math.min(3,Math.round(points.mouth.y-h.y + (profile ? .5 : 0)));
    r(x,y,profile?1:2,1,p.lip);
    if(!profile)r(x,y+1,2,1,p.light);
  }
  const cheek = profile ? turn*2 : turn ? -turn*2 : -3;
  if (look?.face === 'freckles') {
    r(cheek,1,1,1,p.blush);
    if (!profile) r(cheek+2,2,1,1,p.blush);
    if (!turn) r(3,1,1,1,p.blush);
  }
  if (look?.face === 'scar') {
    r(cheek,0,1,3,p.blush); r(cheek-1,1,1,1,p.light);
  }
  if (look?.face === 'beard') {
    const hair = look.hairColor || '#593923';
    r(profile ? -turn : -3,3,profile ? 3 : 7,2,shade(hair));
    r(-1,5,3,1,shade(hair));r(-2,3,2,1,hair);r(1,4,2,1,hair);
    if(!profile){r(-2,2,2,1,hair);r(1,2,2,1,hair);r(0,3,1,1,p.lip);}
  }
  if(look?.face==='stubble')for(const [x,y] of [[-3,2],[-2,3],[0,4],[2,3],[3,2]])r(x,y,1,1,p.brow);
  if(look?.face==='goatee'){const hair=look.hairColor||'#593923';r(-1,3,3,2,shade(hair));r(0,5,1,1,hair);if(!profile){r(-2,2,2,1,hair);r(1,2,2,1,hair);}}
  if(look?.face==='warpaint'){r(profile?turn*3:-4,1,profile?2:3,1,'#57798a');if(!profile)r(2,1,3,1,'#57798a');r(-1,-3,2,1,'#b56855');}
}
