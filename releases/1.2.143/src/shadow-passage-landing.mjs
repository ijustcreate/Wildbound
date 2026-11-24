import {realmTerrainAt} from './realm-world.mjs';
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const offsets=[[0,56],[-32,56],[32,56],[-58,38],[58,38],[0,88]];
export function passageLanding(g,near=null,salt=0){
 const valid=(x,y)=>{
  if(g.mapMode!=='boundless'&&(x<80||x>1520||y<80||y>1520))return false;
  const tx=Math.floor(x/32),ty=Math.floor(y/32),tile=realmTerrainAt(g,tx,ty);
  if(!near&&(g.portals||[]).some(d=>Math.hypot(d.x-x,d.y-y)<80))return false;
  return ['grass','path','shadow_soil','cave_floor','marsh_grass'].includes(tile)&&!g.blocked(x,y,14,false,false,false,0);
 };
 const party=(x,y)=>offsets.slice(0,g.players.length).map(([dx,dy])=>({x:x+dx,y:y+dy}));
 const suitable=(x,y)=>valid(x,y)&&party(x,y).every(p=>valid(p.x,p.y))&&Math.hypot(x-800,y-816)>300;
 if(near&&valid(near.x,near.y)&&party(near.x,near.y).every(p=>valid(p.x,p.y)))return {x:near.x,y:near.y,party:party(near.x,near.y)};
 for(let i=0;i<1500;i++){
  const x=near?near.x+Math.cos(i*2.39996)*(24+Math.floor(i/12)*12):150+hash(g.seed+salt+i,41)*1300;
  const y=near?near.y+Math.sin(i*2.39996)*(24+Math.floor(i/12)*12):150+hash(i+salt,g.seed+71)*1250;
  if(suitable(x,y))return {x,y,party:party(x,y)};
 }
 // A crowded authored scene may only have small separate safe spaces.
 const points=[];for(let y=96;y<1504;y+=24)for(let x=96;x<1504;x+=24)if(valid(x,y)&&points.every(p=>Math.hypot(p.x-x,p.y-y)>=24)){points.push({x,y});if(points.length>=g.players.length+1)return {x:points[0].x,y:points[0].y,party:points.slice(1)};}
 return null;
}
