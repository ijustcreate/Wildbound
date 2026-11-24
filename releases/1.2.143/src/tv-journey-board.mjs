// The TV uses the same board renderer, layout, pawns and effects as other worlds.
import {drawBoard} from './board.mjs';
let plate=null,loading=null;
export function loadTvJourneyArt(){
  if(loading)return loading;if(typeof Image==='undefined')return Promise.resolve(false);
  loading=new Promise(resolve=>{const image=new Image();image.onload=()=>{const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(image,0,0,512,256);plate=c;resolve(true);};image.onerror=()=>resolve(false);
    image.src=new URL('../assets/tv-arena/journey-board-v1.png',import.meta.url).href;});return loading;
}
export function drawTvJourneyBackdrop(c,x,y,w,h){loadTvJourneyArt();if(plate){c.imageSmoothingEnabled=false;c.drawImage(plate,x,y,w,h);}else{c.fillStyle='#244e4b';c.fillRect(x,y,w,h);}}
// Adapt only TV-local state. Never mutate the explorers' main-world progress.
export function tvBoardPresentation(m){
 const view=m.rollView,start=view?.startProgress??m.progress,target=m.progress;
 // Keep the TV's short reveal while retaining the native dice-then-pawn sequence.
 const elapsed=(view?.elapsed||0)*2,landingAt=1.6+Math.max(0,target-start)*.16;
 const progress=view?Math.min(target,start+Math.max(0,elapsed-1.6)/.16):target;
 const resolved=elapsed>=landingAt;
 return {environment:'tv-arena',players:[...m.players.values()].map(p=>({...p.hero,boardProgress:progress})),current:view?.playerId,
  roll:view?{...view,elapsed,landingAt,targetProgress:target,resolved,centerLanding:resolved&&target>=48}:null,
  event:{name:m.encounter?.theme||'Mossroot Coliseum',tip:'Hit the center board again to continue toward WILDBOUND.'},eventTime:0};
}
export function drawTvJourneyBoard(c,m,left,width,options={}){
 const game=tvBoardPresentation(m),center=left+width/2,scale=Math.min((width-48)/280,2.15);
 c.save();c.fillStyle='#071d22f7';c.fillRect(left,0,width,540);
 c.fillStyle='#f5df9f';c.font='bold 22px Georgia';c.textAlign='center';c.fillText('WILDBOUND',center,32,width-40);
 c.font='12px system-ui';c.fillStyle='#bdcdb5';c.fillText('Mossroot Coliseum - reach the center seal to win',center,53,width-40);
 c.save();c.translate(center,280);c.scale(scale,scale);drawBoard(c,game,game.roll?.elapsed||m.time,options);c.restore();
 c.font='14px system-ui';c.fillStyle='#f5df9f';c.fillText(`ROLL ${m.lastRoll} - BOARD ${m.progress} / 48`,center,510,width-40);c.restore();
}
