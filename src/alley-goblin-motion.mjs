import captain from './oathless-captain-data.mjs';
import {retargetHumanoidClip} from './native-humanoid-base.mjs';
import {ellipse,facingIndex,limb,poseAt,projectPoint,validateMotion} from './player-motion.mjs';
import {validateSprite} from './pixels.mjs';
import {paintLayers} from './render-order.mjs';
import {drawGoblinArm,drawGoblinHand,drawGoblinHead,drawGoblinTorso,goblinOutfit} from './alley-goblin-art.mjs';

const KIND='alley_goblin';
const clips=['idle','walk','run','talk','salute','guard','hurt','death'];
const stock={version:1,joints:captain.joints,clips:Object.fromEntries(clips.map(name=>[name,captain.clips[name]])),palette:captain.palette,shape:{bodyWidth:1}};

function buildGoblinMotion(){
 const model={version:1,type:KIND,name:'Alley goblin / short humanoid',joints:structuredClone(stock.joints),
  clips:{},palette:{...stock.palette,head:'#738653',body:'#50586d',arms:'#738653',legs:'#424956'},shape:{...stock.shape},
  boneSprites:{},renderOrder:{}};
 for(const [name,joint]of Object.entries(model.joints)){
  const [x,y,z]=joint.position;
  const armDrop=/^(hand|sword|shield)/.test(name)?4:/^elbow/.test(name)?1.5:0;
  const headRoom=/^(head|ear|eye|nose|mouth|hair)/.test(name)?2.2:0;
  joint.position=[x*.92,y*.88,z*.71-armDrop+headRoom];
 }
 const restGround=Math.min(model.joints.footL.position[2],model.joints.footR.position[2]);
 for(const joint of Object.values(model.joints))joint.position[2]-=restGround;
 for(const [name,source]of Object.entries(stock.clips)){
  const clip=retargetHumanoidClip(captain,model,source);
  if(name==='walk'||name==='run')for(const frame of clip.keys){
   const lowest=Math.min(...['footL','footR'].map(foot=>model.joints[foot].position[2]+frame.joints[foot][2]));
   if(lowest<0)for(const v of Object.values(frame.joints))v[2]-=lowest;
  }
  model.clips[name]=clip;
 }
 return model;
}

const defaults=buildGoblinMotion();
export const defaultAlleyGoblinMotion=()=>structuredClone(defaults);
export const alleyGoblinMotion=defaultAlleyGoblinMotion();
export function validateAlleyGoblinMotion(model){
 return model?.type===KIND&&validateMotion(model,stock)&&Object.values(model.boneSprites||{}).every(views=>views&&
  Object.entries(views).every(([d,sprite])=>Number.isInteger(+d)&&+d>=0&&+d<8&&validateSprite(sprite)&&Number.isFinite(sprite.x)&&Number.isFinite(sprite.y)));
}
export function replaceAlleyGoblinMotion(model){
 if(!validateAlleyGoblinMotion(model))throw Error('Invalid alley goblin rig');
 const copy=structuredClone(model);
 for(const key of Object.keys(alleyGoblinMotion))delete alleyGoblinMotion[key];
 Object.assign(alleyGoblinMotion,copy);
}

export function drawAlleyGoblin(c,actor,time,model=alleyGoblinMotion,suppliedPose=null){
 const requested=actor.animationAction;
 const action=actor.hp<=0?'death':actor.flash>0||actor.hit>0?'hurt':model.clips[requested]?requested:actor.moving?'walk':'idle';
 const clip=model.clips[action];
 const frame=Number.isFinite(actor.playerFrame)?actor.playerFrame:Number.isFinite(actor.poseTime)?actor.poseTime*(clip.length-1):time*clip.fps;
 const angle=facingIndex(actor.faceX,actor.faceY),role=actor.goblinRole||'banker',cloth=goblinOutfit(role);
 const pose=suppliedPose||poseAt(model,action,frame);
 const p=Object.fromEntries(Object.entries(pose).map(([name,point])=>[name,projectPoint(point,angle)]));
 const parts=[];
 const layer=(id,bone,bones,fn,depth=p[bone].depth)=>parts.push({id,bone,bones,fn,depth});
 const trousers=role==='bartender'||role==='bayou-sage'?cloth.pants:model.palette.legs;
 for(const side of ['L','R']){
  const hip='hip'+side,knee='knee'+side,foot='foot'+side,toe='toe'+side;
  const shoulder='shoulder'+side,elbow='elbow'+side,hand='hand'+side;
  const edge=p[hip].depth+.18;
  layer('Leg '+side,hip,[hip,knee,foot],()=>{
   limb(c,p[hip],p[knee],5,cloth.ink);limb(c,p[knee],p[foot],4,cloth.ink);
   limb(c,p[hip],p[knee],3.5,trousers);limb(c,p[knee],p[foot],2.6,trousers);
  },edge);
  layer('Boot '+side,foot,[foot,toe],()=>{
   limb(c,p[foot],p[toe],4.8,cloth.ink);limb(c,p[foot],p[toe],3.4,cloth.boots);
   ellipse(c,p[toe].x,p[toe].y-.55,1.6,1.05,cloth.shade);
  },edge+.1);
  const armDepth=(p[shoulder].depth+p[elbow].depth+p[hand].depth)/3;
  layer('Arm '+side,shoulder,[shoulder,elbow,hand],()=>drawGoblinArm(c,p[shoulder],p[elbow],p[hand],role,cloth),armDepth);
  layer('Hand '+side,hand,[hand],()=>drawGoblinHand(c,p[hand],side,angle),armDepth+.07);
 }
 layer('Torso / clothing','chest',['chest','pelvis','neck'],()=>drawGoblinTorso(c,p,angle,role,cloth,model.shape.bodyWidth));
 layer('Head / goblin','head',['head','earL','earR'],()=>drawGoblinHead(c,p.head,angle,role),p.head.depth+.7);
 paintLayers(parts,model,angle,c,p);
}
