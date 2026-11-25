const tint=(hex,k)=>'#'+[1,3,5].map(i=>Math.min(255,Math.round(parseInt(hex.slice(i,i+2),16)*k)).toString(16).padStart(2,'0')).join('');
export function trainEngineProfile(car){
 const radius=car.width*.34,centerZ=42;
 return {radius,centerZ,top:centerZ+radius,stackTop:centerZ+radius+26};
}
export function paintTrainFrame(p,c,P){
 const L=c.length,W=c.width;
 // Continuous side girders and transverse bolsters carry the deck. Nothing
 // hangs below a door as a separate boarding-step asset.
 for(const side of[-1,1]){
  p.box(0,side*(W/2-9),6,L-12,5,9,'#26363b',true);
  p.line([[-L/2+9,side*(W/2-6),14],[L/2-9,side*(W/2-6),14]],'#63716b',1);
 }
 for(const x of[-L*.32,L*.32]){
  p.box(x,0,7,15,W-18,7,'#3b484b',true);
  for(const side of[-1,1])for(let z=7;z<=11;z+=2)p.line([[x-10,side*(W/2-4),z],[x+10,side*(W/2-4),z]],'#7a8479',1);
 }
 p.box(0,0,4,L*.34,W*.35,6,'#1c2b32');
}
export function paintTrainDeckEdge(p,c,P){
 const L=c.length,W=c.width;
 for(const side of[-1,1]){
  p.box(0,side*(W/2-1),15,L-8,3,4,'#303c3f');
  p.line([[-L/2+6,side*(W/2+.3),19],[L/2-6,side*(W/2+.3),19]],tint(P.lining,.76),1);
 }
}
export function paintTrainEndFrames(p,c,P){
 const L=c.length,W=c.width;
 for(const end of c.kind==='engine'?[-1]:[-1,1]){
  const x=end*(L/2-4);
  p.wallBox(x,0,60,6,W-8,4,tint(P.body,.78),true);
  for(const side of[-1,1]){
   p.wallBox(x,side*23,20,6,5,44,tint(P.body,.84),true);
   p.wallBox(x,side*23,60,7,6,2,P.lining);
  }
  p.box(x,0,19,8,39,2,'#69756d');
 }
 if(c.kind==='engine')for(const side of[-1,1])p.wallBox(-L*.29,side*(W/2-3),60,L*.4,5,4,tint(P.body,.78),true);
}
export function paintTrainRoofEnd(p,c,P,x0,x1){
 const W=c.width;
 for(const [x,sign] of[[x0,-1],[x1,1]]){if(sign*Math.sin(c.a)<1e-6)continue;
  const points=Array.from({length:17},(_,i)=>{const y=-W/2-4+(W+8)*i/16;return[x,y,64+12*Math.sin(i*Math.PI/16)];});
  p.poly([...points,[x,W/2+4,62],[x,-W/2-4,62]],tint(P.roof,.63),true);
  p.line(points,tint(P.roof,1.1),1);
 }
}
