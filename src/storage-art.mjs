const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
let backdrop=null;
function paintBackdrop(c){
 rect(c,0,0,320,240,'#100e20');rect(c,15,35,290,187,'#49483b');
 for(let y=40;y<222;y+=32)for(let x=20;x<305;x+=32){rect(c,x,y,Math.min(32,305-x),1,'#3a3c34');rect(c,x,y,1,Math.min(32,222-y),'#3a3c34');rect(c,x+2,y+2,Math.min(29,303-x),1,'#565547');}
 rect(c,15,25,290,13,'#7b7962');rect(c,15,36,290,2,'#242d2b');
 rect(c,18,38,5,152,'#343a34');rect(c,18,38,284,4,'#343a34');
 for(let i=0;i<38;i++)rect(c,25+(i*73)%271,40+(i*31)%151,2+i%5,1+i%3,i%2?'#34382d':'#66614b');
 rect(c,285,95,17,64,'#272c27');for(const y of [98,125,152])rect(c,284,y,18,3,'#858572');rect(c,289,109,5,15,'#b6a46b');rect(c,296,115,4,9,'#55736b');
 rect(c,27,99,3,57,'#796846');rect(c,23,148,11,12,'#bbb29a');rect(c,31,153,16,17,'#5c756b');rect(c,32,149,14,2,'#a6aaa0');rect(c,32,149,2,9,'#a6aaa0');rect(c,44,149,2,9,'#a6aaa0');
 rect(c,116,161,10,15,'#363d35');rect(c,117,162,8,2,'#7b9180');rect(c,117,157,8,1,'#b0b09b');rect(c,117,157,1,8,'#b0b09b');rect(c,124,157,1,8,'#b0b09b');rect(c,122,143,2,21,'#8d7954');rect(c,119,145,8,3,'#b6ac8d');
}
export function drawStorageBackdrop(c){
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
const woods=[['#765036','#9d7049','#c99a62'],['#426e67','#618f7f','#a2c0a0'],['#71556f','#987590','#c3a2a5']];
export function drawStorageChest(c,x,y,index=0,open=false,near=false){
 const [shade,wood,light]=woods[index%3];
 c.save();c.translate(Math.round(x),Math.round(y));
 for(let i=0;i<3;i++)rect(c,-23+i*2,1+i,46-i*4,1,'#33332e');
 rect(c,-22,-22,44,23,'#292c28');rect(c,-20,-20,40,20,shade);rect(c,-19,-18,38,6,wood);rect(c,-19,-10,38,5,wood);rect(c,-19,-2,38,2,'#9d8056');
 for(const xx of [-17,-5,7,17])rect(c,xx,-17,1,15,shade);
 for(let i=0;i<4;i++)rect(c,-15+i*9,-7+i%2,5,1,light);
 // A stepped curved lid with a recessed interior, brass straps and a keyhole.
 if(open){rect(c,-19,-24,38,4,'#201e24');rect(c,-21,-39,42,3,'#343329');rect(c,-21,-36,42,12,shade);rect(c,-19,-35,38,3,light);rect(c,-17,-31,34,6,wood);rect(c,-14,-29,28,1,shade);}
 else {rect(c,-21,-27,42,7,'#343329');rect(c,-19,-32,38,6,shade);rect(c,-15,-35,30,4,wood);rect(c,-18,-29,36,3,light);rect(c,-20,-26,40,3,wood);rect(c,-21,-22,42,2,'#443931');}
 for(const xx of [-16,12]){rect(c,xx,open?-36:-32,4,open?35:33,'#8a7042');rect(c,xx+1,open?-35:-31,2,open?33:31,'#c9b172');for(const yy of [-18,-5])rect(c,xx+1,yy,1,1,'#f0d796');}
 rect(c,-5,-20,10,11,'#443825');rect(c,-4,-19,8,9,near?'#ecd185':'#c5a46a');rect(c,-3,-18,6,2,'#eed591');rect(c,-1,-15,2,4,'#4b4231');
 for(const xx of [-21,17]){rect(c,xx,-5,4,6,'#706142');rect(c,xx,-5,4,1,'#cdb677');}
 c.restore();
}
