import {beachVisualWaterDepth} from './beach-art.mjs';
import {waterAt} from './environment.mjs';
import {bankCut,riverCorners} from './river-edges.mjs';
import {shrinkingScale} from './shrinking-candy.mjs';
import {waterBelowBridge} from './swimming.mjs';
import {bridgeAt} from './terrain-support.mjs';
import {wildLandsSurfaceAt} from './wild-lands-world.mjs';

const flyingKinds=new Set(['bat','cave_bat','wasp','bee','tsetse','pelican','sparrow','raven','crow','snowy_owl']);
const halfFootprint=8;
const sides=[[halfFootprint,0],[-halfFootprint,0],[0,halfFootprint],[0,-halfFootprint]];
const wetLevel=kind=>kind==='water'?1:kind==='shallow'?.36:0;

function forestBankSurface(g,x,y,kind){
  if(kind!=='shallow')return kind;
  const tx=Math.floor(x/32),ty=Math.floor(y/32);
  const px=Math.floor((x-tx*32)/2)*2+1,py=Math.floor((y-ty*32)/2)*2+1;
  if((px>=12&&px<=20)||(py>=12&&py<=20))return kind;
  const corners=riverCorners((col,row)=>waterAt(g,col*32+16,row*32+16),tx,ty);
  return corners.some(corner=>bankCut(corner.dx<0?px:32-px,corner.dy<0?py:32-py,corner))?'grass':kind;
}

export function actorWaterDepth(g,actor,{footOffset=0,supported=false}={}){
  if(actor.room||actor.carriedBy||actor.vehicleId||actor.trainRide||actor.trainDeck||actor.pirateRide||
    actor.bedRest||actor.wingHover||actor.jumpHeight>0||actor.groundHeight>0||actor.roostHeight>0||
    actor.flightHeight>0||actor.succubusFlightHeight>0||flyingKinds.has(actor.kind)||
    (actor.kind==='imp'&&(actor.impFlightHeight??20)>0))return 0;
  const design=g.trainTest?.design;
  const {x}=actor,y=actor.y+footOffset;
  if(!Number.isFinite(x)||!Number.isFinite(y))return 0;
  const onBridge=!design&&bridgeAt(g,x,actor.y);
  if((supported===true||onBridge||!design&&bridgeAt(g,x,y))&&!actor.underBridge)return 0;
  const supportedHere=()=>!actor.underBridge&&typeof supported==='function'&&supported();
  if(!design&&g.phase!=='won'&&g.generatedEnvironment==='beach'){
    const depth=beachVisualWaterDepth(g,x,y);
    if(depth!==null)return depth&&!supportedHere()?depth:0;
  }
  const surface=(px,py)=>{
    if(design?.wildLands)return wildLandsSurfaceAt(design,px,py);
    if(!design&&actor.underBridge&&bridgeAt(g,px,py))return waterBelowBridge(g,px,py);
    const kind=waterAt(g,px,py);
    return !design&&g.generatedEnvironment==='forest'&&!g.house?forestBankSurface(g,px,py,kind):kind;
  };
  const center=wetLevel(surface(x,y));
  if(!center||supportedHere())return 0;
  // Footprint samples soften the transition between depths in tile-based maps.
  let nearby=0;
  for(const [dx,dy] of sides)nearby+=wetLevel(surface(x+dx,y+dy));
  return center*.4+nearby*.15;
}

export function drawWaterActor(c,g,actor,size,draw,options){
  const depth=actorWaterDepth(g,actor,options);
  if(!depth){draw(actor);return false;}
  const footY=actor.y+(options?.footOffset??0);
  const scale=Math.max(24,Math.min(128,size||48))*shrinkingScale(actor);
  const extent=Math.max(180,(size||48)*3);
  c.save();
  c.beginPath();
  c.rect(actor.x-extent,footY-extent,extent*2,extent+1);
  c.clip();
  draw({...actor,y:actor.y+depth*scale*.35});
  c.restore();
  return true;
}
