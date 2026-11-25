import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';
import {trainWorld} from './train-track.mjs';

export function drawTrainGangway(ctx,a,b){
 const at=(c,x,y,z)=>{const p=trainWorld(c,x,y,z);return {x:Math.round(p.x),y:Math.round(p.y-p.z)};};
 const p=[at(a,a.length/2-4,-12,20),at(b,-b.length/2+4,-12,20),at(b,-b.length/2+4,12,20),at(a,a.length/2-4,12,20)];
 const mix=(a,b,t)=>({x:Math.round(a.x+(b.x-a.x)*t),y:Math.round(a.y+(b.y-a.y)*t)});
 // A shallow steel bridge with hinged tread plates, staying at the existing
 // walking height. No new rails or collision volumes block a jump off.
 for(let i=0;i<4;i++){const j=(i+1)%4;pixelPolygon(ctx,[p[i],p[j],{x:p[j].x,y:p[j].y+5},{x:p[i].x,y:p[i].y+5}],'#35474b');}
 pixelPolygon(ctx,p,'#68766f');
 const span=Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y),steps=Math.max(2,Math.ceil(span/6));
 for(let i=0;i<=steps;i++)pixelLine(ctx,mix(p[0],p[1],i/steps),mix(p[3],p[2],i/steps),i===0||i===steps?'#9ca18a':'#495c5d',1);
 pixelLine(ctx,p[0],p[1],'#9d9b7c',1);pixelLine(ctx,p[3],p[2],'#9d9b7c',1);
}
