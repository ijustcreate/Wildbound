import source from './slime-data.mjs';
import { poseAt, projectPoint, facingIndex } from './player-motion.mjs';
import { pixelPolygon, pixelLine } from './pixel-shapes.mjs';
import { paintLayers } from './render-order.mjs';
import { validateSprite } from './pixels.mjs';

export const SLIME_BIOMES = Object.freeze(['forest','desert','ice','temple','beach','graveyard','house']);
const palettes = {
  forest: { body:'#72b936', shade:'#2b7139', light:'#aee64a', highlight:'#e8f995', outline:'#193e2e', eyes:'#fff2a1', mouth:'#235036', accent:'#d1ee68' },
  desert: { body:'#dc8a32', shade:'#985033', light:'#f2c54c', highlight:'#fff0a0', outline:'#593d2b', eyes:'#fff0a4', mouth:'#693d2c', accent:'#ffe08a' },
  ice: { body:'#398dc2', shade:'#274c89', light:'#70d9e7', highlight:'#d9ffff', outline:'#1c355d', eyes:'#f4ffdb', mouth:'#294875', accent:'#c2f7ff' },
  temple: { body:'#3b9b67', shade:'#285849', light:'#91d16a', highlight:'#ffe274', outline:'#244137', eyes:'#fff09a', mouth:'#21463b', accent:'#e0c751' },
  beach: { body:'#27aeb0', shade:'#286e78', light:'#75e0cf', highlight:'#d2fff0', outline:'#204858', eyes:'#fff2aa', mouth:'#24515c', accent:'#f2b978' },
  graveyard: { body:'#7354a0', shade:'#3d376e', light:'#a79bdb', highlight:'#d8f6a0', outline:'#292c51', eyes:'#eaffae', mouth:'#253a50', accent:'#8ee27a' },
  house: { body:'#a8587b', shade:'#623d67', light:'#e28ba6', highlight:'#ffe6a2', outline:'#46334b', eyes:'#fff0b4', mouth:'#4e3457', accent:'#9bd36c' },
};
export const SLIME_PALETTES = palettes;

export const defaultSlimeMotion = () => structuredClone(source);
export const slimeMotion = defaultSlimeMotion();
export let slimeRevision = 0;
export function validateSlimeMotion(m) {
  if (!m || m.type !== 'slime' || !m.joints || !m.clips || !m.clips.idle || !m.clips.run || !m.clips.attack || !m.clips.death) return false;
  for (const [name, base] of Object.entries(source.joints)) {
    if (!Array.isArray(m.joints[name]?.position) || m.joints[name].position.length !== 3 || !m.joints[name].position.every(Number.isFinite)) return false;
    for (const clip of Object.values(m.clips)) for (const key of clip.keys || [])
      if (key.joints?.[name] && (!Array.isArray(key.joints[name]) || key.joints[name].length !== 3 || !key.joints[name].every(Number.isFinite))) return false;
  }
  return Object.values(m.clips).every(c => Number.isFinite(c.fps) && c.fps > 0 && c.keys?.length >= 2);
}
export function replaceSlimeMotion(model) {
  if (!validateSlimeMotion(model)) throw Error('Invalid slime animation rig');
  const next = structuredClone(model);
  for (const key of Object.keys(slimeMotion)) delete slimeMotion[key];
  Object.assign(slimeMotion, next);
  slimeRevision++;
}
export const loadSlimeArt = () => Promise.resolve(true);
export const slimeArtStatus = () => ({ loaded:true, failed:false });

export function slimeAction(actor) {
  if (actor.hp <= 0) return 'death';
  if (actor.animationAction) return actor.animationAction;
  if (actor.flash > 0 || actor.hit > 0) return 'hurt';
  if (actor.state === 'windup' || actor.state === 'attack' || actor.attack > 0) return actor.attackVariant ? 'attack_alt' : 'attack';
  if (actor.moving) return actor.walking ? 'walk' : 'run';
  return 'idle';
}
export function slimeFrame(actor, time, model = slimeMotion) {
  const action = slimeAction(actor), clip = model.clips[action] || model.clips.idle;
  if (Number.isFinite(actor.playerFrame)) return actor.playerFrame;
  if (action === 'death') return Math.min(1, (actor.deathTime || actor.deathTimer || 0) / 1.8) * (clip.length - 1);
  if (Number.isFinite(actor.poseTime)) return Math.max(0, Math.min(1, actor.poseTime)) * (clip.length - 1);
  return actor.moving ? ((actor.step || 0) / 13) * (clip.length - 1) : time * clip.fps;
}

function ring(center, radius, height, d, count=24) {
  return Array.from({length:count},(_,i)=>{
    const a=(i/count)*Math.PI*2, r=Math.cos(a)*radius;
    return projectPoint([center[0]+r,center[1]+Math.sin(a)*radius*.78,center[2]+height],d);
  });
}
function translated(p, dx,dy,dz=0) { return [p[0]+dx,p[1]+dy,p[2]+dz]; }
function drawSparkle(c,x,y,color,size=2) {
  c.fillStyle=color;
  c.fillRect(Math.round(x),Math.round(y),size,size);
  if(size>2)c.fillRect(Math.round(x+size),Math.round(y+1),1,Math.max(1,size-2));
}
export function drawSlime(c, actor, time, model=slimeMotion, suppliedPose=null) {
  const action=slimeAction(actor), d=facingIndex(actor.faceX,actor.faceY), pose=suppliedPose||poseAt(model,action,slimeFrame(actor,time,model));
  const p=Object.fromEntries(Object.entries(pose).map(([name,v])=>[name,projectPoint(v,d)]));
  const biome=SLIME_BIOMES.includes(actor.slimeBiome)?actor.slimeBiome:'forest';
  const pal={...palettes[biome]};
  if(biome==='forest')for(const name of Object.keys(pal))if(model.palette?.[name])pal[name]=model.palette[name];
  const size=model.shape?.width||21, height=(model.shape?.height||40)*(actor.hp<=0 ? .15 : 1);
  const core=pose.core, top=pose.crest, q=[];
  const add=(id,bones,depth,fn)=>q.push({id,bones,depth,fn});
  const silhouette=()=>pixelPolygon(c,ring(core,size,height*.14,d),pal.outline);
  const shadow=()=>pixelPolygon(c,ring(core,size*.88,height*.18,d),pal.shade);
  const body=()=>pixelPolygon(c,ring(core,size*.75,height*.29,d),pal.body);
  const dome=()=>pixelPolygon(c,ring(core,size*.59,height*.39,d),pal.light);
  const crown=()=>{
    // Keep the upper lobe embedded in the dome; donor crest travel only adds a bounded wobble.
    const wobble=v=>Math.max(-size*.12,Math.min(size*.12,v*.1));
    const center=[core[0]+wobble(top[0]-core[0]),core[1]+wobble(top[1]-core[1]),core[2]];
    pixelPolygon(c,ring(center,size*.39,height*.43,d),pal.body);
    const a=projectPoint(translated(center,-size*.25,0,height*.47),d);
    drawSparkle(c,a.x,a.y,pal.highlight,3);
  };
  add('Slime body',['core','rimL','rimR'],p.core.depth-1,silhouette);
  add('Slime shadow band',['core','rimL','rimR'],p.core.depth,shadow);
  add('Slime gel body',['core','crest'],p.core.depth+1,body);
  add('Slime light band',['crest'],p.crest.depth+2,dome);
  add('Slime crown highlight',['crest'],p.crest.depth+5,crown);
  const eyes=()=>{
    for(const name of ['eyeL','eyeR']){
      if(model.visibility?.[name]?.[d]===false)continue;
      const sourceEye=pose[name], eyeLocal=core.map((v,i)=>v+(sourceEye[i]-v)*(i===0?.5:i===1?.6:.72)), eye=projectPoint(eyeLocal,d), side=name==='eyeL'?-1:1, x=Math.round(eye.x),y=Math.round(eye.y);
      // Each eye is a separate editable pixel patch on the wobbling face.
      // Stair-stepped oval sockets keep the face soft and gelatinous rather than goggled.
      c.fillStyle=pal.outline;
      c.fillRect(x-2,y-7,4,1);c.fillRect(x-3,y-6,6,2);c.fillRect(x-4,y-4,8,7);
      c.fillRect(x-3,y+3,6,2);c.fillRect(x-2,y+5,4,1);
      c.fillStyle=pal.eyes;c.fillRect(x-2,y-4,4,7);c.fillRect(x-1,y-5,2,1);
      c.fillStyle=pal.mouth;c.fillRect(x+(actor.gazeX||0)*side,y-1,2,4);
      c.fillStyle=pal.highlight;c.fillRect(x-1,y-3,1,2);
    }
  };
  add('Slime eyes',['eyeL','eyeR'],p.eyeL.depth+10,eyes);
  const detail=()=>{
    const mark=(x,y,color,w=2,h=2)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
    const front=projectPoint(translated(core,0,size*.3,height*.45),d), side=projectPoint(translated(core,-size*.35,-size*.18,height*.28),d),variation=(actor.slimeVariant||0)*2;
    switch(actor.slimeBiome){
      case 'forest': mark(side.x+variation,side.y,pal.accent,3,2);mark(front.x+5,front.y+3,pal.shade,2,2);break;
      case 'desert': mark(front.x+variation,front.y,pal.highlight,3,2);mark(side.x+3,side.y+3,pal.accent,2,2);break;
      case 'ice': drawSparkle(c,front.x+variation,front.y,pal.highlight,3);mark(side.x+4,side.y+2,'#d8ffff',2,2);break;
      case 'temple': mark(front.x+variation,front.y,pal.accent,2,5);mark(front.x-1,front.y+2,pal.accent,4,1);break;
      case 'beach': mark(side.x+variation,side.y,pal.accent,4,2);mark(front.x+4,front.y+2,'#f0b880',2,2);break;
      case 'graveyard': mark(front.x+variation,front.y,pal.accent,2,3);drawSparkle(c,side.x+3,side.y,pal.highlight,2);break;
      case 'house': mark(front.x+variation,front.y,pal.accent,3,2);mark(side.x+4,side.y+2,pal.highlight,2,2);break;
    }
    if(['run','walk','attack','attack_alt'].includes(action)){
      const drip=projectPoint(translated(core,(top[0]-core[0])*.55,(top[1]-core[1])*.55,-height*.02),d);
      mark(drip.x,drip.y,pal.light,2,2);
    }
  };
  add('Location marks and slime droplets',['core','crest','gelL','gelR'],p.core.depth+12,detail);
  paintLayers(q,model,d,c,p);
  return p;
}
