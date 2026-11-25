import {drawStarterChest} from './starter-chest.mjs';
import {drawDesignedRoom} from './location-designs.mjs';
import {drawInteriorFace,drawInteriorCutawayEdge,paintInteriorMaterial} from './interior-materials.mjs';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
let backdrop=null;
function paintBackdrop(c){
 rect(c,0,0,320,240,'#141824');
 const trim=['#323b35','#667466','#a0a392'];
 paintInteriorMaterial(c,{x:15,y:35,w:290,h:187},'metal',
   ['#373d36','#49534a','#4d5a51','#556358','#a5a590','#3f4a41']);
 drawInteriorFace(c,{x:15,y:44,w:290,height:29,material:'masonry',
   palette:['#3b4a41','#536359','#63736a','#7b897b','#9ba597','#4e6054'],trim});
 for(const x of [18,88,232,298]){
   rect(c,x,18,4,27,trim[0]);rect(c,x+1,19,1,22,trim[2]);rect(c,x-1,39,6,5,trim[1]);
 }
 drawInteriorCutawayEdge(c,{x:15,y:44,w:6,h:178},{side:'west',trim});
 drawInteriorCutawayEdge(c,{x:299,y:44,w:6,h:178},{side:'east',trim});
 drawInteriorCutawayEdge(c,{x:15,y:219,w:112,h:7},{trim});
 drawInteriorCutawayEdge(c,{x:193,y:219,w:112,h:7},{trim});
 for(const x of [31,270]){
   rect(c,x,48,15,2,'#818577');rect(c,x,51,11,1,'#a29d81');
 }
 rect(c,285,95,17,64,'#272c27');for(const y of [98,125,152])rect(c,284,y,18,3,'#858572');rect(c,289,109,5,15,'#b6a46b');rect(c,296,115,4,9,'#55736b');
 rect(c,27,99,3,57,'#796846');rect(c,23,148,11,12,'#bbb29a');rect(c,31,153,16,17,'#5c756b');rect(c,32,149,14,2,'#a6aaa0');rect(c,32,149,2,9,'#a6aaa0');rect(c,44,149,2,9,'#a6aaa0');
 rect(c,116,161,10,15,'#363d35');rect(c,117,162,8,2,'#7b9180');rect(c,117,157,8,1,'#b0b09b');rect(c,117,157,1,8,'#b0b09b');rect(c,124,157,1,8,'#b0b09b');rect(c,122,143,2,21,'#8d7954');rect(c,119,145,8,3,'#b6ac8d');
}
export function drawStorageBackdrop(c,design=undefined){
 if(drawDesignedRoom(c,'storage',design))return;
 if(!backdrop&&globalThis.document){backdrop=document.createElement('canvas');backdrop.width=320;backdrop.height=240;paintBackdrop(backdrop.getContext('2d'));}
 if(backdrop)c.drawImage(backdrop,0,0);else paintBackdrop(c);
}
// Localised tube dips, not high-contrast full-screen flashes. The reflected
// light changes only a few percent; ordinary room illumination stays steady.
export function storageLightLevel(time,seed=0){const t=(Math.max(0,time)+seed*.71)%8.7;return .96+Math.sin(time*1.8+seed)*.025-(t<.07?.48:t>.19&&t<.25?.29:0);}
export function drawStorageLight(c,time,seed=0){
 const level=storageLightLevel(time,seed);rect(c,121,25,78,11,'#242e2b');rect(c,123,26,74,9,'#393d35');rect(c,125,27,70,6,'#777f71');
 c.save();c.globalAlpha*=level;rect(c,128,28,64,3,'#e3e6c3');rect(c,130,28,60,1,'#f0f1d6');c.restore();
 for(const x of [124,193]){rect(c,x,28,3,4,'#a9ad99');rect(c,x+1,28,1,1,'#d0d2b9');}
 c.save();c.globalAlpha*=.03+.035*level;
 for(let i=0;i<10;i++)rect(c,130-i*7,39+i*15,60+i*14,15,'#d7ddb2');c.restore();return level;
}
export const STORAGE_DUST_LIMIT=32;
export function drawStorageDust(c,time,seed=0){
 const wrap=(v,n)=>(v%n+n)%n;c.save();const alpha=c.globalAlpha;
 for(let i=0;i<STORAGE_DUST_LIMIT;i++){
  const x=24+wrap(i*71.13+seed*13+time*(1.2+i%4*.3)+Math.sin(time*.32+i)*3,272),y=45+wrap(i*41.37+seed*7-time*(.6+i%3*.2),167);
  const beam=Math.max(0,1-Math.abs(x-160)/(35+(y-35)*.5)),pulse=.6+.4*Math.sin(time*.65+i)**2;
  c.globalAlpha=alpha*(.065+beam*.24)*pulse;rect(c,x,y,i%11===0?2:1,1,beam>.45?'#e5e4c2':'#b0b89a');
 }c.restore();return STORAGE_DUST_LIMIT;
}
// Reuse the current expedition chest at a compact room scale.
export function drawStorageChest(c,x,y,index=0,open=false,near=false){
 c.save();c.translate(Math.round(x),Math.round(y)-6);c.scale(.27,.27);
 drawStarterChest(c,{x:0,y:0},open?1:0);c.restore();
 if(near){c.save();c.globalAlpha*=.65;c.fillStyle='#edcf86';c.fillRect(Math.round(x)-2,Math.round(y)-12,4,1);c.restore();}
}
