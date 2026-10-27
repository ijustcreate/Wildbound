// One enemy owns all of these floor-space samples. No segment is a game actor.
export const ANACONDA_SEGMENTS = 40;
export const ANACONDA_SPACING = 10;
export const ANACONDA_TRAIL_LIMIT = 160;
export const ANACONDA_RADIUS = 12;
export const ANACONDA_CLEARANCE = 14;
const SAMPLE = 3, valid = new WeakSet();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pointOK = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);

function resample(body) {
  const trail = body.trail;
  let cursor = 0, walked = 0,left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for (let i = 0; i < ANACONDA_SEGMENTS; i++) {
    const wanted = i * ANACONDA_SPACING;
    while (cursor < trail.length - 2) {
      const length = Math.hypot(trail[cursor+1].x-trail[cursor].x, trail[cursor+1].y-trail[cursor].y);
      if (walked + length >= wanted) break;
      walked += length; cursor++;
    }
    const a = trail[cursor], b = trail[Math.min(cursor+1, trail.length-1)];
    const length = Math.hypot(b.x-a.x,b.y-a.y), t = clamp((wanted-walked)/(length||1),0,1);
    const p = body.segments[i] ||= {};
    p.x = a.x+(b.x-a.x)*t; p.y = a.y+(b.y-a.y)*t;
    p.radius = i === 0 ? 16 : ANACONDA_RADIUS * Math.min(1, (ANACONDA_SEGMENTS-i)/9);
    left=Math.min(left,p.x-p.radius);right=Math.max(right,p.x+p.radius);top=Math.min(top,p.y-p.radius);bottom=Math.max(bottom,p.y+p.radius);
  }
  body.segments.length = ANACONDA_SEGMENTS;
  body.bounds={left,right,top,bottom};
}

export function initializeAnaconda(e, game = null) {
  const angle = Math.atan2(e.faceY || 0, e.faceX || 1) + Math.PI;
  const body = {version:1, trail:[{x:e.x,y:e.y}], segments:[], distance:0};
  let direction = angle;
  // Seed a curved, collision-aware tail, rather than stretching it through trees.
  for (let i=1; i<ANACONDA_TRAIL_LIMIT; i++) {
    const last=body.trail.at(-1), desired=direction+Math.sin(i*.085+(e.id||0))*.035;
    let next=null;
    for (const turn of [0,.28,-.28,.6,-.6,1,-1,1.6,-1.6,Math.PI]) {
      const a=desired+turn, x=last.x+Math.cos(a)*SAMPLE, y=last.y+Math.sin(a)*SAMPLE;
      if(x<24||x>1576||y<24||y>1576||game?.blocked(x,y,ANACONDA_RADIUS,false,false,false,0,0,false,e))continue;
      next={x,y};direction=a;break;
    }
    body.trail.push(next||{...last});
  }
  e.anacondaBody=body;resample(body);valid.add(body);return body;
}

export function anacondaBody(e, game = null) {
  const body=e.anacondaBody;
  if(valid.has(body))return body;
  if(body?.version!==1||!Array.isArray(body.trail)||body.trail.length<2)return initializeAnaconda(e,game);
  body.trail=body.trail.slice(0,ANACONDA_TRAIL_LIMIT);
  if(!body.trail.every(p=>pointOK(p)&&p.x>=0&&p.x<=1600&&p.y>=0&&p.y<=1600)||Math.hypot(body.trail[0].x-e.x,body.trail[0].y-e.y)>120)return initializeAnaconda(e,game);
  body.segments=[];body.distance=Number.isFinite(body.distance)?body.distance:0;
  resample(body);valid.add(body);return body;
}

export function updateAnacondaBody(game,e) {
  const body=anacondaBody(e,game), old=body.trail[0], dx=e.x-old.x, dy=e.y-old.y, distance=Math.hypot(dx,dy);
  if(!distance)return body;
  if(distance>120)return initializeAnaconda(e,game); // Catch-up teleports must not draw a map-wide tail.
  const steps=Math.ceil(distance/SAMPLE);
  for(let i=1;i<=steps;i++){
    const p={x:old.x+dx*i/steps,y:old.y+dy*i/steps}, anchor=body.trail[1];
    if(Math.hypot(p.x-anchor.x,p.y-anchor.y)>=SAMPLE)body.trail.unshift(p);
    else body.trail[0]=p;
  }
  body.trail.length=Math.min(body.trail.length,ANACONDA_TRAIL_LIMIT);
  body.distance+=distance;resample(body);return body;
}

export function anacondaContact(e,point,radius=0) {
  const segments=anacondaBody(e).segments;
  let nearest=null;
  for(let i=0;i<segments.length-1;i++){
    const a=segments[i],b=segments[i+1],dx=b.x-a.x,dy=b.y-a.y;
    const t=clamp(((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);
    const x=a.x+dx*t,y=a.y+dy*t,r=a.radius+(b.radius-a.radius)*t,d=Math.hypot(point.x-x,point.y-y);
    const penetration=r+radius-d;
    if(!nearest||penetration>nearest.penetration)nearest={x,y,radius:r,index:i,distance:d,penetration};
  }
  return nearest;
}

export function anacondaBlocks(game,x,y,radius,elevation,from) {
  if(!from||from.room||!game.players.includes(from)||elevation>=ANACONDA_CLEARANCE)return false;
  for(const e of game.enemies){
    if(e.kind!=='anaconda'||e.hp<=0||e.faction==='ally'||e.faction==='neutral')continue;
    const bounds=anacondaBody(e).bounds;
    if(x+radius<bounds.left||x-radius>bounds.right||y+radius<bounds.top||y-radius>bounds.bottom)continue;
    const next=anacondaContact(e,{x,y},radius);
    if(next.penetration<=0)continue;
    // A body moving beneath somebody must let them walk out of its footprint.
    const before=anacondaContact(e,from,radius);
    if(before.penetration>0&&next.penetration<before.penetration-1e-6)continue;
    return true;
  }
  return false;
}

// Near-side line of sight deliberately ends at the struck section, not the head.
// Parent can use this in existing spell/arrow .find predicates without proxies.
export function anacondaProjectileHit(game,e,projectile,radius=3,height=0) {
  if(e.kind!=='anaconda'||e.hp<=0||height>=38)return false;
  const hit=anacondaContact(e,projectile,radius);
  if(hit.penetration<0||hit.index>0&&height>=ANACONDA_CLEARANCE)return false;
  const d=hit.distance||1, surface={x:hit.x+(projectile.x-hit.x)/d*hit.radius,y:hit.y+(projectile.y-hit.y)/d*hit.radius};
  const dx=surface.x-projectile.x,dy=surface.y-projectile.y,n=Math.ceil(Math.hypot(dx,dy)/3)||1;
  for(let i=1;i<=n;i++)if(game.projectileBlocked(projectile.x+dx*i/n,projectile.y+dy*i/n,.5))return false;
  return true;
}

export function* anacondaMeleeSections(e) {
  const points=anacondaBody(e).segments;
  for(let i=0;i<points.length;i++){
    yield points[i];
    if(i)yield {x:(points[i-1].x+points[i].x)/2,y:(points[i-1].y+points[i].y)/2,radius:(points[i-1].radius+points[i].radius)/2};
  }
}

export function anacondaBounds(e) {
  const bounds=anacondaBody(e).bounds;
  return {left:bounds.left-8,right:bounds.right+8,top:bounds.top-28,bottom:bounds.bottom+8};
}
