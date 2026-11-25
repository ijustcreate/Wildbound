import {forestSettings} from './forest-settings.mjs';

const forms=new Map();
const formLimit=64;
const frondCount=9;
const frondSteps=12;

function hash(x,y){
 const n=Math.sin(x*127.1+y*311.7)*43758.5453;
 return n-Math.floor(n);
}

export function palmTrunkPoint(form,t){
 return {x:form.lean*t*t+form.bend*6*t*t*(1-t),y:-form.height*t};
}

function makeFrond(form,index,seed,rotation){
 const angle=-Math.PI+.22+index*(Math.PI*2-.44)/frondCount+rotation+(hash(seed,index+31)-.5)*.25;
 const length=(24+hash(index,seed)*13)*form.spread;
 const dx=Math.cos(angle)*length,dy=Math.sin(angle)*length*(.45+hash(index+12,seed)*.12);
 const arc=10+hash(seed,index+45)*6,drop=7+hash(seed,index+55)*6;
 const breadth=7+hash(seed,index+74)*2;
 const collar=.94+hash(seed,index+66)*.06;
 const attachment=palmTrunkPoint(form,collar);
 const samples=[];
 let minX=0,minY=0,maxX=0,maxY=0;
 for(let step=1;step<=frondSteps;step++){
  const t=step/frondSteps,arching=Math.sin(t*Math.PI);
  const x=dx*t,y=dy*t-arc*arching+drop*t*t;
  const width=breadth*arching*(.75+hash(index,step)*.25);
  const leftX=x-dy/length*width-dx*.06,leftY=y+dx/length*width+4*t;
  const rightX=x+dy/length*width-dx*.06,rightY=y-dx/length*width+4*t;
  samples.push({x,y,leftX,leftY,rightX,rightY});
  minX=Math.min(minX,x,leftX,rightX);maxX=Math.max(maxX,x,leftX,rightX);
  minY=Math.min(minY,y,leftY,rightY);maxY=Math.max(maxY,y,leftY,rightY);
 }
 const x=Math.floor(minX)-3,y=Math.floor(minY)-3;
 return {index,angle,length,collar,attachment,samples,x,y,width:Math.ceil(maxX)+3-x,height:Math.ceil(maxY)+3-y};
}

export function palmStructure(p){
 const seed=p.seed??hash(p.x,p.y)*1000;
 const formSeed=p.treeVariantSeed??seed;
 const {trunkHeight,canopyWidth,branchSpread}=forestSettings;
 const key=[seed,formSeed,trunkHeight,canopyWidth,branchSpread].join(':');
 let form=forms.get(key);
 if(form){forms.delete(key);forms.set(key,form);return form;}
 form={seed,lean:(hash(formSeed,11)-.5)*19,bend:(hash(formSeed,18)-.5)*9,
  height:(45+hash(formSeed,12)*10)*trunkHeight,spread:(.85+hash(formSeed,13)*.3)*canopyWidth*branchSpread,
  trunkWidth:6.2+hash(formSeed,21)*3.4,tipWidth:3.1+hash(formSeed,25)*1.4};
 const rotation=(hash(formSeed,27)-.5)*.54;
 form.fronds=Array.from({length:frondCount},(_,index)=>makeFrond(form,index,formSeed,rotation));
 if(forms.size>=formLimit)forms.delete(forms.keys().next().value);
 forms.set(key,form);
 return form;
}

function rect(c,x,y,w,h,color){
 c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));
}

function line(c,x,y,xx,yy,width,color){
 const steps=Math.max(1,Math.ceil(Math.hypot(xx-x,yy-y)));
 const stepX=(xx-x)/steps,stepY=(yy-y)/steps,half=width/2;
 c.fillStyle=color;
 for(let i=0;i<=steps;i++)c.fillRect(Math.round(x+stepX*i-half),Math.round(y+stepY*i-half),width,width);
}

function surface(width,height){
 if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(width,height);
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 return canvas;
}

function paintWood(c,form){
 const bands=Math.ceil(form.height/3);
 for(let i=0;i<=bands;i++){
  const t=i/bands,{x,y}=palmTrunkPoint(form,t),w=form.trunkWidth+(form.tipWidth-form.trunkWidth)*t;
  rect(c,x-w/2-1,y,w+2,5,'#493d2c');
  rect(c,x-w/2,y,w,4,'#94734c');
  rect(c,x-w/2,y,Math.max(1,w*.26),3,'#c7a171');
  if(i%2===0)line(c,x-w/2,y+3,x+w/2,y+2,1,'#665139');
 }
}

export function drawPalmWood(c,p,paintRoots){
 const form=palmStructure(p);
 const bark=p.realmPalette==='shadow'?'shadowWood':'wood';
 let raster=form[bark];
 if(!raster){
  const x=Math.ceil(Math.max(18,Math.abs(form.lean)+Math.abs(form.bend)+form.trunkWidth/2+3));
  const y=Math.ceil(form.height)+8,canvas=surface(x*2,y+12);
  if(!canvas){paintWood(c,form);paintRoots(c,p);return;}
  const pen=canvas.getContext('2d');pen.translate(x,y);
  paintWood(pen,form);paintRoots(pen,p);
  raster={canvas,x,y};form[bark]=raster;
 }
 c.drawImage(raster.canvas,-raster.x,-raster.y);
}

function paintFrond(c,frond){
 const edge=frond.index%3===0?'#3b6840':'#568449';
 const lit=frond.index%2?'#83a85b':'#a0b968';
 let px=0,py=0;
 for(const {x,y,leftX,leftY,rightX,rightY} of frond.samples){
  line(c,px,py,x,y,2,'#244c38');
  line(c,x,y,leftX,leftY,2,edge);
  line(c,x,y,rightX,rightY,2,'#35623d');
  line(c,px,py-1,x,y-1,1,lit);
  px=x;py=y;
 }
}

function makeFrondAtlas(fronds){
 const width=fronds.reduce((total,frond)=>total+frond.width,0);
 const height=Math.max(...fronds.map(frond=>frond.height));
 const canvas=surface(width,height);
 if(!canvas)return null;
 const pen=canvas.getContext('2d'),offsets=[];
 let x=0;
 for(const frond of fronds){
  offsets.push(x);pen.setTransform(1,0,0,1,x-frond.x,-frond.y);
  paintFrond(pen,frond);x+=frond.width;
 }
 return {canvas,offsets};
}

export function drawPalmFronds(c,p,time){
 const form=palmStructure(p),phase=time*1.4+form.seed,wind=forestSettings.wind*.045;
 const atlas=form.frondAtlas??=makeFrondAtlas(form.fronds);
 for(const frond of form.fronds){
  c.save();c.translate(frond.attachment.x,frond.attachment.y);
  // The frond moves around its own collar socket. The texture never needs repainting.
  const tilt=Math.sin(phase+frond.index*.7)*wind;
  if(tilt)c.transform(1,tilt,-tilt,1,0,0);
  if(atlas)c.drawImage(atlas.canvas,atlas.offsets[frond.index],0,frond.width,frond.height,frond.x,frond.y,frond.width,frond.height);
  else paintFrond(c,frond);
  c.restore();
 }
 const cx=form.lean,cy=-form.height;
 rect(c,cx-4,cy-2,8,5,'#476839');rect(c,cx-2,cy-4,4,8,'#476839');
 for(let i=0;i<Math.min(3,p.coconuts??Math.floor(hash(form.seed,17)*4));i++){
  rect(c,cx-5+i*4,cy+2+i%2*3,5,5,'#503d2b');
  rect(c,cx-4+i*4,cy+2+i%2*3,2,2,'#b28a50');
 }
}
