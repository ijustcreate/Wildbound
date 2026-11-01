import {forestGroundTone} from './forest-art.mjs';
import {drawWaterSurface} from './water-surface.mjs';
import {wildHash,wildLandsGround,wildLandsSurface,WILD_LANDS_STOPS,WILD_LANDS_GATES} from './wild-lands-world.mjs';
import {nearestTrainTrack} from './train-track.mjs';
const COLORS={forest:['#4a663c','#4b673d','#4c683e'],jungle:['#3d6339','#3e643a','#3f653b'],ice:['#bccfd0','#c4d6d5','#b3c9cd'],graveyard:['#354b43','#394e47','#3d5148'],house:['#526f40','#587645','#5e7947'],beach:['#b9a57b','#c5b188','#cdb992'],swamp:['#465c42','#4c6145','#40573e'],caverns:['#35434c','#3c4a53','#414e56'],shadow:['#343547','#393a50','#3e3c54'],water:['#235765','#265e6c','#2b6470'],shallow:['#59918e','#629e98','#6ba49b']};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
const nativePlan={seed:42,routes:[],landmarks:[],routeField:new Float32Array(10000).fill(200),paving:{cells:Array(576).fill(0)}};
function floorColor(d,x,y){const water=wildLandsSurface(d,x,y),kind=water==='grass'?wildLandsGround(d,x,y):water;return ['forest','jungle','house'].includes(kind)?forestGroundTone(nativePlan,x,y):COLORS[kind][Math.floor(wildHash(x/32,y/32)*3)];}
export function drawWildLandsFloor(c,t,bounds,overview=false,g=null){
 const d=t.design,step=overview?96:32;
 // Small cached native-resolution tile chunks; never rasterize the entire world at play scale.
 if(overview){for(let y=0;y<d.height;y+=step)for(let x=0;x<d.width;x+=step)rect(c,x,y,step,step,floorColor(d,x+step/2,y+step/2));
   for(let y=200;y<d.height;y+=140)for(let x=200;x<d.width;x+=140){const biome=wildLandsGround(d,x,y);if(wildLandsSurface(d,x,y)!=='grass'||wildHash(x,y)>.25||['beach','ice','house'].includes(biome))continue;rect(c,x,y,46,50,biome==='graveyard'?'#273b35':'#234b32');rect(c,x+6,y-10,34,40,'#37643a');}return;}

 const far=(t.viewZoom||1)<.3,chunkSize=far?2048:512,tile=far?128:8,scale=chunkSize/256;
 t.wildFloorChunks??=new Map();
 for(let cy=Math.max(0,Math.floor(bounds.top/chunkSize));cy<=Math.min(Math.ceil(d.height/chunkSize)-1,Math.floor(bounds.bottom/chunkSize));cy++)for(let cx=Math.max(0,Math.floor(bounds.left/chunkSize));cx<=Math.min(Math.ceil(d.width/chunkSize)-1,Math.floor(bounds.right/chunkSize));cx++){
  const key=[d.activeRoom||'surface',chunkSize,cx,cy].join(':');let canvas=t.wildFloorChunks.get(key);
  if(!canvas){canvas=document.createElement('canvas');canvas.width=canvas.height=256;const pen=canvas.getContext('2d');
   for(let y=0;y<chunkSize;y+=tile)for(let x=0;x<chunkSize;x+=tile){const wx=cx*chunkSize+x,wy=cy*chunkSize+y,color=floorColor(d,wx+tile/2,wy+tile/2);rect(pen,x/scale,y/scale,tile/scale,tile/scale,color);const n=wildHash(wx,wy);pen.globalAlpha=.18;for(let i=0;i<(far?2:1);i++)rect(pen,x/scale+Math.floor(wildHash(wx+i,wy)*Math.max(1,tile/scale-2)),y/scale+Math.floor(wildHash(wx,wy+i)*Math.max(1,tile/scale-2)),2,1,n>.5?'#ced29e':'#152d31');pen.globalAlpha=1;}
   if(t.wildFloorChunks.size>=80)t.wildFloorChunks.delete(t.wildFloorChunks.keys().next().value);t.wildFloorChunks.set(key,canvas);
  }
  c.imageSmoothingEnabled=false;c.drawImage(canvas,cx*chunkSize,cy*chunkSize,chunkSize,chunkSize);
 }
 if(g&&!far&&!d.activeRoom)for(let y=Math.floor(bounds.top/32)*32;y<bounds.bottom;y+=32)for(let x=Math.floor(bounds.left/32)*32;x<bounds.right;x+=32)if(wildLandsSurface(d,x+16,y+16)!=='grass')drawWaterSurface(c,g,x,y,32,32);
}
export function wildLandsProps(t,bounds){
 if(t.design.activeRoom){t.visibleForest=[];return [];}
 t.wildPropChunks??=new Map();t.wildPropData??=new Map();const props=[];
 for(let cy=Math.max(0,Math.floor((bounds.top-180)/512));cy<=Math.min(18,Math.floor((bounds.bottom+180)/512));cy++)for(let cx=Math.max(0,Math.floor((bounds.left-180)/512));cx<=Math.min(31,Math.floor((bounds.right+180)/512));cx++){
  const key=cx+':'+cy;let chunk=t.wildPropData.get(key);if(!chunk){chunk=[];
   for(let i=0;i<12;i++){const x=cx*512+wildHash(cx*17+i,cy+11)*512,y=cy*512+wildHash(cx+21,cy*13+i)*512,biome=wildLandsGround(t.design,x,y),n=wildHash(cx*31+i,cy*27);
    if(wildLandsSurface(t.design,x,y)!=='grass'||WILD_LANDS_STOPS.some(s=>Math.hypot(s.x-x,s.y-y)<650)||WILD_LANDS_GATES.some(s=>Math.hypot(s.x-x,s.y-y)<220)||nearestTrainTrack(t.route,x,y).distance<160)continue;
    // Broad connected meadow corridors, bordered by deterministic groves.
    if(n>(biome==='jungle'?.7:biome==='forest'?.52:biome==='graveyard'?.45:.25)||Math.sin(x/600)*Math.cos(y/700)>.1)continue;
    const kind=biome==='ice'?'snow_tree':biome==='beach'?'palm':biome==='graveyard'?(n<.18?'gravestone':'leafless_tree'):biome==='jungle'&&n<.25?'palm':'tree';
    chunk.push({id:'wild-prop:'+key+':'+i,kind,x,y,rootY:y,size:kind==='gravestone'?44:90+n*55,seed:Math.floor(x+y),procedural:true,graveyard:biome==='graveyard',variant:i%4});
   }
   t.wildPropData.set(key,chunk);
  }
   if(!t.wildPropChunks.has(key)&&t.wildPropChunks.size>=128)t.wildPropChunks.delete(t.wildPropChunks.keys().next().value);t.wildPropChunks.set(key,chunk);
  props.push(...chunk);
 }
 t.visibleForest=props;return props;
}
export function drawWildLandsLandmarks(c,t,bounds){
 const d=t.design;if(d.activeRoom){
  for(let i=0;i<22;i++){const x=6600+wildHash(i,1)*2800,y=4000+wildHash(i,2)*1300;rect(c,x,y,20,38,d.activeRoom==='shadow'?'#665482':'#687b80');rect(c,x+4,y,4,25,'#9cbdba');}
  rect(c,7940,5550,120,100,'#cab996');c.fillStyle='#e9d9ac';c.font='16px system-ui';c.fillText('Interact to return',7930,5680);return;
 }
 // Native-scale modest homestead and jungle courtyard, surrounded by open terrain.
 for(const site of[{x:3300,y:2900,kind:'temple'},{x:8200,y:7050,kind:'house'}]){
  if(site.x<bounds.left-500||site.x>bounds.right+500||site.y<bounds.top-500||site.y>bounds.bottom+500)continue;
  if(site.kind==='temple'){rect(c,site.x-320,site.y-240,640,480,'#71806b');for(let y=-224;y<240;y+=32)for(let x=-304;x<320;x+=32)rect(c,site.x+x,site.y+y,29,29,'#7d8b73');for(const dx of[-290,290])for(const dy of[-220,220]){rect(c,site.x+dx-14,site.y+dy-90,28,90,'#9b9e83');rect(c,site.x+dx-20,site.y+dy-95,40,10,'#b5b393');}}
  else{rect(c,site.x-120,site.y-100,240,160,'#8c704e');for(let y=-96;y<50;y+=12)rect(c,site.x-118,site.y+y,236,2,'#b09266');rect(c,site.x-135,site.y-140,270,65,'#754a3e');for(let y=-138;y<-78;y+=8)rect(c,site.x-133,site.y+y,266,2,'#a77053');rect(c,site.x-20,site.y-5,40,65,'#35443b');for(const dx of[-75,75])rect(c,site.x+dx-18,site.y-45,36,35,'#90b6b1');}
 }
 for(const gate of WILD_LANDS_GATES){if(gate.x<bounds.left-200||gate.x>bounds.right+200||gate.y<bounds.top-200||gate.y>bounds.bottom+200)continue;
  rect(c,gate.x-75,gate.y-120,150,120,gate.id==='shadow'?'#52485e':'#666c63');rect(c,gate.x-46,gate.y-92,92,92,'#15252c');
  if(gate.id==='shadow'){c.strokeStyle='#b88cdb';c.lineWidth=6;c.beginPath();c.ellipse(gate.x,gate.y-49,32,44,0,0,Math.PI*2);c.stroke();}
  c.font='14px system-ui';c.fillStyle='#ead9b0';c.fillText('Interact · '+gate.name,gate.x-75,gate.y+30);
 }
}
export function drawWildLandsMap(c,t,x,y,w,h){
 t.wildMap??=(()=>{const canvas=document.createElement('canvas');canvas.width=320;canvas.height=192;const pen=canvas.getContext('2d');for(let py=0;py<192;py+=2)for(let px=0;px<320;px+=2)rect(pen,px,py,2,2,floorColor({...t.design,activeRoom:null},px*50+50,py*50+50));return canvas;})();
 c.drawImage(t.wildMap,x,y,w,h);
}
