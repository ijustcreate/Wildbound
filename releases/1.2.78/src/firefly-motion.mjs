import data from './marsh_firefly-donor-data.mjs';
import {poseAt,projectPoint,facingIndex,validateMotion} from './player-motion.mjs';
import {paintLayers} from './render-order.mjs';
export function defaultFireflyMotion(){
 const m={version:1,type:'marsh_firefly',name:'Marsh fireflies / drifting lights',...structuredClone(data),palette:{body:'#edce71',light:'#fff4c1',shade:'#b19d52',outline:'#75834c'},shape:{glowRadius:7,lightSize:1},visibility:Object.fromEntries(Object.keys(data.joints).map(n=>[n,Array(8).fill(true)]))};
 for(const clip of Object.values(m.clips))for(const key of clip.keys)for(const [i,name]of ['lightA','lightB','lightC'].entries()){const a=key.frame/(clip.length-1)*Math.PI*2+i*2.1;key.joints[name][0]+=Math.sin(a)*3;key.joints[name][1]+=Math.cos(a)*2;key.joints[name][2]+=Math.sin(a*2)*1.5;}
 m.provenance.authoredSecondaryMotion='Three independent looping mote orbits added to the exact reference emitter handles; warm native pixel glow.';return m;
}
export const fireflyMotion=defaultFireflyMotion();
export const validateFireflyMotion=m=>m?.type==='marsh_firefly'&&validateMotion(m,defaultFireflyMotion());
export function replaceFireflyMotion(m){if(!validateFireflyMotion(m))throw Error('Invalid firefly motion');Object.assign(fireflyMotion,structuredClone(m));}
const halos=new Map();
function glow(model){const key=model.palette.body+model.shape.glowRadius;let canvas=halos.get(key);if(canvas)return canvas;canvas=document.createElement('canvas');canvas.width=canvas.height=32;const c=canvas.getContext('2d'),r=model.shape.glowRadius,g=c.createRadialGradient(16,16,0,16,16,r);g.addColorStop(0,model.palette.body+'70');g.addColorStop(.3,model.palette.body+'2a');g.addColorStop(1,model.palette.body+'00');c.fillStyle=g;c.fillRect(0,0,32,32);if(halos.size>=16)halos.delete(halos.keys().next().value);halos.set(key,canvas);return canvas;}
export function drawFireflyRig(c,a,time=0,model=fireflyMotion,supplied=null){
 const d=facingIndex(a.faceX,a.faceY),clip=model.clips.fly,pose=supplied||poseAt(model,'fly',a.playerFrame??(time+(a.phase||0))*clip.fps),p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),q=[];
 for(const [i,name]of ['lightA','lightB','lightC'].entries())if(model.visibility[name]?.[d]!==false)q.push({id:'Firefly light '+(i+1),bone:name,bones:[name],depth:p[name].depth,fn:()=>{const point=p[name],pulse=.25+.75*(.5+.5*Math.sin(time*2.1+i*2+(a.phase||0)))**2;c.save();c.globalAlpha*=pulse;c.drawImage(glow(model),Math.round(point.x)-16,Math.round(point.y)-16);c.fillStyle=model.palette.body;c.fillRect(Math.round(point.x),Math.round(point.y),model.shape.lightSize,model.shape.lightSize);c.fillStyle=model.palette.light;c.fillRect(Math.round(point.x),Math.round(point.y),1,1);c.restore();}});
 paintLayers(q,model,d,c,p);return p;
}
