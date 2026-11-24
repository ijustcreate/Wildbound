import {railSpanBroken} from './train-bridges.mjs';
import {railwaySurface} from './railway-water.mjs';
import {railElevation,railwayWater,sampleTrainRoute} from './train-track.mjs';
import {trackRangesInView,trackSampleDistances} from './train-track-art.mjs';

const SUPPORT_STEP=96;
const FASCIA_HEIGHT=7;
const PIER_WATERLINE=14;
const REFLECTION_SCALE=.65;
const MAX_REFLECTION_DEPTH=48;
const COLORS={deck:'#55463c',railBed:'#a18460',edge:'#926348',edgeLight:'#bb8863',edgeShadow:'#47362f',
 pier:'#625953',pierLight:'#908272',pierShadow:'#453f3e',contact:'#284a49',water:'#a4d9cf'};

function face(c,points,color){
 c.fillStyle=color;c.beginPath();
 for(const [i,p] of points.entries())if(i)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y);
 c.closePath();c.fill();
}

function bridgePoint(q,side,along=0,lift=0){
 const dx=Math.cos(q.a),dy=Math.sin(q.a);
 return {x:q.x-dy*side+dx*along,y:q.y+dx*side+dy*along-lift};
}

export function trackBridgePiers(d,q,z){
 return [-1,1].map(side=>{
  const deck=bridgePoint(q,side*(d.gauge/2+10),0,z-1);
  const ground=bridgePoint(q,side*(d.gauge/2+10));
  const foot={x:Math.round(ground.x),y:Math.round(ground.y+PIER_WATERLINE)};
  const wet=railwaySurface(d,foot.x,foot.y)!=='grass';
  return {deck,foot,wet};
 });
}

export function drawTrackBridgePiers(c,d,q,z,s){
 if(s%SUPPORT_STEP!==0)return;
 for(const {deck,foot,wet} of trackBridgePiers(d,q,z)){
  const y=Math.round(deck.y),height=foot.y-y;
  c.fillStyle=COLORS.contact;
  if(wet)c.fillRect(foot.x-6,foot.y-1,12,3);
  c.fillStyle=COLORS.pierShadow;c.fillRect(foot.x-5,y,10,height);
  c.fillStyle=COLORS.pier;c.fillRect(foot.x-4,y,7,height-2);
  c.fillStyle=COLORS.pierLight;c.fillRect(foot.x-4,y+2,3,height-5);
  c.fillStyle=COLORS.pierShadow;c.fillRect(foot.x-5,foot.y-4,10,3);
 }
}

export function drawTrackBridgeFascia(c,d,q,z,{start=false,end=false}={}){
 const side=d.gauge/2+17,front=Math.cos(q.a)>=0?side:-side;
 const a=bridgePoint(q,front,-10,z-2),b=bridgePoint(q,front,10,z-2);
 const strip=(p,k,top,bottom,color)=>face(c,
  [{x:p.x,y:p.y+top},{x:k.x,y:k.y+top},{x:k.x,y:k.y+bottom},{x:p.x,y:p.y+bottom}],color);
 strip(a,b,0,FASCIA_HEIGHT,COLORS.edge);
 strip(a,b,0,3,COLORS.edgeLight);
 strip(a,b,5,FASCIA_HEIGHT,COLORS.edgeShadow);
 const signedEnd=Math.sin(q.a)>=0?10:-10;
 if(signedEnd>0?end:start){
  const near=bridgePoint(q,side,signedEnd,z-2),far=bridgePoint(q,-side,signedEnd,z-2);
  strip(near,far,0,FASCIA_HEIGHT,COLORS.edgeShadow);
 }
}

export function drawTrackBridgeDeck(c,d,q,z){
 const side=d.gauge/2+17,lift=z-2;
 face(c,[bridgePoint(q,-side,-10,lift),bridgePoint(q,side,-10,lift),
  bridgePoint(q,side,10,lift),bridgePoint(q,-side,10,lift)],COLORS.deck);
 const a=bridgePoint(q,-side,0,lift),b=bridgePoint(q,side,0,lift);
 c.strokeStyle=COLORS.railBed;c.lineWidth=5;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
}

const waterPixel=(d,x,y)=>railwaySurface(d,x,y)!=='grass';
const reflectedDepth=height=>Math.min(MAX_REFLECTION_DEPTH,Math.max(0,height*REFLECTION_SCALE));

export function drawTrackBridgeReflection(c,d,route,bounds){
 const ranges=trackRangesInView(route,bounds);
 const side=d.gauge/2+17,pad=side+12;
 let pieces=0;
 c.save();
 for(const s of trackSampleDistances(route,ranges,16)){
  const q=sampleTrainRoute(route,s);
  if(q.x<bounds.left-pad||q.x>bounds.right+pad||q.y<bounds.top-pad-MAX_REFLECTION_DEPTH||q.y>bounds.bottom+pad||railSpanBroken(d,route,s))continue;
  const across=Math.cos(q.a)>=0?side:-side;
  const a=bridgePoint(q,across,-10),b=bridgePoint(q,across,10);
  const waterUnderTrack=railwayWater(d,q.x,q.y);
  const waterUnderEdge=[a,b].some(p=>waterPixel(d,p.x,p.y+PIER_WATERLINE));
  const support=s%SUPPORT_STEP===0;
  if(!waterUnderTrack&&!waterUnderEdge&&!support)continue;
  const z=railElevation(d,q);
  if(z<=2&&!waterUnderTrack)continue;

  if(support)for(const {deck,foot,wet} of trackBridgePiers(d,q,z)){
   if(!wet)continue;
   const length=Math.round(reflectedDepth(foot.y-deck.y));
   if(length<2)continue;
   c.fillStyle=COLORS.pierShadow;c.fillRect(foot.x-5,foot.y,10,length);
   c.fillStyle=COLORS.pier;c.fillRect(foot.x-4,foot.y,7,length-1);
   c.fillStyle=COLORS.pierLight;c.fillRect(foot.x-4,foot.y+2,3,length-2);
   pieces++;
  }

  if(!waterUnderTrack&&!waterUnderEdge)continue;
  // Mirror the visible fascia from its local waterline. There are no rails or deck planks in the donor.
  const height=PIER_WATERLINE+z-2;
  const top=PIER_WATERLINE+reflectedDepth(height-FASCIA_HEIGHT);
  const bottom=PIER_WATERLINE+reflectedDepth(height);
  if(bottom<=top)continue;
  face(c,[{x:a.x,y:a.y+top},{x:b.x,y:b.y+top},{x:b.x,y:b.y+bottom},{x:a.x,y:a.y+bottom}],COLORS.edgeShadow);
  face(c,[{x:a.x,y:a.y+bottom-2},{x:b.x,y:b.y+bottom-2},{x:b.x,y:b.y+bottom},{x:a.x,y:a.y+bottom}],COLORS.edgeLight);
  pieces++;
 }
 c.restore();
 return pieces;
}

const rippleMarks=[[-1,0,3],[-.84,.55,3],[-.53,.84,4],[-.12,1,6],[.32,.90,4],[.69,.70,3],[.93,.33,4],[.81,-.54,3],[.36,-.90,4],[-.27,-.94,4],[-.72,-.70,3]];
export function drawTrackBridgeRipples(c,d,route,bounds,time){
 c.save();
 const alpha=c.globalAlpha;
 for(const s of trackSampleDistances(route,trackRangesInView(route,bounds),SUPPORT_STEP)){
  const q=sampleTrainRoute(route,s),z=railElevation(d,q);
  if(q.x<bounds.left-80||q.x>bounds.right+80||q.y<bounds.top-80||q.y>bounds.bottom+80||
   z<=2&&!railwayWater(d,q.x,q.y)||railSpanBroken(d,route,s))continue;
  for(const [index,{foot,wet}] of trackBridgePiers(d,q,z).entries()){
   if(!wet)continue;
   c.fillStyle=COLORS.water;
   for(const offset of [0,.5]){
    const phase=(time*.65+s*.014+index*.19+offset)%1;
    const radius=7+phase*18;
    c.globalAlpha=alpha*(1-phase)*.56;
    for(const [u,v,width] of rippleMarks){
     const x=Math.round(foot.x+u*radius-width/2),y=Math.round(foot.y+v*radius*.35);
     if(waterPixel(d,x,y)&&waterPixel(d,x+width,y))c.fillRect(x,y,width,2);
    }
   }
  }
 }
 c.restore();
}
