import {pixelPolygon} from './pixel-shapes.mjs';

const size=25,origin=(size-1)/2,spins=20;
const cache=[];
const colors={
  ink:'#322831',tarnish:'#77503c',bronze:'#a87845',gold:'#d4a461',polish:'#efd689',
  metalDark:'#626f78',metal:'#a2afb3',edge:'#e5e5d4',gemDark:'#264940',gem:'#68a86c',facet:'#b5d982'
};

function drawGlaive(c,angle){
  const p=colors;
  for(let i=0;i<5;i++){
    const a=angle+i*Math.PI*2/5,dx=Math.cos(a),dy=Math.sin(a);
    const blade=(shape,color)=>pixelPolygon(c,shape.map(([along,across])=>({
      x:origin+dx*along-dy*across,y:origin+dy*along+dx*across
    })),color);
    blade([[2,-2.7],[6,-2.1],[8,-3.3],[8,-5.8],[6.7,-8.4],[9.1,-7.1],[11,-3.6],[11.6,-.7],[10.8,1.6],[7.6,3],[3,3.2]],p.ink);
    blade([[4.4,-1.5],[7.9,-2.4],[8.8,-4.1],[8,-6.8],[9.9,-4.7],[10.6,-2.1],[10.4,.6],[8.3,1.8],[5.2,2.2]],p.metalDark);
    blade([[8.4,-7],[9.8,-4.8],[10.8,-2],[10.6,.35],[9.6,1.15],[9.8,-1.8],[9.1,-3.7]],p.edge);
    blade([[6.2,-1.2],[8,-2],[9.1,-3.9],[9.8,-1.8],[9.6,.5],[8,1.4],[6,1.6]],p.metal);
    blade([[1.9,-2.3],[5.4,-1.7],[7.4,-.65],[7,1.7],[4.3,2.4],[1.7,2.7]],i%2?p.bronze:p.gold);
    blade([[2.4,-1.7],[5.2,-1.4],[6.4,-.85],[5.5,-.3],[2.5,-.7]],p.polish);
  }
  const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(origin+x,origin+y,w,h);};
  r(-2,-4,5,1,p.ink);r(-4,-2,9,5,p.ink);r(-3,-3,7,7,p.tarnish);r(-2,4,5,1,p.ink);
  r(-2,-3,5,1,p.polish);r(-3,-2,2,4,p.gold);r(-2,2,5,1,p.gold);r(2,-1,2,3,p.bronze);
  r(-1,-2,3,1,p.gemDark);r(-2,-1,5,2,p.gemDark);r(-1,1,3,1,p.gemDark);
  r(-1,-1,3,2,p.gem);r(0,-1,1,1,p.facet);
}

function tile(angle){
  const step=((Math.round(angle/Math.PI*spins/2)%spins)+spins)%spins;
  if(cache[step])return cache[step];
  let canvas;
  if(typeof OffscreenCanvas==='function')canvas=new OffscreenCanvas(size,size);
  else if(typeof document!=='undefined'){
    canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
  }else return null;
  drawGlaive(canvas.getContext('2d'),step/spins*Math.PI*2);
  return cache[step]=canvas;
}

export function paintGlaiveIcon(c){
  drawGlaive(c,-Math.PI/2);
}

export function drawHeldGlaive(c,hand,d){
  const angle=-Math.PI/2+(d===0||d===4?0:d<4?-.42:.42);
  const frame=tile(angle),x=Math.round(hand.x)-9,y=Math.round(hand.y)-14;
  if(frame)c.drawImage(frame,x,y,19,d===2||d===6?15:18);
  else {c.save();c.translate(x,y);c.scale(.75,.68);drawGlaive(c,angle);c.restore();}
}

export function drawFlyingGlaive(c,x,y,angle){
  const frame=tile(angle),left=Math.round(x)-origin,top=Math.round(y)-origin;
  if(frame)c.drawImage(frame,left,top);
  else {c.save();c.translate(left,top);drawGlaive(c,angle);c.restore();}
}

export function drawVeilkeeperChest(c,x,y,opened){
  const p=colors,stone='#454550',edge='#79716d',dark='#2f303d';
  const r=(dx,dy,w,h,color)=>{c.fillStyle=color;c.fillRect(x+dx,y+dy,w,h);};
  r(-23,1,46,6,'#172a3399');r(-20,-9,40,13,dark);
  r(-19,-9,38,10,stone);r(-17,-8,34,1,edge);r(-19,0,38,3,dark);
  r(-17,-7,3,10,p.tarnish);r(14,-7,3,10,p.tarnish);
  r(-16,-7,1,7,p.bronze);r(15,-7,1,7,p.bronze);
  r(-10,-5,20,1,dark);r(-11,-2,7,1,edge);r(6,-2,5,1,edge);
  if(opened){
    r(-18,-26,36,16,dark);r(-16,-24,32,12,stone);r(-14,-23,28,8,'#262731');
    r(-15,-23,1,11,p.tarnish);r(14,-23,1,11,p.tarnish);
    r(-20,-12,40,4,edge);r(-17,-11,34,3,'#242530');
    r(-3,-10,6,2,p.bronze);
  }else{
    r(-17,-24,34,2,dark);r(-19,-22,38,3,dark);r(-21,-19,42,11,dark);
    r(-16,-22,32,3,edge);r(-18,-19,36,5,stone);r(-19,-14,38,4,edge);
    r(-17,-21,3,10,p.tarnish);r(14,-21,3,10,p.tarnish);
    r(-16,-21,1,9,p.gold);r(15,-20,1,8,p.bronze);
    r(-7,-20,14,3,dark);r(-5,-19,10,1,edge);
    r(-4,-13,8,9,p.ink);r(-3,-13,6,7,p.bronze);
    r(-2,-12,4,4,p.gemDark);r(-1,-12,2,3,p.gem);r(0,-12,1,1,p.facet);
  }
}
