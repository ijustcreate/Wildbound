import {trainEngineProfile} from './train-construction.mjs';
import {addPixelShadowPolygon} from './pixel-shadow.mjs';

function hull(points){
 const p=points.slice().sort((a,b)=>a.x-b.x||a.y-b.y),cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),lower=[],upper=[];
 for(const q of p){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),q)<=0)lower.pop();lower.push(q);}
 for(const q of p.slice().reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),q)<=0)upper.pop();upper.push(q);}return lower.slice(0,-1).concat(upper.slice(0,-1));
}
export function trainShadowPolygons(c){
 if(c.sink>=1)return [];
 const L=c.length,W=c.width,parts=[{x:0,y:0,w:L-6,h:W-8,z:16}];
 if(c.kind==='engine'){
  const e=trainEngineProfile(c);parts.push({x:-L*.29,y:0,w:L*.43,h:W+4,z:76},{x:L*.2,y:0,w:L*.46,h:e.radius*2,z:e.top},{x:L*.39,y:0,w:24,h:26,z:e.stackTop});
 }else if(c.kind==='tender')parts.push({x:0,y:0,w:Math.max(30,L-48),h:Math.max(28,W-48),z:51});
 else {parts.push({x:0,y:0,w:L-3,h:W+8,z:76});if(c.kind==='caboose')parts.push({x:0,y:0,w:70,h:W*.74,z:108});}
 const ca=Math.cos(c.a),sa=Math.sin(c.a),project=(x,y,z)=>({x:Math.round(c.x+ca*x-sa*y+z*.48),y:Math.round(c.y+sa*x+ca*y+z*.32)});
 return parts.map(o=>{const points=[];for(const x of[o.x-o.w/2,o.x+o.w/2])for(const y of[o.y-o.h/2,o.y+o.h/2])for(const z of[0,o.z+(c.z||0)])points.push(project(x,y,z));return hull(points);});
}
export function drawTrainShadows(ctx,cars,bounds){
 const active=cars.filter(c=>!(c.sink>=1));if(!active.length)return;
 ctx.save();ctx.globalAlpha*=Math.max(0,1-Math.max(...active.map(c=>c.sink||0)));
 ctx.beginPath();
 for(const c of active)for(const poly of trainShadowPolygons(c))addPixelShadowPolygon(ctx,poly.map(p=>[p.x,p.y]),2,bounds);
 // One union fill: adjacent roof/boiler shadows do not stack darker patches.
 ctx.fillStyle='#10282148';ctx.fill();ctx.restore();
}
