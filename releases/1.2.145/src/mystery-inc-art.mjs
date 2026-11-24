import {CREATURE_PACK} from './creature-packs/wildlife.mjs';

const dog=CREATURE_PACK.subjects.golden_retriever;
const spots={body:'#4a3932',shade:'#342e31',light:'#654c39'};
const model={
 ...dog.data,
 shape:{...dog.data.shape,bodyWidth:7.1,bodyHeight:6.9},
 palette:{body:'#98633f',shade:'#704733',light:'#bf8a54',face:'#ad7447',eye:'#281d22',outline:'#3c2d2c',
  muzzle:'#d0a076',muzzleShade:'#9d704e',mane:'#9c6340',nose:'#36282a',ear:'#745036',collar:'#449f9b'},
 coatMarkings:{key:'mystery-dane',material:(x,y,z)=>
  Math.abs(x)>.44&&((y+.38)**2+(z-.27)**2<.12||(y-.36)**2+(z+.17)**2<.055)?spots:null},
};

export function drawMysteryDog(c,actor,time,size){
 c.save();
 c.translate(Math.round(actor.x),Math.round(actor.y));
 const scale=size/48;
 c.scale(scale,scale*1.16);
 dog.draw(c,{...actor,x:0,y:0},time,model);
 c.restore();
}
