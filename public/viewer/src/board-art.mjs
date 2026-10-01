import {boardSettings,BOARD_PIECES} from './board-settings.mjs';
import {drawBoardMagic} from './board-magic.mjs';
import {PAWN_ATLAS} from './board-pawn-atlas.mjs';
import {boardDicePose} from './board-sequence.mjs';
const load=path=>{if(typeof Image==='undefined')return null;const image=new Image();image.src=new URL(path,import.meta.url).href;return image;};
const art=load('../assets/board-minimal.png'),pieces=load('../assets/board-pawns.png');
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
  c.fillStyle='#30251a';c.fillRect(-140,-96,280,192);
  if(art?.complete&&art.naturalWidth){c.save();c.filter=`brightness(${settings.boardLight})`;c.drawImage(art,-140,-96,280,192);c.restore();}
  else{c.strokeStyle='#d5c49a';c.lineWidth=10;c.beginPath();trail.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
  const resolved=game.roll?.resolved&&game.event;
  const title=options.previewTitle??(resolved?game.event.name:game.event&&game.eventTime>0?game.event.name:'');
  const warning=options.previewWarning??(resolved?game.event.tip:'');
  const age=options.previewAge??(resolved?Math.max(0,game.roll.elapsed-game.roll.landingAt):(game.eventTime||0));
  drawBoardMagic(c,time,settings,{title,warning,age});
  if(settings.showPath){c.font='3px system-ui';c.textAlign='center';for(const [i,p]of trail.entries()){c.fillStyle='#0c211ccc';c.fillRect(p.x-2,p.y-2,4,4);c.fillStyle='#ffffff';c.fillText(String(i),p.x,p.y+1);}}
  const pawns=(game.players||[]).map((p,i)=>{const progress=p.boardProgress??p.progress??0,v=Math.max(0,Math.min(48,progress)),q=point(v),next=point(Math.min(48,v+.1)),prev=point(Math.max(0,v-.1));const crowded=game.players.filter(other=>Math.floor(other.boardProgress??other.progress??0)===Math.floor(v)).length>1;
    return {p,i,x:q.x+(crowded?(i%3-1)*4:0),y:q.y+(crowded?Math.floor(i/3)*3:0),hop:q.hop,d:pawnFacing(next.x-prev.x,next.y-prev.y)};}).sort((a,b)=>a.y-b.y);
  for(const a of pawns){drawAnimalPawn(c,a.x,a.y,settings.pieces[a.i%6]||BOARD_PIECES[a.i%6],a.d,a.p.color||'#b9dbbc',settings.pieceSize,a.hop);c.font='bold 3px system-ui';c.textAlign='center';c.fillStyle='#fff8dc';c.fillText(String(a.i+1),a.x,a.y+4);}
  if(game.roll&&options.drawDie)for(let i=0;i<game.roll.dice.length;i++){const d=boardDicePose(game.roll,i);options.drawDie(c,d.x,d.y,d.size,d.value,d.angle);}
  c.restore();
}
