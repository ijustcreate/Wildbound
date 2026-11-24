import {trainRiderWorld} from './train-track.mjs';
export function trainChatPlacement(g,cs,camera,w,h,actors=[],id='speaker'){
 const z=camera.zoom,screen=(x,y)=>({x:w/2+(x-camera.x)*z,y:h/2+(y-camera.y)*z}),avoid=[];
 const add=(a,feet,size)=>{const q=screen(a.x,feet),half=size*.21*z,height=size*z;avoid.push({x:q.x-half-3,y:q.y-height-3,w:half*2+6,h:height+7,weight:1},{x:q.x-half-3,y:q.y-height-3,w:half*2+6,h:height*.4,weight:2});};
 for(const p of g.players||[]){const lift=p.trainRide?20+trainRiderWorld(cs,p.trainRide).z:p.trainGround||0;add(p,p.y-lift-(p.jumpHeight||p.groundHeight||0),43);}
 for(const a of actors)add(a,a.y-(a.jumpHeight||a.groundHeight||0),a.id?.startsWith('train-student:')?52:43);
 for(const a of [...(g.enemies||[]),...(g.villageFollowers||[]),...(g.villagers||[])])add(a,a.y,43);
 const d=g.trainTest.design,mw=Math.min(100,w*.2),mh=mw*d.height/d.width;avoid.push({x:w-mw-13,y:60,w:mw+6,h:mh+6,weight:4});
 const previous=g.trainTest.chatPlacements?.[id];return {avoid,preferSide:true,previous,bottomInset:g.trainTest.noticeUntil>g.trainTest.time?56:6};
}
export function rememberTrainChat(g,id,b){g.trainTest.chatPlacements??={};g.trainTest.chatPlacements[id]={dx:b.x-b.anchorX,dy:b.y-b.anchorY,w:b.w,h:b.h,side:b.side,overlap:b.overlap};}
