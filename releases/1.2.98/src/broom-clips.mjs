import {BROOM_SEAT_DROP,BROOM_PITCH,BROOM_GRIP_FORWARD} from './broom-art.mjs';
import {applyIK} from './ik.mjs';
export function createBroomRideClip(model,legacy=false){const rest=Object.fromEntries(Object.entries(model.joints).map(([n,j])=>[n,j.position])),length=16;
 const clip={fps:12,length,loop:true,keys:Array.from({length},(_,frame)=>{const p=structuredClone(rest),bob=Math.sin(frame/length*Math.PI*2)*.55;
 for(const [n,v]of Object.entries(p)){v[2]+=-5+bob;if(/^(chest|head|shoulder)/.test(n)){v[1]+=n.startsWith('shoulder')?6:4;v[2]-=n.startsWith('shoulder')?2:1;}}
 for(const side of ['L','R']){const sign=side==='L'?-1:1,hip=p['hip'+side];p['knee'+side]=[sign*4,hip[1]+9,hip[2]-(legacy?3:2)];p['foot'+side]=[sign*4,hip[1]+(legacy?5:2),hip[2]-(legacy?11:7)];p['hand'+side]=[sign*2,p.pelvis[1]+BROOM_GRIP_FORWARD,p.pelvis[2]-BROOM_SEAT_DROP+BROOM_GRIP_FORWARD*(legacy?.12:BROOM_PITCH)];p['elbow'+side]=[sign*6,5,p.chest[2]-5];}
 for(const n of ['eyeL','eyeR','earL','earR','nose','mouth'])if(p[n])p[n]=rest[n].map((v,i)=>v+p.head[i]-rest.head[i]);applyIK(model,p);
 return {frame,joints:Object.fromEntries(Object.entries(p).map(([n,v])=>[n,v.map((x,i)=>x-rest[n][i])]))};})};return clip;}

export function addBroomRide(model){if(!['pelvis','chest','head','shoulderL','shoulderR','elbowL','elbowR','handL','handR','hipL','hipR','kneeL','kneeR','footL','footR'].every(n=>model?.joints?.[n]))return model;const existing=model.clips.broom_ride;if(existing&&JSON.stringify(existing)!==JSON.stringify(createBroomRideClip(model,true)))return model;model.clips.broom_ride=createBroomRideClip(model);return model;}
