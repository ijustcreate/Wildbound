import {greyhavenApproachDistance} from './tideglass-layout.mjs';

const bounds={left:16585,top:850,right:18750,bottom:2800};
const meadow=['#536b42','#5b7344','#647c48','#6f854d','#778b53'];
const hollow=['#405940','#465f40','#4c6541','#536c45','#5c7349'];
const slate=['#555f55','#606b5e','#6b7364','#767c6c','#818471'];
const gravel=['#696d59','#757761','#7e8069','#898871','#939078'];
const sand=['#9d8d6b','#a79774','#b3a17b','#bdad84','#c8b78d'];
const trail=['#8d724d','#9c7d52','#a98858','#b89460','#c09d68'];
const verge=['#72754b','#7e7c4c','#8b8352','#978958','#a08e5d'];
const cobbles=['#77745f','#84816a','#91896e','#9c9379','#a59b7e'];
const greens={palette:meadow,glint:'#d5d49a48',shade:'#314b354f'};
const hollows={palette:hollow,glint:'#a9b17545',shade:'#2d463758'};
const rock={palette:slate,glint:'#c9c6a94a',shade:'#3947415f'};
const shingle={palette:gravel,glint:'#d1c4a85e',shade:'#4d514751'};
const shore={palette:sand,glint:'#e2d4aa69',shade:'#78684d45'};
const dirt={palette:trail,glint:'#dbc28b61',shade:'#664b3053'};
const shoulder={palette:verge,glint:'#c6b8874a',shade:'#4b563f53'};
const landing={palette:cobbles,glint:'#d4c6a079',shade:'#4d493a66'};
const unit=value=>Math.max(0,Math.min(1,value));

function hash(x,y){
 let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967296;
}

function noise(x,y,size){
 const gx=Math.floor(x/size),gy=Math.floor(y/size);
 const dx=x/size-gx,dy=y/size-gy;
 const tx=dx*dx*(3-2*dx),ty=dy*dy*(3-2*dy);
 const a=hash(gx,gy),b=hash(gx+1,gy),c=hash(gx,gy+1),d=hash(gx+1,gy+1);
 return (a+(b-a)*tx)*(1-ty)+(c+(d-c)*tx)*ty;
}

export function greyhavenGroundIntersects(left,top,right,bottom){
 return right>=bounds.left&&left<=bounds.right&&bottom>=bounds.top&&top<=bounds.bottom;
}

function materialAt(x,y,edge,path){
 const texture=noise(x,y,75),relief=noise(x,y,245);
 let warmApproach=false;
 if(x>16810&&x<17900&&y>1980&&y<2370){
  const approach=greyhavenApproachDistance(x,y),ragged=noise(x,y,19);
  const width=26+10*relief+8*texture+6*ragged;
  const lip=55-Math.max(0,y-2198)*1.18;
  if(y>=2159&&y<2231&&Math.abs(x-17840)<lip+8*(texture-.5)&&approach<width+10)return landing;
  warmApproach=approach<52&&x>16890+(1-texture)*115;
  if(warmApproach&&approach<width)return dirt;
  if(warmApproach&&approach<width+3+5*ragged)return shoulder;
 }
 if(!warmApproach&&path<36+8*Math.sin(x*.058-y*.074)&&edge>27)return null;
 const envelope=((x-17740)/1085)**2+((y-1705)/1000)**2;
 if(envelope>.94+.19*relief+.11*texture)return null;

 // Gravel follows the coast in broad lobes, with slate exposed along the ridges.
 const northBank=unit((18300-x)/150)*unit((1460-y)/240);
 const gravelEdge=65+142*relief+47*texture-30*northBank;
 if(edge<27+23*texture)return shore;
 if(edge<gravelEdge){
  if(edge>gravelEdge-82&&relief+texture*.45>.8)return rock;
  return shingle;
 }
 if(relief*.78+texture*.30>.77)return rock;
 if(relief*.76+texture*.34<.46)return hollows;
 return greens;
}

function cobbleTone(x,y){
 const row=Math.floor(y/12),offset=x+(row%2)*8;
 const col=Math.floor(offset/16),along=offset-col*16,down=y-row*12;
 if(down<3||along<3)return '#726e59';
 const tone=Math.floor(hash(col,row)*4);
 return cobbles[down<7?Math.min(4,tone+1):tone];
}

export function greyhavenGroundSample(x,y,edge,path,details=false){
 if(!greyhavenGroundIntersects(x,y,x,y))return null;
 const material=materialAt(x,y,edge,path);
 if(!material)return null;
 const grain=hash(x>>2,y>>2),flecks=noise(x,y,27);
 const variation=noise(x,y,106)*2.45+flecks*1.4+grain*.75;
 const tone=material===landing?cobbleTone(x,y):material.palette[Math.min(4,Math.floor(variation))];
 return details?{tone,glint:material.glint,shade:material.shade,grain,flecks}:tone;
}
