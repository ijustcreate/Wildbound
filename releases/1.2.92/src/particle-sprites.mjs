export const SPRITE_NAMES=['spark','streak','smoke','flame','leaf','lightning','ring','rune','heart','ghost','splat','droplet','crescent','orb','burst','swirl'];
const sprites=new Map(),tints=new Map();let pending;
export function loadParticleSprites(){
 if(pending)return pending;if(typeof Image==='undefined')return Promise.resolve(false);
 pending=Promise.all(SPRITE_NAMES.map(async name=>{const image=new Image();image.src=new URL('../assets/particles/cartoon-v1/'+name+'.png',import.meta.url).href;try{await image.decode();sprites.set(name,image);return true;}catch{return false;}})).then(values=>values.every(Boolean));return pending;
}
export const particleSpriteStatus=()=>({loaded:sprites.size,total:SPRITE_NAMES.length,tinted:tints.size});
export function particleSprite(name,color){
 const base=sprites.get(name);if(!base){loadParticleSprites();return null;}
 const key=name+color;if(tints.has(key))return tints.get(key);
 // Hard cache ceiling: at most 128 small 96px textures (~4.5 MiB RGBA).
 const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const c=canvas.getContext('2d');c.drawImage(base,0,0,96,96);c.globalCompositeOperation='multiply';c.fillStyle=color;c.fillRect(0,0,96,96);c.globalCompositeOperation='destination-in';c.drawImage(base,0,0,96,96);c.globalCompositeOperation='source-over';
 if(tints.size>=128)tints.delete(tints.keys().next().value);tints.set(key,canvas);return canvas;
}
export function warmParticleSprites(effect){
 if(!effect.fx)return;for(const name of SPRITE_NAMES){particleSprite(name,effect.start);}
}
