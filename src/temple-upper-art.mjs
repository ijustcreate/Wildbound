import {activeLocationDesign} from './location-designs.mjs';
import {drawDungeonDecor} from './dungeon-decor.mjs';
import {drawTorchFlame} from './torch-flame.mjs';
import {drawDesignedRoom} from './location-designs.mjs';
import {drawInteriorFace,paintInteriorMaterial} from './interior-materials.mjs';
// Same jade/aged limestone/gold vocabulary as the lower temple. Room coordinates
// stay compatible with existing characters, ritual chest and tiger encounters.
export const UPPER_TORCHES=Object.freeze([{x:32,y:68},{x:288,y:68},{x:32,y:174},{x:288,y:174}]);
const floorPalette=['#4b5b49','#64765f','#718268','#849374','#a5ad88','#586851'];
let defaultFloor;
function paintFloor(c){
 c.fillStyle='#0c211c';c.fillRect(0,0,320,240);
 paintInteriorMaterial(c,{x:16,y:30,w:288,h:192},'cement',floorPalette);
 drawInteriorFace(c,{x:12,y:34,w:296,height:28,material:'masonry',palette:floorPalette,
  trim:['#3a5340','#697a5d','#aaaa7e']});
}
function drawDefaultFloor(c){
 if(!defaultFloor&&typeof document!=='undefined'){
  defaultFloor=document.createElement('canvas');
  defaultFloor.width=320;defaultFloor.height=240;paintFloor(defaultFloor.getContext('2d'));
 }
 if(defaultFloor)c.drawImage(defaultFloor,0,0);
 else paintFloor(c);
}
export function drawUpperSanctum(c,g,design=undefined){
 const designed=design===undefined?activeLocationDesign('temple-upper'):design;
 c.save();c.imageSmoothingEnabled=false;if(!designed){drawDefaultFloor(c);
 // Inlaid processional aisle and central jade sun, not a flat gray rectangle.
 c.fillStyle='#465f47';c.fillRect(125,82,70,123);c.fillStyle='#b09c5c';c.fillRect(126,84,2,118);c.fillRect(192,84,2,118);
 for(let y=90;y<196;y+=14){c.fillStyle='#79956c';c.fillRect(132,y,55,1);}
 c.strokeStyle='#baa96c';c.lineWidth=2;c.beginPath();c.ellipse(160,143,27,21,0,0,Math.PI*2);c.stroke();
 c.strokeStyle='#3e7b62';c.lineWidth=4;c.beginPath();c.ellipse(160,143,18,14,0,0,Math.PI*2);c.stroke();
 c.fillStyle='#b8bd83';c.fillRect(157,140,6,6);
 }else drawDesignedRoom(c,'temple-upper',designed);
 drawDungeonDecor(c,designed?.markers?.filter(m=>m.kind==='jade_aisle')||[]);
 // Stepped perimeter, matching ground-floor masonry and inset square motifs.
 for(const r of [{x:12,y:26,w:296,h:13},{x:12,y:26,w:12,h:198},{x:296,y:26,w:12,h:198},{x:12,y:214,w:128,h:10},{x:180,y:214,w:128,h:10}]){
  c.fillStyle='#344938';c.fillRect(r.x+2,r.y+4,r.w,r.h);c.fillStyle='#74805d';c.fillRect(r.x,r.y,r.w,r.h);c.fillStyle='#bcc492';c.fillRect(r.x,r.y,r.w,2);
  c.strokeStyle='#4e6045';c.lineWidth=1;for(let x=r.x;x<r.x+r.w;x+=20)for(let y=r.y;y<r.y+r.h;y+=10)c.strokeRect(x,y,Math.min(20,r.x+r.w-x),Math.min(10,r.y+r.h-y));
 }
 for(const x of [28,280])for(const y of [92,134,195]){c.fillStyle='#b2a166';c.fillRect(x,y,11,11);c.fillStyle='#304f3b';c.fillRect(x+2,y+2,7,7);c.fillStyle='#80a477';c.fillRect(x+4,y+4,3,3);}
 // Side-wall pilasters stay outside the existing walkable corridor.
 for(const x of [14,294])for(const y of [94,151]){c.fillStyle='#253e30';c.fillRect(x-3,y+3,18,23);c.fillStyle='#8c9772';c.fillRect(x-3,y,17,6);c.fillStyle='#66795a';c.fillRect(x,y+6,11,14);c.fillStyle='#b0b68b';c.fillRect(x+1,y+6,2,13);}
 const chest=designed?.markers?.find(m=>m.role==='chest')||{x:160,y:78};c.save();c.translate(chest.x-160,chest.y-78);
 // Altar dais retains the ritual chest's original interaction position.
 c.fillStyle='#3a503c';c.fillRect(126,59,68,34);c.fillStyle='#8b9870';c.fillRect(129,57,62,31);c.fillStyle='#c4be8b';c.fillRect(129,57,62,2);
 c.fillStyle='#59755c';c.fillRect(134,62,52,21);c.strokeStyle='#b7a45d';c.lineWidth=1;c.strokeRect(137,64,46,16);
 c.restore();drawDungeonDecor(c,designed?.markers?.filter(m=>m.role==='prop'&&m.kind!=='jade_aisle')||[{kind:'statue',x:70,y:60},{kind:'statue',x:236,y:60}]);
 const exit=designed?.markers?.find(m=>m.role==='exit')||{x:160,y:208};c.save();c.translate(exit.x-160,exit.y-208);
 // Descending stairs remain at the saved south exit.
 c.fillStyle='#263e32';c.fillRect(140,201,40,23);for(let n=0;n<5;n++){c.fillStyle=n%2?'#65795d':'#a4ac83';c.fillRect(141,203+n*4,38,3);}
 c.restore();
 // Small vine silhouette along upper cornice, like the lower temple's growth.
 for(let x=35;x<285;x+=31){c.fillStyle='#315e3e';c.fillRect(x,28,2,14);c.fillRect(x-3,35,7,3);c.fillStyle='#5b8049';c.fillRect(x+2,39,5,2);}
 for(const [i,t]of (designed?.markers?.filter(m=>m.role==='light')||UPPER_TORCHES).entries()){
  c.fillStyle='#332e25';c.fillRect(t.x-3,t.y-10,6,12);c.fillStyle='#a68950';c.fillRect(t.x-2,t.y-9,4,3);drawTorchFlame(c,t.x,t.y-12,g.time||0,i+43);
 }
 c.restore();
}
