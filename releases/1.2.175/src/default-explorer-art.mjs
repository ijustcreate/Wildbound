import {pixelPolygon} from './pixel-shapes.mjs';
import {skinPalette} from './human-head.mjs';
import {mixGearColor} from './gear-art.mjs';

const ink='#30262a';
const coat={body:'#3e7168',light:'#659385',shadow:'#31534f',deep:'#29413e'};
const cloth={body:'#52545d',light:'#6b7076',shadow:'#41414c',deep:'#36363f'};
const leather={body:'#79513b',light:'#a47751',shadow:'#583d34'};
const gold='#cb9656';
const brass='#e6bc78';
const explorerMaterials={coat,sleeves:coat,cloth,leather};
const baseMaterialCache=new Map();
const materialColor=color=>/^#[0-9a-f]{6}$/i.test(color||'')?color.toLowerCase():null;

function materialRamp(color,fallback){
  if(!color)return fallback;
  return {
    body:color,
    light:mixGearColor(color,'#f0d8ae',.22),
    shadow:mixGearColor(color,'#191321',.27),
    deep:mixGearColor(color,'#17141d',.48),
  };
}

export function humanoidBaseMaterials({body,arms,legs}={},shoes){
  const shirt=materialColor(body),sleeve=materialColor(arms)||shirt;
  const pants=materialColor(legs),boots=materialColor(shoes);
  if(!shirt&&!sleeve&&!pants&&!boots)return explorerMaterials;
  const key=[shirt,sleeve,pants,boots].join(':');
  let materials=baseMaterialCache.get(key);
  if(!materials){
    const jacket=materialRamp(shirt,coat);
    materials={coat:jacket,sleeves:sleeve===shirt?jacket:materialRamp(sleeve,coat),
      cloth:materialRamp(pants,cloth),leather:materialRamp(boots,leather)};
    if(baseMaterialCache.size>=128)baseMaterialCache.delete(baseMaterialCache.keys().next().value);
    baseMaterialCache.set(key,materials);
  }
  return materials;
}

const coatHalfWidth=[5.7,4.9,3.7,4.9,5.7,4.9,3.7,4.9];
const chibiCoatHalfWidth=[6.45,5.6,4.2,5.25,5.9,5.25,4.2,5.6];
const chibiDrop={
  pelvis:3.3,hipL:3.3,hipR:3.3,kneeL:1.45,kneeR:1.45,
  chest:3.75,shoulderL:3.75,shoulderR:3.75,elbowL:3.25,elbowR:3.25,handL:2.7,handR:2.7,
  head:4,eyeL:4,eyeR:4,earL:4,earR:4,nose:4,mouth:4,
};

// Keep the original animation and the feet's world contacts. The shorter
// legs and torso are a projection of the posed explorer for drawing only.
export function fitDefaultExplorerPose(positions,points){
  const fitted={...positions};
  for(const [joint,drop] of Object.entries(chibiDrop)){
    const [x,y,z]=positions[joint];
    fitted[joint]=[x,y,z-drop];
    if(points)points[joint]={...points[joint],y:points[joint].y+drop};
  }
  const extend=(shoulder,value)=>shoulder+(value-shoulder)*1.1;
  for(const side of ['L','R']){
    const shoulder='shoulder'+side;
    for(const joint of ['elbow'+side,'hand'+side]){
      fitted[joint]=fitted[joint].map((value,index)=>extend(fitted[shoulder][index],value));
      if(points){
        const anchor=points[shoulder],point=points[joint];
        points[joint]={...point,x:extend(anchor.x,point.x),y:extend(anchor.y,point.y),depth:extend(anchor.depth,point.depth)};
      }
    }
  }
  return fitted;
}

const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const xy=({x,y})=>[x,y];
const poly=(c,points,color)=>pixelPolygon(c,points.map(([x,y])=>({x,y})),color);

// Pose-local coordinates keep the art on the same joints through the whole gait.
function axis(a,b){
  const dx=b.x-a.x,dy=b.y-a.y,raw=Math.hypot(dx,dy),length=Math.max(1,raw);
  const ux=raw?dx/raw:0,uy=raw?dy/raw:1;
  return {length,point:(along,cross)=>[a.x+along*ux+cross*uy,a.y+along*uy-cross*ux]};
}

function band(c,frame,from,to,halfStart,halfEnd,color,offset=0){
  if(to<=from)return;
  const p=frame.point;
  poly(c,[p(from,offset-halfStart),p(from,offset+halfStart),p(to,offset+halfEnd),p(to,offset-halfEnd)],color);
}

function nearer(points,joint,side){
  const other=side==='L'?'R':'L';
  return points[joint+side].depth>=points[joint+other].depth-.6;
}

export function drawDefaultExplorerTorso(c,p,d,skin,chibi=false,materials=explorerMaterials,widthScale=1,stripe){
  const {coat}=materials;
  const side=d===2||d===6,back=d>=3&&d<=5;
  const width=(chibi?chibiCoatHalfWidth:coatHalfWidth)[d]*widthScale;
  const waist=width*(chibi?.77:.72);
  const shoulderShift=chibi&&d===5?Math.max(-.65,Math.min(.65,(p.pelvis.x-p.chest.x)*.55)):0;
  const chest=shoulderShift?{x:p.chest.x+shoulderShift,y:p.chest.y}:p.chest;
  const frame=axis(chest,p.pelvis),at=frame.point;
  const end=Math.max(5,frame.length),shift=side?0:d===1||d===3?-.7:d===5||d===7?.7:0;
  const skinTones=skinPalette(skin);
  band(c,axis(p.chest,p.head),-.3,3.7,2.5,1.9,skinTones.shadow);
  poly(c,[at(-2,-width+1),at(-2,width-1),at(-.8,width+.2),at(1.9,width),at(end-1,waist),at(end+1.8,waist+.9),at(end+2,0),at(end+1.8,-waist-.9),at(end-1,-waist),at(1.9,-width),at(-.8,-width-.2)],ink);
  poly(c,[at(-1.2,-width+1.1),at(-1.2,width-1.1),at(.4,width-.6),at(2.3,width-.8),at(end-1,waist-.6),at(end+1,waist+.1),at(end+1.2,-waist-.1),at(end-1,-waist+.6),at(1.8,-width+.8)],coat.body);
  poly(c,[at(0,-width+.9),at(.7,-.3+shift),at(end-2.2,-1.3+shift),at(end-.8,-waist+.7),at(2,-width+.7)],coat.light);
  poly(c,[at(.6,width-.65),at(end-1,waist-.45),at(end+1.2,waist),at(end+1.2,-waist+.2),at(end-.4,.35+shift),at(2,width*.48)],coat.shadow);

  const stripeColor=materialColor(stripe);
  if(stripeColor){
    for(const t of [.31,.68]){
      const y=end*t,half=width*(.77-t*.16);
      band(c,frame,y-1,y+1,half,half-.16,stripeColor);
    }
  }

  if(chibi&&back){
    const center=Math.max(-.8,Math.min(.8,(p.head.x-chest.x)*.55));
    const top=d===3?-3.2:-3.55;
    // The raised collar slopes into the jacket yoke to keep a single shoulder surface.
    poly(c,[at(top,center-2.3),at(top,center+2.3),at(top+.75,center+3),at(-.8,width-.42),at(.55,width-.75),at(1.85,center),at(.35,-width+.75),at(-.9,-width+.45),at(top+.7,center-3)],coat.deep);
    poly(c,[at(top+.4,center-2.1),at(top+.4,center+2.1),at(top+1.05,center+2.7),at(-.35,width-.9),at(.44,width-1.1),at(1.27,center),at(.25,-width+1.15),at(-.5,-width+.9),at(top+1.05,center-2.7)],coat.body);
    band(c,frame,top+.35,top+1.3,1.6,2,leather.light,center);
  }else if(back){
    poly(c,[at(-1.4,-width+.8),at(-1.4,width-.8),at(.5,width*.54),at(1.6,0),at(.5,-width*.54)],coat.deep);
    band(c,frame,-1.5,-.5,width*.57,width*.42,leather.light);
  }else{
    const center=side?(d===2?-1.8:1.8):shift;
    poly(c,[at(-1.7,center-2.15),at(-1.7,center+2.15),at(.6,center+1.4),at(2.4,center),at(.1,center-1.5)],coat.deep);
    poly(c,[at(-1.1,center-1.75),at(-1.1,center+1.75),at(1.65,center)],gold);
    band(c,frame,2,end-.65,.65,.55,coat.deep,center);
  }

  // A wide, warm belt separates the teal jacket from the dark trousers.
  band(c,frame,end-1,end+1,waist,waist+.2,leather.shadow);
  band(c,frame,end-1,end,waist-.5,waist-.3,gold);
  if(!back){
    const buckle=side?(d===2?-1.6:1.6):shift;
    band(c,frame,end-1.2,end+.95,1.05,1.05,leather.body,buckle);
    band(c,frame,end-1.1,end+.1,.65,.65,brass,buckle);
  }
}

export function drawDefaultExplorerPelvis(c,p,d,chibi=false,materials=explorerMaterials,widthScale=1){
  const {cloth}=materials;
  const breadth=((d===2||d===6?2.35:d===0||d===4?4.2:3.2)+(chibi?.45:0))*widthScale;
  const frame=axis(p.chest,p.pelvis),at=frame.point,end=frame.length;
  const backThigh=chibi&&d===5?.55:0;
  poly(c,[at(end,-breadth),at(end,breadth),at(end+3,breadth-.5),at(end+3.8,0),at(end+3,-breadth+.5-backThigh)],ink);
  poly(c,[at(end,-breadth+.65),at(end,breadth-.65),at(end+2.6,breadth-1),at(end+3,0),at(end+2.6,-breadth+1-backThigh)],cloth.shadow);
}

export function drawDefaultExplorerArm(c,p,side,skin,part,chibi=false,direction,materials=explorerMaterials){
  const {sleeves}=materials;
  const shoulder=p['shoulder'+side],elbow=p['elbow'+side],hand=p['hand'+side];
  const upper=axis(shoulder,elbow),lower=axis(elbow,hand);
  const near=nearer(p,'shoulder',side),tones=skinPalette(skin);
  const rear=chibi&&direction>=3&&direction<=5;
  const sleeveEdge=rear?sleeves.deep:ink;
  const cuff=lower.length*.69;
  if(part!=='lower'){
    band(c,upper,rear?-.5:-.9,upper.length+1,rear?1.98:2.3,2.05,sleeveEdge);
    band(c,upper,rear?-.45:-.65,upper.length+.6,rear?1.53:1.7,1.45,near?sleeves.body:sleeves.shadow);
    band(c,upper,-.55,upper.length*.55,.9,.65,near?sleeves.light:sleeves.body,-.48);
  }
  if(part!=='upper'){
    band(c,lower,-.72,cuff+.48,1.95,1.75,sleeveEdge);
    band(c,lower,-.7,cuff,1.45,1.16,near?sleeves.body:sleeves.shadow);
    band(c,lower,cuff-.7,cuff+.48,1.55,1.47,near?gold:leather.light);
    band(c,lower,cuff+.45,lower.length+1.15,1.52,1.25,ink);
    band(c,lower,cuff+.5,lower.length+.6,1.08,.93,near?tones.base:tones.shadow);
  }
}

export function drawDefaultExplorerLeg(c,p,side,chibi=false,direction,materials=explorerMaterials){
  const {cloth}=materials;
  const hip=p['hip'+side],knee=p['knee'+side],foot=p['foot'+side];
  const thigh=axis(hip,knee),shin=axis(knee,foot),near=nearer(p,'hip',side);
  const southwest=chibi&&direction===1;
  const northeast=chibi&&direction===5;
  const east=chibi&&direction===6;
  const kneeWidth=southwest?.32:northeast?.22:0;
  const innerSide=southwest?Math.sign(p['knee'+(side==='L'?'R':'L')].x-knee.x)*.23:0;
  const hem=Math.max(.9,shin.length-(east?.7:1.8));
  band(c,thigh,-1.25,thigh.length+.75,2.5+kneeWidth,2.15+kneeWidth,ink,innerSide);
  band(c,shin,-.9,hem,2.04+kneeWidth,1.72,ink,innerSide);
  band(c,thigh,-.75,thigh.length+.6,1.95+kneeWidth,1.4+kneeWidth,near?cloth.body:cloth.shadow,innerSide);
  band(c,shin,-.72,hem-.25,1.43+kneeWidth,1.1,near?cloth.body:cloth.shadow,innerSide);
  band(c,thigh,0,thigh.length*.8,1.12,.81,near?cloth.light:cloth.body,-.48);
  band(c,shin,.25,hem-.8,.67,.5,near?cloth.light:cloth.deep,-.42);
}

function drawEastExplorerBoot(c,x,y,tx,near,leather){
  const heel=x-2.55,tip=tx+2.15;
  poly(c,[[heel+.35,y-3.2],[x+1.45,y-3.2],[x+1.8,y-1.55],[tip-.85,y-1.2],[tip,y-.45],[tip-.2,y+1.95],[heel+.2,y+1.95],[heel,y-.8]],ink);
  poly(c,[[heel+.65,y-2.7],[x+1.05,y-2.7],[x+1.2,y-.85],[tip-1.1,y-.65],[tip-.55,y+.05],[tip-.55,y+1],[heel+.6,y+1],[heel+.55,y-.7]],near?leather.body:leather.shadow);
  poly(c,[[heel+.65,y-2.7],[x+.15,y-2.7],[x+.35,y-.45],[heel+.65,y-.25]],near?leather.light:leather.body);
  poly(c,[[x+1.2,y-.65],[tip-1.1,y-.65],[tip-.55,y+.05],[tip-.6,y+.65],[x+1.2,y+.65]],near?leather.light:leather.body);
}

export function drawDefaultExplorerBoot(c,foot,toe,near,chibi=false,direction,materials=explorerMaterials){
  const {leather}=materials;
  // This part is painted in the existing ankle/boot transform.
  const x=Math.round(foot.x),y=Math.round(foot.y),tx=Math.round(toe.x);
  if(chibi&&direction===6){drawEastExplorerBoot(c,x,y,tx,near,leather);return;}
  const left=toe.x<foot.x-.6,right=toe.x>foot.x+.6;
  const heelWidth=chibi?2.55:2.1,toeWidth=chibi?2.15:1.8;
  const heelLeft=x-heelWidth,heelRight=x+heelWidth;
  const frontLeft=left?tx-toeWidth:heelLeft,frontRight=right?tx+toeWidth:heelRight;
  const heel=[x,y-2.1],front=[(frontLeft+frontRight)*.5,y+.6];
  poly(c,[[heelLeft+.45,y-3.2],[heelRight-.45,y-3.2],[heelRight,y-1.45],[frontRight,y-.25],[frontRight-.2,y+1.95],[frontLeft+.2,y+1.95],[frontLeft,y-.25],[heelLeft,y-1.45]],ink);
  poly(c,[[heelLeft+.65,y-2.7],[heelRight-.65,y-2.7],[heelRight-.5,y-.9],[frontRight-.55,y+.12],[frontRight-.55,y+1],[frontLeft+.55,y+1],[frontLeft+.55,y+.12],[heelLeft+.5,y-1]],near?leather.body:leather.shadow);
  poly(c,[mix(heel,front,.5),[frontRight-.65,y-.4],[frontRight-.55,y+.62],[frontLeft+.73,y+.62],[frontLeft+.65,y-.16]],near?leather.light:leather.body);
}
