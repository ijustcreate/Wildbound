import {facingIndex} from './player-motion.mjs';
import {QUIDDITCH_TEAMS} from './quidditch-layout.mjs';

const LOOKS=[
 ['#a97152','#3e2f2b','#7a5748'],['#d4a078','#4d362f','#59665b'],
 ['#916047','#292725','#6c576d'],['#e0b38b','#69523c','#56586c'],
 ['#b18468','#483831','#806443'],['#754b37','#292b2b','#587069'],
];
const WATCH_INTERVAL=.42;
const CHEER_EVENTS=new Set(['goal','throw','quaffle-caught','stagger','snitch-caught','finish']);
const sprites=new Map();

export class PitchCrowd{
 constructor(){this.groups=new Map();this.stands=new Map();}
 begin(match,riders){
  if(this.match!==match){this.groups.clear();this.stands.clear();this.match=match;}
  this.pickRiders=riders;this.riders=null;
  this.stats={stands:0,groupsSampled:0,comparisons:0,spectators:0,cheering:0};
 }
 watch(stand,side,time){
  if(!this.riders){
   this.riders=this.pickRiders();this.visibleIds=new Set(this.riders.map(rider=>rider.id));
  }
  const key=stand.team+':'+stand.index+':'+side,prev=this.groups.get(key);
  const tick=Math.floor((time+stand.index*.071+side*.113+(stand.team==='gold'?0:.17))/WATCH_INTERVAL);
  if(prev?.tick===tick&&(prev.player==null?!this.riders.length:this.visibleIds.has(prev.player)))return prev.direction;
  const x=stand.x+(side?1:-1)*stand.width*.22,y=stand.y-29;
  let direction=stand.south?4:0,player=null,best=Infinity;
  this.stats.groupsSampled++;
  for(const rider of this.riders){
   this.stats.comparisons++;
   const dx=rider.x-x,dy=rider.y-(rider.jumpHeight||0)-y,distance=dx*dx+dy*dy;
   if(distance<best){best=distance;direction=facingIndex(dx,dy);player=rider.id;}
  }
  this.groups.set(key,{tick,direction,player});
  return direction;
 }
 reaction(stand){
  const match=this.match;if(!match)return null;
  const key=stand.team+':'+stand.index,serial=match.nextEvent??0;
  let state=this.stands.get(key);
  if(!state||state.serial!==serial){
   let event=null;
   const range=520+stand.width/2;
   for(let i=match.events.length-1;i>=Math.max(0,match.events.length-6);i--){
    const item=match.events[i];
    if(match.time-item.at>1.65)break;
    if(CHEER_EVENTS.has(item.type)&&(item.x-stand.x)**2+(item.y-stand.y)**2<range*range){event=item;break;}
   }
   state={serial,event};this.stands.set(key,state);
  }
  return state.event&&match.time-state.event.at<1.5?state.event:null;
 }
}

const block=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
function paintSpectator(c,d,look,team,cheer){
 const [skin,hair,jacket]=LOOKS[look],scarf=QUIDDITCH_TEAMS[team].color;
 const side=d===2||d===6,back=d>=3&&d<=5,turn=d>=1&&d<=3?-1:d>=5&&d<=7?1:0;
 const wide=side?4:6,head=side?3:4;
 const shoulder=side?1:0,black='#39322f';
 block(c,-wide-1,-17,2*wide+2,12,black);
 block(c,-wide,-16,2*wide,10,jacket);
 block(c,-wide+1,-16,3,8,'#858075');
 block(c,-wide+1,-7,2*wide-2,4,'#474346');
 block(c,turn-5,-4,4,3,'#373936');
 block(c,turn+1,-4,4,3,'#373936');
 block(c,turn-6,-2,5,2,black);
 block(c,turn+1,-2,5,2,black);
 if(cheer){
  for(const n of [-1,1]){
   const x=n*(wide+2)+shoulder,dx=n<0?-1:0;
   block(c,x+dx,-21,3,8,black);
   block(c,x+1+dx,-20,2,6,jacket);
   block(c,x+dx,-24,3,4,skin);
   block(c,x+dx,-25,2,1,skin);
  }
 }else{
  block(c,-wide-1,-14,3,6,jacket);
  block(c,wide-1,-14,3,6,jacket);
  block(c,-wide,-11,2,3,skin);block(c,wide,-11,2,3,skin);
 }
 block(c,-2,-17,5,2,scarf);
 block(c,back?2:-1,-15,2,4,scarf);
 block(c,-head+turn-1,-24,2*head+2,7,hair);
 block(c,-head+turn,-26,2*head,2,hair);
 block(c,-head+turn+1,-26,2,1,'#776257');
 if(!back||turn){
  const left=side?turn*2-1:turn-3;
  block(c,left,-22,side?4:7,4,skin);
  block(c,turn+1,-21,1,1,black);
  if(directionVisible(d))block(c,turn-2,-21,1,1,black);
  if(side)block(c,turn*5,-20,1,2,skin);
 }
}
const directionVisible=d=>d===0||d===1||d===7;

export function drawPitchSpectator(c,x,y,d,look,team,cheer){
 const key=[d,look,team,Number(cheer)].join('/');
 let image=sprites.get(key);
 if(!image){
  image=typeof OffscreenCanvas==='function'?new OffscreenCanvas(24,31):typeof document!=='undefined'?document.createElement('canvas'):null;
  if(image){
   image.width=24;image.height=31;
   const pen=image.getContext('2d');pen.translate(12,28);
   paintSpectator(pen,d,look,team,cheer);sprites.set(key,image);
  }
 }
 const px=Math.round(x),py=Math.round(y);
 if(image)c.drawImage(image,px-12,py-28);
 else{c.save();c.translate(px,py);paintSpectator(c,d,look,team,cheer);c.restore();}
}
