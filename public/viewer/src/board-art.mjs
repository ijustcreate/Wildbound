import {boardSettings,BOARD_PIECES} from './board-settings.mjs';
import {drawBoardMagic} from './board-magic.mjs';
import {PAWN_ATLAS} from './board-pawn-atlas.mjs';
import {boardDicePose} from './board-sequence.mjs';
import {BOARD_ENTRY_TILE_PIXELS,boardImagePoint} from './board-layout.mjs';
const load=path=>{if(typeof Image==='undefined')return null;const image=new Image();image.src=new URL(path,import.meta.url).href;return image;};
export const BOARD_ART_ASSETS=Object.freeze({forest:'../assets/board-minimal.png',desert:'../assets/board-desert-v1.png',beach:'../assets/board-beach-v1.png',temple:'../assets/board-temple-v1.png',house:'../assets/board-house-v1.png'});
const backgrounds=Object.fromEntries(Object.entries(BOARD_ART_ASSETS).map(([biome,path])=>[biome,load(path)])),pieces=load('../assets/board-pawns.png');
export const boardArtBiome=game=>(game.generatedEnvironment||game.environment)==='graveyard'?'graveyard':Object.hasOwn(BOARD_ART_ASSETS,game.generatedEnvironment||game.environment)?game.generatedEnvironment||game.environment:'forest';
function drawCemeteryBoard(c,trail){
 c.fillStyle='#283333';c.fillRect(-140,-96,280,192);c.fillStyle='#35453c';c.fillRect(-132,-88,264,176);
 c.strokeStyle='#777d68';c.lineWidth=3;c.strokeRect(-135,-91,270,182);
 for(let i=0;i<42;i++){const x=-127+i*6.2;c.fillStyle='#18252b';c.fillRect(x,-90,2,14);c.fillRect(x,78,2,12);c.fillStyle='#87938a';c.fillRect(x,-90,1,2);}
 for(const [x,y]of [[-95,-56],[-55,-66],[12,-59],[77,-55],[-92,54],[-41,60],[24,58],[91,53]]){
  c.fillStyle='#172b27';c.fillRect(x-8,y+2,16,6);c.fillStyle='#626f6b';c.fillRect(x-5,y-13,10,16);c.fillRect(x-3,y-16,6,3);c.fillStyle='#a2a894';c.fillRect(x-4,y-12,8,2);c.fillStyle='#313e3c';c.fillRect(x-1,y-8,2,9);c.fillRect(x-4,y-6,8,2);
 }
 c.fillStyle='#435352';c.fillRect(98,-14,26,30);c.fillStyle='#93a18c';c.fillRect(96,-17,30,4);c.fillStyle='#172227';c.fillRect(106,-9,10,24);
 c.strokeStyle='#c2c7a3';c.lineWidth=7;c.lineJoin='round';c.beginPath();trail.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();
 c.strokeStyle='#646c59';c.lineWidth=1.5;c.stroke();
}
function drawEntryStone(c){
  const outline=(dx=0,dy=0)=>{c.beginPath();for(const [i,p]of BOARD_ENTRY_TILE_PIXELS.entries()){const v=boardImagePoint(p);i?c.lineTo(v.x+dx,v.y+dy):c.moveTo(v.x+dx,v.y+dy);}c.closePath();};
  c.fillStyle='#493a26';outline(.1,1);c.fill();
  c.fillStyle='#d7c39a';outline(0,.6);c.fill();
  c.fillStyle='#f1e3ba';outline();c.fill();
  c.strokeStyle='#fff2d1';c.lineWidth=.35;const a=boardImagePoint(BOARD_ENTRY_TILE_PIXELS[0]),b=boardImagePoint(BOARD_ENTRY_TILE_PIXELS[1]);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
}
export function pawnFacing(dx,dy){return (Math.round(Math.atan2(-dx,dy)/(Math.PI/4))+8)%8;}
export function drawAnimalPawn(c,x,y,animal,direction,color,size=17,hop=0){
  const frame=PAWN_ATLAS[animal]?.[direction];c.save();c.translate(x,y-hop);
  c.fillStyle=color;c.beginPath();c.ellipse(0,1,size*.36,1.3,0,0,Math.PI*2);c.fill();
  if(pieces?.complete&&pieces.naturalWidth&&frame){const scale=size/170;c.imageSmoothingEnabled=false;c.drawImage(pieces,frame.x,frame.y,frame.w,frame.h,-frame.w*scale/2,-frame.h*scale,frame.w*scale,frame.h*scale);}
  else {c.fillStyle=color;c.fillRect(-3,-8,6,8);}
  c.restore();
}
export function drawBoardScene(c,game,time,options,trail,point){
  const settings=options.settings||boardSettings;c.save();
  const selected=backgrounds[boardArtBiome(game)];
  const background=selected?.complete&&selected.naturalWidth?selected:backgrounds.forest;
  c.fillStyle='#30251a';c.fillRect(-140,-96,280,192);
  if(boardArtBiome(game)==='graveyard')drawCemeteryBoard(c,trail);
  else if(background?.complete&&background.naturalWidth){c.save();c.filter=`brightness(${settings.boardLight})`;c.drawImage(background,-140,-96,280,192);c.restore();}
  else{c.strokeStyle='#d5c49a';c.lineWidth=10;c.beginPath();trail.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
  drawEntryStone(c);
  const resolved=game.roll?.resolved&&game.event;
  const title=options.previewTitle??(resolved?game.event.name:game.event&&game.eventTime>0?game.event.name:'');
  const warning=options.previewWarning??(resolved?game.event.tip:'');
  const age=options.previewAge??(resolved?Math.max(0,game.roll.elapsed-game.roll.landingAt):(game.eventTime||0));
  drawBoardMagic(c,time,settings,{title,warning,age});
  if(settings.showPath){c.font='3px system-ui';c.textAlign='center';for(const [i,p]of trail.entries()){c.fillStyle='#0c211ccc';c.fillRect(p.x-2,p.y-2,4,4);c.fillStyle='#ffffff';c.fillText(String(i),p.x,p.y+1);}}
  const pawns=(game.players||[]).map((p,i)=>{const progress=p.boardProgress??p.progress??0,v=Math.max(0,Math.min(48,progress)),q=point(v),next=point(Math.min(48,v+.1)),prev=point(Math.max(0,v-.1));
    const occupants=game.players.filter(other=>Math.abs((other.boardProgress??other.progress??0)-v)<1e-6),crowded=Number.isInteger(v)&&occupants.length>1,slot=occupants.indexOf(p);
    return {p,i,x:q.x+(crowded?(slot%3-1)*1.1:0),y:q.y+(crowded?(Math.floor(slot/3)-(Math.ceil(occupants.length/3)-1)/2)*1.4:0),hop:q.hop,d:pawnFacing(next.x-prev.x,next.y-prev.y)};}).sort((a,b)=>a.y-b.y);
  for(const a of pawns){drawAnimalPawn(c,a.x,a.y,settings.pieces[a.i%6]||BOARD_PIECES[a.i%6],a.d,a.p.color||'#b9dbbc',settings.pieceSize,a.hop);c.font='bold 3px system-ui';c.textAlign='center';c.fillStyle='#fff8dc';c.fillText(String(a.i+1),a.x,a.y+4);}
  if(game.roll&&options.drawDie)for(let i=0;i<game.roll.dice.length;i++){const d=boardDicePose(game.roll,i);options.drawDie(c,d.x,d.y,d.size,d.value,d.angle);}
  c.restore();
}
