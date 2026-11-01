// Native, editor-editable construct and humanoid creature pack.
// Motion in this pack is Wildbound-authored; it is not presented as a verified
// Wowhead animation transfer. See motionNotes below for each source limitation.
import { defaultCreatureMotion } from '../creature-motion.mjs';
import { defaultSkeletonMotion } from '../skeleton-motion.mjs';
import { defaultSuccubusMotion } from '../succubus-motion.mjs';
import { poseAt, projectPoint, facingIndex, ellipse } from '../player-motion.mjs';
import { pixelLine, pixelPolygon, pixelVolume } from '../pixel-shapes.mjs';
import { paintLayers } from '../render-order.mjs';
import { spawnParticleEffect } from '../particles.mjs';

const HUMANOID_JOINTS = [
  'pelvis','chest','neck','head','jaw','eyeL','eyeR','shoulderL','elbowL','handL',
  'shoulderR','elbowR','handR','hipL','kneeL','footL','hipR','kneeR','footR',
];
const palettes = {
  blaise: {body:'#d85229',shade:'#7d302b',light:'#ff963d',face:'#ffd05c',detail:'#fff2a0',eye:'#fff7d1',outline:'#482631',energy:'#ffcf58'},
  // Teal cloth, violet wrapping and warm mismatched patches distinguish the
  // pinbound effigy from the other brown humanoid constructs.
  voodoo_doll: {body:'#4d8585',shade:'#2e4e5b',light:'#8eb8ad',face:'#c9d1ae',detail:'#e0bd68',eye:'#d87967',outline:'#302b37',energy:'#c69a54'},
  enchanted_book: {body:'#754638',shade:'#3b2a33',light:'#b67b49',face:'#e8c27a',detail:'#8ed8cd',eye:'#d5fff6',outline:'#302633',energy:'#87cfc5'},
  gargoyle: {body:'#818c89',shade:'#4c5354',light:'#c1baa6',face:'#d5ccb5',detail:'#b97559',eye:'#ffbd70',outline:'#343a40',energy:'#d79863'},
  crystal_golem: {body:'#5789a7',shade:'#294a67',light:'#91d3e1',face:'#c1eeea',detail:'#74b9dc',eye:'#f5fbce',outline:'#233b55',energy:'#72e5df'},
  skeleton_deckhand: {body:'#d2c8a6',shade:'#837e69',light:'#eee4c0',face:'#f0dfae',detail:'#70423a',eye:'#f3b45c',outline:'#34333a',energy:'#83c8c1'},
  ogre: {body:'#b8744d',shade:'#754637',light:'#df9a64',face:'#edbd84',detail:'#513b36',eye:'#f5d36d',outline:'#3b292b',energy:'#e4a14f'},
  // J'imothy is a dusk-gray raccoon, not a moss-colored humanoid. Keep the
  // warm muzzle and small amber eye accents while moving the large color mass
  // into the charcoal/taupe fur ramp visible in the source model.
  jimothy: {body:'#77716b',shade:'#48464a',light:'#b1a99a',face:'#e1d6c2',detail:'#292a31',eye:'#f5d27a',outline:'#292a31',energy:'#b8c59a'},
  mindflayer: {body:'#66516f',shade:'#332e4c',light:'#a58e9d',face:'#c9a5a5',detail:'#6b718f',eye:'#f2d36f',outline:'#28263e',energy:'#db8ed7'},
  succubus_2: {body:'#9a4055',shade:'#512b42',light:'#d36b73',face:'#edc3b0',detail:'#3b314d',eye:'#ffcf79',outline:'#30263a',energy:'#ed86ac'},
  mana_golem: {body:'#3e7e91',shade:'#224559',light:'#71bfbd',face:'#b5e7d5',detail:'#9a8ed0',eye:'#eaffd7',outline:'#213645',energy:'#79f2db'},
  enchanted_broom: {body:'#93613e',shade:'#543c33',light:'#c08b4e',face:'#e3c777',detail:'#6bb4ab',eye:'#ecf6be',outline:'#302b35',energy:'#7be0d0'},
  forest_golem: {body:'#657b49',shade:'#354c35',light:'#9baa60',face:'#c5bd79',detail:'#638b51',eye:'#f2cf69',outline:'#2b3a31',energy:'#a9df79'},
};

const specList = [
  ['blaise','Blaise / fire elemental','fire_elemental','elemental',{hp:138,speed:54,damage:15,attackRange:86,windup:.72,recovery:1.15},{fireball:true,fireTrail:true,ranged:true},'Coals in the rain',3],
  ['voodoo_doll','Voodoo doll / pinbound haunt','golem','humanoid',{hp:86,speed:48,damage:12,attackRange:58,windup:.8,recovery:1.1},{melee:true,curse:true},'A stitch in the dark',3],
  ['enchanted_book','Enchanted book / page storm','golem','book',{hp:72,speed:45,damage:11,attackRange:185,windup:.78,recovery:1.2},{ranged:true,pageVolley:true},'The book opens itself',3],
  ['gargoyle','Gargoyle / roof sentinel','golem','winged',{hp:128,speed:58,damage:17,attackRange:64,windup:.9,recovery:1.35},{melee:true,glide:true,dive:true},'Stone wings at dusk',3],
  ['crystal_golem','Crystal golem / shardbound','golem','heavy',{hp:248,speed:35,damage:24,attackRange:68,windup:1.05,recovery:1.45},{melee:true,shardBurst:true},'The heart of the geode',2],
  ['skeleton_deckhand','Dead deckhand / tideworn skeleton','skeleton','humanoid',{hp:92,speed:61,damage:13,attackRange:56,windup:.62,recovery:.9},{melee:true,cutlass:true},'The drowned crew returns',3],
  ['ogre','Ogre / club bruiser','golem','heavy',{hp:236,speed:39,damage:23,attackRange:74,windup:1.08,recovery:1.4},{melee:true,clubSlam:true},'Garrlok’s toll',2],
  ['jimothy','J’imothy / mossback oddling','golem','humanoid',{hp:104,speed:69,damage:12,attackRange:62,windup:.68,recovery:.95},{melee:true,feint:true},'A name from the thicket',2],
  ['mindflayer','Mindflayer / psionic lurker','golem','humanoid',{hp:168,speed:45,damage:16,attackRange:205,windup:.88,recovery:1.25},{ranged:true,psionicPulse:true},'A thought beneath the floor',2],
  ['succubus_2','Ashwing succubus / second form','golem','winged',{hp:164,speed:63,damage:17,attackRange:126,windup:.7,recovery:1.1},{ranged:true,melee:true,heartBolt:true,glide:true},'Two shadows, one smile',2],
  ['mana_golem','Mana golem / arcane vessel','golem','heavy',{hp:224,speed:41,damage:18,attackRange:190,windup:.94,recovery:1.2},{ranged:true,arcBolt:true,melee:true},'The vessel remembers',2],
  ['enchanted_broom','Enchanted broom / flying sweeper','golem','broom',{hp:68,speed:92,damage:10,attackRange:70,windup:.62,recovery:.82},{melee:true,fly:true,sweep:true},'The broom takes offense',2],
  ['forest_golem','Forest golem / rootbound guardian','golem','heavy',{hp:206,speed:37,damage:19,attackRange:76,windup:1,recovery:1.35},{melee:true,rootSnare:true},'The old roots stand up',2],
];
const specs=Object.fromEntries(specList.map(([kind,name,baseKind,form,stats,behaviors,eventName,eventCount])=>[kind,{kind,name,baseKind,form,stats,behaviors,eventName,eventCount}]));

const extraJoints = {
  blaise:{flameCrown:['head',0,3,48],core:['chest',0,5,24],flameL:['chest',-6,2,0],flameR:['chest',6,2,0]},
  voodoo_doll:{patchL:['chest',-5,7,24],patchR:['chest',5,0,24],needle:['chest',0,4,0]},
  gargoyle:{wingRootL:['chest',-7,1,28],wingTipL:['wingRootL',-24,0,23],wingRootR:['chest',7,1,28],wingTipR:['wingRootR',24,0,23],hornL:['head',-5,1,0],hornR:['head',5,1,0],tailTip:['pelvis',0,-17,14]},
  // Keep the geode plates seated into the shoulders/head instead of orbiting
  // outside the silhouette. Their art is drawn from the same anchors below.
  crystal_golem:{crystalCore:['chest',0,7,0],crystalL:['shoulderL',0,1,0],crystalR:['shoulderR',0,1,0],crystalHead:['head',0,0,0]},
  skeleton_deckhand:{bandana:['head',0,0,40],cutlassTip:['handR',0,14,10],coatHem:['pelvis',0,-3,9]},
  ogre:{tuskL:['head',-5,9,27],tuskR:['head',5,9,27],clubBase:['handR',3,3,9],clubTip:['clubBase',3,13,9],belly:['chest',0,6,18]},
  jimothy:{cap:['head',0,0,39],nose:['head',0,9,30],charm:['handL',0,1,0],tailBase:['pelvis',0,-7,10],tailMid:['tailBase',0,-7,1],tailTip:['tailMid',0,-8,-3]},
  mindflayer:{hood:['head',0,0,0],jaw:['head',0,5,24],tentacle0:['jaw',-4,6,18],tentacle1:['jaw',-1.5,8,17],tentacle2:['jaw',1.5,8,17],tentacle3:['jaw',4,6,18],eyeThird:['head',0,4,0]},
  succubus_2:{hornL:['head',-5,1,0],hornR:['head',5,1,0],wingRootL:['chest',-8,0,29],wingTipL:['wingRootL',-22,1,20],wingRootR:['chest',8,0,29],wingTipR:['wingRootR',22,1,20],tailBase:['pelvis',0,-10,15],tailTip:['tailBase',0,-19,12]},
  mana_golem:{core:['chest',0,6,26],runeL:['shoulderL',0,0,17],runeR:['shoulderR',0,0,17],orbitL:['chest',-7,3,7],orbitR:['chest',7,3,7]},
  forest_golem:{branchL:['head',-6,0,37],branchR:['head',6,0,37],leafL:['branchL',-4,1,42],leafR:['branchR',4,1,42],rootL:['footL',0,2,1],rootR:['footR',0,2,1],mossCore:['chest',0,5,25]},
};

// J'imothy's supplied model is a stocky four-footed raccoon. Reuse the
// editable creature motion channels, but register the torso and limbs low and
// lengthwise so the rendered creature no longer inherits a biped silhouette.
const JIMOTHY_FOUR_FOOTED_POSE = {
  pelvis:[0,-7,14],chest:[0,1,16],head:[0,12,15],
  shoulderL:[-6,3,11],elbowL:[-8,6,6],handL:[-8,9,1],
  shoulderR:[6,3,11],elbowR:[8,6,6],handR:[8,9,1],
  hipL:[-5,-9,10],kneeL:[-7,-13,6],footL:[-7,-16,1],
  hipR:[5,-9,10],kneeR:[7,-13,6],footR:[7,-16,1],
  earL:[-6,12,17],earR:[6,12,17],eyeL:[-2,18,17],eyeR:[2,18,17],
  muzzle:[0,19,13],cap:[0,12,19],nose:[0,20,14],charm:[-8,9,1],
  tailBase:[0,-13,14],tailMid:[0,-19,13],tailTip:[0,-25,12],
};

function clone(value){return structuredClone(value);}
function addJoint(model,name,[parent,x,y,z]){model.joints[name]={parent,position:[x,y,z]};model.visibility[name]=Array(8).fill(true);}
function customClip(model,action,phaseFn,{loop=false,fps=10}={}){
  const names=Object.keys(model.joints);
  const keys=Array.from({length:9},(_,frame)=>{
    const t=frame/8,phase=t*Math.PI*2,joints=Object.fromEntries(names.map(n=>[n,[0,0,0]]));
    phaseFn({t,phase,frame,joints,model});
    return {frame,joints};
  });
  model.clips[action]={length:9,fps,loop,keys};
}
function buildMotion(kind){
  const s=specs[kind];
  let model=s.baseKind==='skeleton'?defaultSkeletonMotion('skeleton'):s.baseKind==='succubus'?defaultSuccubusMotion():defaultCreatureMotion(s.baseKind);
  model=clone(model);model.type=kind;model.name=s.name;model.palette={...model.palette,...palettes[kind]};
  model.shape={...(model.shape||{}),bodyWidth:kind==='jimothy'?18:kind==='mana_golem'?14:kind==='crystal_golem'?16:kind==='voodoo_doll'?14:kind==='gargoyle'?17:s.form==='heavy'?19:s.form==='broom'?5:14,headRadius:kind==='mindflayer'?8:kind==='mana_golem'?7:kind==='voodoo_doll'||kind==='jimothy'||kind==='gargoyle'?7:s.form==='heavy'?8:s.form==='book'?4:6,limbWidth:kind==='mana_golem'?5:kind==='crystal_golem'?5:kind==='voodoo_doll'?3:kind==='gargoyle'?5:kind==='blaise'?5:s.form==='heavy'?7:4,tailWidth:kind==='forest_golem'?5:kind==='jimothy'?7:3};
  model.artRevision=1;model.pixelPartRenderer='constructs-native-v1';
  model.motionNotes={source:'Wildbound-authored motion built on existing '+s.baseKind+' rig family',wowheadDonor:'not yet verified or imported; supplied Wowhead model page is a visual/motion reference only'};
  for(const [name,joint] of Object.entries(extraJoints[kind]||{}))addJoint(model,name,joint);
  if(kind==='jimothy')for(const [name,position] of Object.entries(JIMOTHY_FOUR_FOOTED_POSE))if(model.joints[name])model.joints[name].position=position;
  if(kind==='enchanted_book'){
    model.joints={
      root:{parent:'',position:[0,0,14]},spine:{parent:'root',position:[0,0,19]},coverL:{parent:'spine',position:[-8,0,20]},coverR:{parent:'spine',position:[8,0,20]},
      pages:{parent:'spine',position:[0,1,21]},cornerL:{parent:'coverL',position:[-10,0,22]},cornerR:{parent:'coverR',position:[10,0,22]},eyeL:{parent:'pages',position:[-2,1,0]},eyeR:{parent:'pages',position:[2,1,0]},
    };
    model.visibility=Object.fromEntries(Object.keys(model.joints).map(n=>[n,Array(8).fill(true)]));
    model.shape={bodyWidth:12,headRadius:4,limbWidth:2,coverThickness:3,pageWidth:10};
  }
  if(kind==='enchanted_broom'){
    model.joints={
      root:{parent:'',position:[0,0,21]},handleBase:{parent:'root',position:[0,-3,20]},handleTip:{parent:'handleBase',position:[0,-22,20]},bristles:{parent:'handleTip',position:[0,0,0]},ribbon:{parent:'handleBase',position:[2,3,22]},eyeL:{parent:'bristles',position:[-2,1,0]},eyeR:{parent:'bristles',position:[2,1,0]},
    };
    model.visibility=Object.fromEntries(Object.keys(model.joints).map(n=>[n,Array(8).fill(true)]));
    model.shape={bodyWidth:5,headRadius:3,limbWidth:2,handleLength:24,bristleWidth:12};
  }
  // Purpose-built editor clips retain full, editable per-joint key data.
  customClip(model,'idle',({phase,joints})=>{
    const bob=Math.sin(phase)*.55;
    for(const n of HUMANOID_JOINTS)if(joints[n])joints[n][2]=bob;
    for(const n of ['wingTipL','wingTipR'])if(joints[n])joints[n][2]=Math.sin(phase)*1.5;
    for(const n of ['flameCrown','flameL','flameR','leafL','leafR'])if(joints[n])joints[n][0]=Math.sin(phase+ n.length)*1.2;
    if(joints.coverL)joints.coverL[0]=Math.sin(phase)*1.1;
    if(joints.coverR)joints.coverR[0]=-Math.sin(phase)*1.1;
    if(joints.bristles)joints.bristles[0]=Math.sin(phase)*1.2;
    if(joints.tailTip)joints.tailTip[0]=Math.sin(phase)*2;
  },{loop:true});
  customClip(model,'walk',({phase,joints})=>{
    const stride=Math.sin(phase)*3.3;
    for(const [side,sgn]of[['L',1],['R',-1]]){
      if(joints['foot'+side])joints['foot'+side][1]=stride*sgn;
      if(joints['knee'+side])joints['knee'+side][1]=stride*sgn*.55;
      if(joints['hand'+side])joints['hand'+side][1]=-stride*sgn*.55;
      if(joints['elbow'+side])joints['elbow'+side][1]=-stride*sgn*.3;
    }
    for(const n of ['pelvis','chest','head'])if(joints[n])joints[n][2]=Math.abs(Math.cos(phase))*1.1;
    for(const n of ['wingTipL','wingTipR'])if(joints[n])joints[n][2]=Math.sin(phase)*3;
    if(joints.tailTip)joints.tailTip[0]=Math.sin(phase)*4;
    if(joints.handleTip)joints.handleTip[0]=Math.sin(phase)*2;
  },{loop:true});
  customClip(model,'run',({phase,joints})=>{
    const stride=Math.sin(phase)*5.2;
    for(const [side,sgn]of[['L',1],['R',-1]]){
      if(joints['foot'+side])joints['foot'+side][1]=stride*sgn;
      if(joints['knee'+side])joints['knee'+side][1]=stride*sgn*.7;
      if(joints['hand'+side])joints['hand'+side][1]=-stride*sgn*.65;
      if(joints['elbow'+side])joints['elbow'+side][1]=-stride*sgn*.4;
    }
    for(const n of ['pelvis','chest','head'])if(joints[n])joints[n][2]=Math.abs(Math.cos(phase))*1.8;
    for(const n of ['wingTipL','wingTipR'])if(joints[n])joints[n][2]=Math.sin(phase)*7;
    if(joints.tailTip)joints.tailTip[0]=Math.sin(phase)*6;
  },{loop:true,fps:12});
  customClip(model,'windup',({t,joints})=>{
    for(const n of ['chest','pelvis'])if(joints[n])joints[n][2]=-t*2;
    if(joints.handR)joints.handR[2]=t*3;
    if(joints.head)joints.head[1]=-t*2;
    if(joints.wingTipL)joints.wingTipL[2]=t*5;
    if(joints.wingTipR)joints.wingTipR[2]=t*5;
    if(joints.coverL)joints.coverL[0]=t*10;
    if(joints.coverR)joints.coverR[0]=-t*10;
    if(joints.handleTip)joints.handleTip[0]=t*3;
  });
  customClip(model,'attack',({t,joints})=>{
    const hit=Math.sin(Math.max(0,Math.min(1,(t-.23)/.38))*Math.PI);
    if(joints.handR){joints.handR[1]=4*hit;joints.handR[2]=6*hit;}
    if(joints.elbowR)joints.elbowR[1]=2*hit;
    if(joints.head)joints.head[1]=4*hit;
    if(joints.chest)joints.chest[1]=3*hit;
    if(joints.wingTipL)joints.wingTipL[2]=4+4*hit;
    if(joints.wingTipR)joints.wingTipR[2]=4+4*hit;
    if(joints.jaw)joints.jaw[2]=-3*hit;
    if(joints.tailTip)joints.tailTip[0]=12*hit;
    if(joints.coverL)joints.coverL[0]=12*hit;
    if(joints.coverR)joints.coverR[0]=-12*hit;
    if(joints.bristles)joints.bristles[0]=8*hit;
  });
  customClip(model,'special',({t,joints})=>{
    const pulse=Math.sin(Math.max(0,Math.min(1,(t-.2)/.6))*Math.PI);
    for(const n of ['handL','handR','wingTipL','wingTipR','flameCrown','core','crystalCore','runeL','runeR','eyeThird','orbitL','orbitR','mossCore'])if(joints[n])joints[n][2]=6*pulse;
    if(joints.chest)joints.chest[2]=2*pulse;
    if(joints.head)joints.head[1]=3*pulse;
    if(joints.tentacle0)joints.tentacle0[1]=4*pulse;
    if(joints.tentacle1)joints.tentacle1[1]=5*pulse;
    if(joints.tentacle2)joints.tentacle2[1]=5*pulse;
    if(joints.tentacle3)joints.tentacle3[1]=4*pulse;
    if(joints.pages)joints.pages[2]=4*pulse;
  });
  customClip(model,'recover',({t,joints})=>{
    const settle=1-t;
    if(joints.chest)joints.chest[2]=-2*settle;
    if(joints.handR)joints.handR[2]=-2*settle;
    if(joints.wingTipL)joints.wingTipL[2]=2*settle;
    if(joints.wingTipR)joints.wingTipR[2]=2*settle;
  });
  customClip(model,'hurt',({t,joints})=>{
    const recoil=Math.sin(t*Math.PI);
    if(joints.chest)joints.chest[1]=-4*recoil;
    if(joints.head)joints.head[1]=-3*recoil;
    if(joints.handL)joints.handL[0]=-2*recoil;
    if(joints.handR)joints.handR[0]=2*recoil;
  });
  customClip(model,'death',({t,joints})=>{
    if(joints.pelvis)joints.pelvis[2]=-10*t;
    if(joints.chest)joints.chest[2]=-7*t;
    if(joints.head)joints.head[1]=2*t;
    if(joints.handL)joints.handL[1]=-4*t;
    if(joints.handR)joints.handR[1]=4*t;
    if(joints.wingTipL)joints.wingTipL[2]=-13*t;
    if(joints.wingTipR)joints.wingTipR[2]=-13*t;
    if(joints.coverL)joints.coverL[0]=8*t;
    if(joints.coverR)joints.coverR[0]=-8*t;
    if(joints.handleTip)joints.handleTip[2]=-6*t;
  });
  return model;
}

const models=Object.fromEntries(Object.keys(specs).map(kind=>[kind,buildMotion(kind)]));
function mix(a,b,t){return a.map((v,i)=>v*(1-t)+b[i]*t);}
function blitVolume(c,pose,a,b,t,rx,ry,rz,d,palette){pixelVolume(c,mix(pose[a],pose[b],t),rx,ry,rz,d,palette);}
function drawConstruct(c,actor,time,model,providedPose=null){
  const kind=model?.type||actor.kind||actor.sprite,s=specs[kind];if(!s)return null;
  const d=facingIndex(actor.faceX,actor.faceY),clip=actor.animationAction||((actor.attack||0)>0?'attack':actor.moving?'walk':'idle');
  const frame=actor.poseFrame??actor.playerFrame??time*(model.clips[clip]?.fps||10),pose=providedPose||poseAt(model,clip,frame);
  const p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),pal=model.palette,form=s.form,q=[];
  const add=(id,bone,fn,depth=p[bone]?.depth??0,bones=[bone])=>{if(p[bone]&&model.visibility[bone]?.[d]!==false)q.push({id,bone,bones,depth,fn});};
  const line=(a,b,w,color)=>{if(p[a]&&p[b])pixelLine(c,p[a],p[b],color,w);};
  const vol=(bone,rx,ry,rz,colors=pal)=>{if(pose[bone])pixelVolume(c,pose[bone],rx,ry,rz,d,colors);};
  const shape=(points,color)=>pixelPolygon(c,points.map(v=>projectPoint(v,d)),color);
  const screenShape=(points,color)=>pixelPolygon(c,points.map(([x,y])=>({x,y})),color);
  if(form==='book'){
    add('Book lower shadow','root',()=>{ellipse(c,p.root.x,p.root.y+20,15,4,'#1d2b2b');});
    add('Enchanted book silhouette','root',()=>{
      // Keep all cover, page and rune marks in one coherent 2D drawing pass.
      // The old independently depth-sorted X/Z planes broke into floating
      // fragments at side and diagonal facings. This keeps the book readable
      // at native scale while preserving an open, fluttering form from front.
      const a=p.root,x=Math.round(a.x),y=Math.round(a.y)+4;
      const front=d===0||d===1||d===7,side=d===2||d===6,rear=d===3||d===4||d===5;
      if(side){
        // Page block between a curved leather spine and a raised cover edge.
        screenShape([[x-6,y-13],[x+2,y-16],[x+6,y-12],[x+6,y+10],[x+2,y+14],[x-6,y+11]],pal.outline);
        screenShape([[x-3,y-11],[x+2,y-13],[x+3,y+10],[x-3,y+11]],'#f0dca4');
        screenShape([[x-6,y-13],[x-2,y-15],[x-1,y+11],[x-6,y+11]],pal.body);
        pixelLine(c,{x:x+3,y:y-9},{x:x+3,y:y+8},pal.light,1);
        c.fillStyle=pal.energy;c.fillRect(x-2,y-2,2,3);
      }else if(rear){
        // Closed rear cover: dark leather rectangle with an unmistakable
        // central clasp and a raised border.
        screenShape([[x-12,y-11],[x+10,y-13],[x+13,y-9],[x+12,y+9],[x-10,y+12],[x-13,y+8]],pal.outline);
        screenShape([[x-9,y-9],[x+8,y-11],[x+10,y-8],[x+9,y+6],[x-8,y+9],[x-10,y+6]],pal.body);
        pixelLine(c,{x:x-7,y:y-5},{x:x+7,y:y-6},pal.light,1);
        pixelLine(c,{x:x-7,y:y+5},{x:x+7,y:y+4},pal.shade,1);
        screenShape([[x-2,y-3],[x+2,y-4],[x+3,y+3],[x-1,y+4]],pal.detail);
        c.fillStyle=pal.energy;c.fillRect(x,y-1,2,2);
      }else{
        // Two broad parchment leaves, a heavy leather cover and a raised
        // center spine form a readable open-book silhouette from every
        // front diagonal. Sparse marks suggest enchanted writing at game scale.
        const flap=Math.round(Math.sin(time*4)*1);
        screenShape([[x-15,y-7],[x-3,y-12-flap],[x,y-9],[x+3,y-12+flap],[x+15,y-6],[x+14,y+9],[x+2,y+6],[x,y+9],[x-3,y+6],[x-14,y+10]],pal.outline);
        screenShape([[x-12,y-6],[x-3,y-10-flap],[x-1,y-7],[x-1,y+4],[x-12,y+7]],'#f0dca4');
        screenShape([[x+2,y-7],[x+4,y-10+flap],[x+12,y-5],[x+11,y+6],[x+2,y+4]],'#e8d59c');
        screenShape([[x-2,y-9],[x,y-10],[x+2,y-8],[x+2,y+7],[x,y+9],[x-2,y+7]],pal.body);
        pixelLine(c,{x:x-10,y:y-3},{x:x-4,y:y-5},pal.shade,1);
        pixelLine(c,{x:x-10,y:y+1},{x:x-4,y:y-1},pal.shade,1);
        pixelLine(c,{x:x+5,y:y-3},{x:x+10,y:y-1},pal.shade,1);
        pixelLine(c,{x:x+5,y:y+1},{x:x+10,y:y+3},pal.shade,1);
        // A single arcane eye/rune on the page gutter is the focal point.
        c.fillStyle=pal.outline;c.fillRect(x-1,y-3,3,5);
        c.fillStyle=pal.eye;c.fillRect(x,y-2,1,3);
        c.fillStyle=pal.energy;c.fillRect(x,y-1,1,1);
      }
    },p.root.depth+2,['root','coverL','coverR','pages','eyeL','eyeR']);
  } else if(form==='broom'){
    add('Broom bristle shadow','bristles',()=>{ellipse(c,p.bristles.x,p.bristles.y+7,10,3,'#1d2b2b');});
    add('Broom shaft','bristles',()=>{line('handleBase','bristles',6,pal.outline);line('handleBase','bristles',3,pal.body);const a=p.handleBase,b=p.bristles;pixelLine(c,{x:a.x-1,y:a.y-4},{x:b.x-1,y:b.y-2},1,pal.light);},p.bristles.depth-1,['handleBase','handleTip','bristles']);
    add('Broom bristle bundle','bristles',()=>{const b=p.bristles,x=Math.round(b.x),y=Math.round(b.y);screenShape([[x-2,y-1],[x+2,y-1],[x+10,y+10],[x-10,y+10]],pal.outline);c.fillStyle=pal.body;c.fillRect(x-2,y-2,4,3);for(let i=-7;i<=7;i+=2)c.fillRect(x+i,y+2+Math.abs(i%3),2,9-Math.abs(i)/2);c.fillStyle=pal.light;c.fillRect(x-3,y+2,2,5);});
    add('Broom binding ribbon','ribbon',()=>{line('handleBase','ribbon',4,pal.detail);c.fillStyle=pal.energy;c.fillRect(Math.round(p.ribbon.x)-2,Math.round(p.ribbon.y),4,2);});
    for(const side of ['L','R'])add('Broom spirit eye '+side,'eye'+side,()=>{const e=p['eye'+side];c.fillStyle=pal.outline;c.fillRect(Math.round(e.x)-1,Math.round(e.y)-1,3,3);c.fillStyle=pal.eye;c.fillRect(Math.round(e.x),Math.round(e.y),1,1);});
  } else {
    // Low, coherent pixel volumes share joint anchors while each creature gets
    // its own silhouette and focal details below.
    const torsoWidth=model.shape.bodyWidth,headSize=model.shape.headRadius,limbWidth=model.shape.limbWidth;
    // Blaise shares this switch for head and focal details, but not the
    // humanoid base volumes: his full flame shape is assembled below.
    if(kind!=='blaise'){
    for(const side of ['L','R']){
      const near=side==='L'?-1:1;
      for(const [upper,middle,foot,label] of [['hip','knee','foot','leg'],['shoulder','elbow','hand','arm']]){
        if(!p[upper+side]||!p[middle+side]||!p[foot+side])continue;
        const thickness=label==='leg'?limbWidth:limbWidth-1;
        add(`${s.name} ${label} ${side}`,foot+side,()=>{
          line(upper+side,middle+side,thickness+2,pal.outline);line(upper+side,middle+side,thickness,pal.body);
          line(middle+side,foot+side,thickness+2,pal.outline);line(middle+side,foot+side,Math.max(2,thickness-1),pal.shade);
          vol(foot+side,label==='leg'?3:2.5,3,2,{...pal,body:label==='leg'?pal.shade:pal.body});
        },p[foot+side].depth,[upper+side,middle+side,foot+side]);
      }
    }
    add(`${s.name} torso`,'chest',()=>{
      blitVolume(c,pose,'pelvis','chest',.48,torsoWidth*.44,9,7,d,{...pal,body:pal.body,shade:pal.shade,light:pal.light,outline:pal.outline});
      if(pose.neck)blitVolume(c,pose,'chest','neck',.28,torsoWidth*.3,5,5,d,{...pal,body:pal.light,shade:pal.body,light:pal.face,outline:pal.outline});
    },(p.pelvis.depth+p.chest.depth)/2,['pelvis','chest','neck']);
    }
    add(`${s.name} head`,'head',()=>{
      if(kind==='blaise'){
        const a=p.head,x=Math.round(a.x),y=Math.round(a.y),front=d===0||d===1||d===7,side=d===2||d===6,rear=d===3||d===4||d===5;
        // Wide luminous head fused to the body core. The outer fire crown
        // flares from the head's sides in every view instead of reading as a
        // hat above a humanoid face.
        screenShape([[x-8,y+6],[x-11,y+3],[x-11,y-2],[x-9,y-7],[x-6,y-10],[x-1,y-11],[x+5,y-9],[x+9,y-6],[x+11,y-1],[x+10,y+4],[x+6,y+8],[x,y+9],[x-5,y+8]],pal.outline);
        screenShape([[x-7,y+5],[x-9,y+2],[x-9,y-2],[x-7,y-6],[x-4,y-8],[x,y-9],[x+5,y-7],[x+8,y-4],[x+9,y],[x+8,y+4],[x+5,y+7],[x,y+8],[x-4,y+7]],pal.face);
        // Hot uneven flame lobes are connected to the crown mass; a side view
        // becomes one forward-swept lick and the rear keeps the bright fire.
        const flame=side
          ? [[x-2,y-7],[x-5,y-13],[x-1,y-11],[x+1,y-16],[x+2,y-11],[x+6,y-13],[x+5,y-7],[x+3,y-4]]
          : [[x-7,y-6],[x-10,y-12],[x-6,y-10],[x-3,y-16],[x,y-11],[x+4,y-15],[x+5,y-9],[x+9,y-11],[x+7,y-4],[x+3,y-2]];
        screenShape(flame,pal.shade);
        const flameLight=flame.map(([fx,fy],i)=>[Math.round(x+(fx-x)*.62),Math.round(y+(fy-y)*.64)+(i%2?1:0)]);
        screenShape(flameLight,pal.light);
        if(front){
          const turn=d===1?-1:d===7?1:0;
          for(const ex of [-4,4]){
            const far=turn!==0&&ex*turn<0,eyeX=x+ex+turn;
            screenShape([[eyeX-2,y-2],[eyeX-1,y-4],[eyeX+1,y-4],[eyeX+2,y-1],[eyeX+1,y+2],[eyeX-1,y+2]],pal.outline);
            c.fillStyle='#fff2a0';c.fillRect(eyeX-1,y-2,far?1:2,3);
          }
          screenShape([[x-3,y+4],[x,y+3],[x+3,y+4],[x+2,y+6],[x-2,y+6]],pal.shade);
        }else if(side){
          const ex=x+(d===2?-3:3);screenShape([[ex-2,y-2],[ex-1,y-4],[ex+2,y-3],[ex+3,y],[ex+1,y+2],[ex-1,y+1]],pal.outline);c.fillStyle='#fff2a0';c.fillRect(ex,y-2,2,3);
        }else if(rear){
          // A descending ember lobe replaces the old horizontal marks, which
          // read like a second face painted on the back of the head.
          screenShape([[x-7,y-1],[x-3,y+1],[x,y-2],[x+4,y+1],[x+7,y],[x+5,y+5],[x+1,y+7],[x-4,y+6]],pal.light);
          screenShape([[x-3,y+3],[x,y+4],[x+3,y+2],[x+2,y+6],[x,y+8],[x-2,y+6]],pal.body);
        }
      } else if(kind==='ogre'){
        const a=p.head,x=Math.round(a.x),y=Math.round(a.y),front=d===0||d===1||d===7,side=d===2||d===6,rear=d===3||d===4||d===5;
        // A wide brow, single central horn and square jaw form Garrlok's
        // recognizable one-eyed head. Profile/rear views hide the eye.
        screenShape([[x-8,y+4],[x-10,y],[x-9,y-5],[x-6,y-8],[x-1,y-9],[x+5,y-8],[x+9,y-4],[x+10,y+1],[x+7,y+5],[x+2,y+7],[x-5,y+6]],pal.outline);
        screenShape([[x-7,y+3],[x-8,y],[x-8,y-4],[x-5,y-7],[x-1,y-8],[x+4,y-7],[x+7,y-4],[x+8,y],[x+6,y+4],[x+1,y+6],[x-4,y+5]],rear?pal.shade:pal.body);
        if(!rear){
          screenShape([[x-6,y-6],[x-2,y-8],[x+3,y-7],[x+6,y-4],[x+5,y-2],[x-1,y-3],[x-6,y-2]],pal.shade);
          // One oversized cyclops eye is centered in the brow, not two human eyes.
          screenShape([[x-4,y-2],[x-3,y-4],[x+2,y-4],[x+4,y-2],[x+3,y+1],[x-3,y+1]],pal.outline);
          screenShape([[x-2,y-2],[x-1,y-3],[x+2,y-2],[x+2,y],[x-2,y]],'#f2e7c2');
          c.fillStyle=pal.eye;c.fillRect(x,y-2,2,3);c.fillStyle=pal.outline;c.fillRect(x+1,y-1,1,2);
          pixelLine(c,{x:x-3,y:y+3},{x:x+3,y:y+3},pal.shade,1);
        }else{
          pixelLine(c,{x:x-4,y:y-4},{x:x+4,y:y-4},pal.body,2);
          c.fillStyle=pal.shade;c.fillRect(x-2,y+1,4,2);
        }
        if(front||side){
          const hornX=side?(d===2?x+5:x-5):x;
          screenShape([[hornX-2,y-6],[hornX+2,y-6],[hornX+2,y-10],[hornX+1,y-13],[hornX-1,y-11],[hornX-2,y-9]],pal.outline);
          screenShape([[hornX-1,y-7],[hornX+1,y-7],[hornX+1,y-10],[hornX,y-12],[hornX-1,y-9]],pal.detail);
        }
      } else if(kind==='voodoo_doll'){
        const a=p.head,x=Math.round(a.x),y=Math.round(a.y),front=d===0||d===1||d===7,side=d===2||d===6,rear=d===3||d===4||d===5;
        // A broad, gathered cloth head with one repaired side reads as a toy
        // effigy. The lower violet binding wraps around into profile and rear.
        screenShape([[x-7,y+1],[x-8,y-2],[x-6,y-6],[x-3,y-9],[x+2,y-8],[x+6,y-5],[x+8,y-1],[x+7,y+3],[x+4,y+6],[x-2,y+7],[x-6,y+5]],pal.outline);
        screenShape([[x-6,y],[x-7,y-2],[x-5,y-5],[x-2,y-7],[x+2,y-7],[x+5,y-4],[x+7,y-1],[x+6,y+2],[x+3,y+5],[x-2,y+5],[x-5,y+4]],rear?pal.shade:pal.body);
        // Deep violet cloth turns under the toy's round head. The rear shows
        // a single tied seam, never the button face carried through the turn.
        screenShape([[x-6,y+2],[x-3,y+2],[x,y+1],[x+3,y],[x+6,y-1],[x+6,y+3],[x+3,y+5],[x-2,y+5],[x-5,y+4]],'#684b80');
        if(front||side){
          const sign=side?(d===2?-1:1):0,ex=x+(side?sign*2:0);
          // A tied bundle of straw is one uneven crown mass, not hair spikes.
          const tuft=side?[[ex-2,y-6],[ex-4,y-9],[ex-1,y-8],[ex+1,y-12],[ex+2,y-8],[ex+5,y-9],[ex+4,y-5]]:[[x-5,y-6],[x-5,y-9],[x-2,y-8],[x-1,y-12],[x+1,y-9],[x+4,y-10],[x+5,y-6]];
          screenShape(tuft,pal.outline);
          const tuftLight=side?[[ex-2,y-7],[ex-3,y-9],[ex,y-8],[ex+1,y-10],[ex+2,y-7],[ex+4,y-8],[ex+3,y-5]]:[[x-4,y-7],[x-4,y-9],[x-2,y-8],[x-1,y-10],[x+1,y-8],[x+3,y-9],[x+4,y-6]];
          screenShape(tuftLight,'#b7834c');
          // One large sewn button patch with crossing thread and a smaller
          // mismatched button eye are the doll's two readable facial marks.
          const patchX=side?ex+sign*2:x-3;
          screenShape([[patchX-3,y-2],[patchX-2,y-4],[patchX+1,y-4],[patchX+3,y-2],[patchX+2,y+2],[patchX-1,y+3],[patchX-3,y+1]],pal.outline);
          screenShape([[patchX-2,y-2],[patchX-1,y-3],[patchX+1,y-3],[patchX+2,y-1],[patchX+1,y+1],[patchX-1,y+2],[patchX-2,y]],'#a27649');
          pixelLine(c,{x:patchX-2,y:y-3},{x:patchX+2,y:y+2},pal.light,1);
          pixelLine(c,{x:patchX+2,y:y-3},{x:patchX-2,y:y+2},pal.light,1);
          const buttonX=side?ex+sign*5:x+3;
          c.fillStyle=pal.outline;c.fillRect(buttonX-1,y-1,3,3);
          c.fillStyle='#c4d2a7';c.fillRect(buttonX,y-1,1,1);c.fillStyle=pal.eye;c.fillRect(buttonX,y,1,1);
        }else if(rear){
          pixelLine(c,{x:x-3,y:y-4},{x:x+3,y:y-4},pal.light,1);
          pixelLine(c,{x:x-4,y:y-2},{x:x+4,y:y-2},pal.shade,1);
          pixelLine(c,{x:x-2,y:y+2},{x:x+2,y:y+4},pal.light,1);
        }
      } else if(kind==='mindflayer'){
        const a=p.head,x=Math.round(a.x),y=Math.round(a.y);
        const front=d===0||d===1||d===7,side=d===2||d===6,rear=d===3||d===4||d===5;
        // The source has a bald, bulbous violet head, luminous eyes, swept
        // ear-fins and dangling face tentacles. Widen the cranium and leave
        // its lower edge open so the creature cannot read as a hooded human.
        screenShape([[x-8,y+5],[x-12,y+2],[x-13,y-3],[x-11,y-9],[x-7,y-13],[x-2,y-16],[x+3,y-16],[x+9,y-13],[x+12,y-8],[x+13,y-2],[x+10,y+3],[x+6,y+6],[x-5,y+7]],pal.outline);
        screenShape([[x-7,y+4],[x-10,y+1],[x-11,y-3],[x-9,y-8],[x-6,y-12],[x-2,y-14],[x+3,y-14],[x+8,y-11],[x+10,y-7],[x+11,y-2],[x+8,y+2],[x+5,y+4],[x-5,y+5]],pal.body);
        screenShape([[x-6,y-8],[x-4,y-12],[x,y-14],[x+4,y-13],[x+7,y-10],[x+8,y-7],[x+3,y-5],[x-2,y-5]],pal.light);
        pixelLine(c,{x:x-8,y:y-2},{x:x+8,y:y-2},pal.shade,2);
        if(!rear){
          // Two oversized gold eyes are inset into the brow.
          for(const ex of [-5,5]){
            screenShape([[x+ex-3,y-5],[x+ex-2,y-7],[x+ex+1,y-7],[x+ex+3,y-5],[x+ex+2,y-2],[x+ex-1,y-2]],pal.outline);
            screenShape([[x+ex-1,y-5],[x+ex,y-6],[x+ex+1,y-4],[x+ex,y-2],[x+ex-1,y-3]],pal.eye);
            c.fillStyle='#fff5b0';c.fillRect(x+ex,y-5,1,2);
          }
          if(front){
            // The distinct sideways fins remain wider than the shoulders in
            // front and diagonal views, matching the reference silhouette.
            screenShape([[x-9,y-5],[x-14,y-9],[x-18,y-20],[x-15,y-18],[x-12,y-11],[x-7,y-7]],pal.outline);
            screenShape([[x+9,y-5],[x+14,y-9],[x+18,y-20],[x+15,y-18],[x+12,y-11],[x+7,y-7]],pal.outline);
            screenShape([[x-13,y-11],[x-16,y-17],[x-14,y-15],[x-11,y-10]],pal.detail);
            screenShape([[x+13,y-11],[x+16,y-17],[x+14,y-15],[x+11,y-10]],pal.detail);
          }else if(side){
            const sign=d===2?-1:1;
            screenShape([[x+sign*7,y-5],[x+sign*12,y-10],[x+sign*17,y-19],[x+sign*16,y-14],[x+sign*12,y-7]],pal.outline);
            pixelLine(c,{x:x+sign*10,y:y-8},{x:x+sign*15,y:y-16},pal.detail,2);
          }
        }else pixelLine(c,{x:x-4,y:y-7},{x:x+4,y:y-7},pal.light,2);
      } else if(kind==='crystal_golem'){
        const a=p.head,x=Math.round(a.x),y=Math.round(a.y);
        // A single pointed geode crown replaces the round humanoid head.
        screenShape([[x-7,y+4],[x-8,y-2],[x-4,y-7],[x-2,y-12],[x+1,y-16],[x+4,y-10],[x+7,y-5],[x+8,y+2],[x+5,y+5],[x-4,y+6]],pal.outline);
        screenShape([[x-5,y+3],[x-6,y-2],[x-3,y-6],[x-1,y-12],[x+1,y-14],[x+3,y-9],[x+5,y-4],[x+6,y+2],[x+3,y+4],[x-3,y+5]],pal.body);
        screenShape([[x-1,y-12],[x+1,y-14],[x+2,y-8],[x+1,y-3],[x-2,y+1],[x-4,y-2]],pal.light);
        screenShape([[x+2,y-8],[x+5,y-4],[x+6,y+2],[x+3,y+4],[x+1,y+1]],pal.detail);
      } else if(kind==='mana_golem'){
        const a=p.head,x=Math.round(a.x),y=Math.round(a.y);
        const front=d===0||d===1||d===7,side=d===2||d===6,rear=d===3||d===4||d===5;
        // Open blue spirit head: round at the brow and drawn into a short
        // tapered neck, matching the floating source rather than a metal helm.
        screenShape([[x-6,y+4],[x-7,y+1],[x-7,y-3],[x-5,y-7],[x-2,y-9],[x+2,y-9],[x+5,y-7],[x+7,y-3],[x+7,y+1],[x+4,y+4],[x+2,y+6],[x-2,y+6]],pal.outline);
        screenShape([[x-5,y+3],[x-6,y],[x-6,y-3],[x-4,y-6],[x-2,y-8],[x+2,y-8],[x+4,y-6],[x+6,y-3],[x+6,y],[x+3,y+3],[x+1,y+5],[x-2,y+5]],pal.body);
        screenShape([[x-3,y-6],[x-1,y-7],[x+2,y-6],[x+4,y-3],[x+2,y-3],[x,y-4],[x-3,y-3]],pal.light);
        if(front){
          for(const ex of [-3,3]){c.fillStyle=pal.outline;c.fillRect(x+ex-1,y-2,3,4);c.fillStyle='#eef4db';c.fillRect(x+ex,y-2,2,3);c.fillStyle=pal.eye;c.fillRect(x+ex+1,y-1,1,2);}
        }else if(side){const ex=x+(d===2?-3:3);c.fillStyle=pal.outline;c.fillRect(ex-1,y-2,4,4);c.fillStyle='#eef4db';c.fillRect(ex,y-2,2,3);c.fillStyle=pal.eye;c.fillRect(ex+1,y-1,1,2);}
        else if(rear)pixelLine(c,{x:x-3,y:y-4},{x:x+3,y:y-4},pal.shade,1);
      } else if(kind!=='mindflayer'&&kind!=='crystal_golem')vol('head',headSize,headSize*.84,headSize*.8,{...pal,body:pal.face,shade:pal.shade,light:pal.light,outline:pal.outline});
    },p.head.depth+1,['head','neck']);
    if(pose.jaw&&kind!=='ogre'&&kind!=='blaise')add(`${s.name} jaw`,'jaw',()=>vol('jaw',headSize*.55,3,3,{...pal,body:pal.detail,shade:pal.shade,light:pal.face,outline:pal.outline}),p.jaw.depth+1,['head','jaw']);
    if(kind!=='mana_golem'&&kind!=='voodoo_doll'&&kind!=='crystal_golem'&&kind!=='ogre'&&kind!=='blaise'&&kind!=='mindflayer')for(const side of ['L','R'])if(p['eye'+side])add(`${s.name} eye ${side}`,'eye'+side,()=>{const e=p['eye'+side],x=Math.round(e.x),y=Math.round(e.y);c.fillStyle=pal.outline;c.fillRect(x-2,y-2,4,3);c.fillStyle=pal.eye;c.fillRect(x-1,y-1,2,2);c.fillStyle=pal.energy;c.fillRect(x,y,1,1);},p.head.depth+2,['head','eye'+side]);
    switch(kind){
      case 'blaise':
        add('Blaise rounded fire body','chest',()=>{
          const h=p.head,ch=p.chest,hip=p.pelvis,x=Math.round(ch.x),top=Math.round(h.y)+5,bottom=Math.round(hip.y)+10;
          // One connected molten torso, broad beneath the head and tapering
          // into a rolling flame tail instead of leaving a human waist/legs.
          const profile=d===2||d===6,rear=d===3||d===4||d===5,w=profile?7:9,lean=d===2?-2:d===6?2:0;
          const hull=[[x-w+2,top],[x+w-2,top],[x+w,top+5],[x+w-1,top+12],[x+5,bottom-4],[x+lean+2,bottom],[x+lean-1,bottom+3],[x+lean-3,bottom-1],[x-5,bottom-3],[x-w+1,top+13],[x-w,top+6]];
          screenShape(hull,pal.outline);
          screenShape(hull.map(([xx,yy])=>[x+(xx-x)*.78,yy]),rear?pal.body:pal.light);
          // A hot inner tongue sits inside the large orange mass; two broad
          // licks turn around it without adding noisy surface flecks.
          screenShape([[x-5,top+6],[x-1,top+9],[x+4,top+5],[x+5,top+12],[x+2,bottom-2],[x+lean-1,bottom+1],[x-4,bottom-4]],pal.body);
          screenShape([[x-3,top+11],[x,top+14],[x+3,top+10],[x+2,bottom-3],[x+lean-1,bottom],[x-3,bottom-3]],pal.shade);
        },p.chest.depth+1,['head','chest','pelvis']);
        add('Blaise molten core','core',()=>{
          const a=p.core,x=Math.round(a.x),y=Math.round(a.y)+3,rear=d===3||d===4||d===5;
          // Core belongs beneath the face, not as a dark pendant across it.
          screenShape([[x-4,y-3],[x-1,y-5],[x+3,y-3],[x+4,y],[x+1,y+5],[x-2,y+3]],rear?pal.light:pal.face);
          if(!rear)screenShape([[x-2,y-2],[x,y-3],[x+2,y-1],[x+1,y+2],[x-1,y+3]],pal.detail);
        },p.core.depth+3);
        for(const side of ['L','R'])add('Blaise flaring fire limb '+side,'hand'+side,()=>{
          const sh=p['shoulder'+side],el=p['elbow'+side],hand=p['hand'+side];
          const profile=d===2||d===6,sign=profile?(d===2?-1:1):(sh.x<p.chest.x?-1:1);
          // Keep the existing shoulder/elbow/hand channels. The former extra
          // 30-pixel extension turned the arms into a horizontal wing/bar.
          // A rounded shoulder, dropped elbow and short rising flame fingers
          // now articulate at those same anchors without changing any keys.
          if(profile&&side===(d===2?'R':'L'))return;
          const sx=sh.x,sy=sh.y+1,ex=el.x+sign*(profile?7:2),ey=el.y,
            hx=hand.x+sign*(profile?8:2),hy=hand.y-2;
          const arm=[
            [sx-sign*2,sy-3],[sx+sign*3,sy-4],[ex+sign*4,ey-4],
            [hx+sign*4,hy-5],[hx+sign*6,hy-8],[hx+sign*7,hy-3],
            [hx+sign*5,hy],[hx+sign*3,hy+4],[hx,hy+5],
            [hx-sign*4,hy+2],[ex-sign*3,ey+2],[sx-sign*3,sy+3],
          ];
          screenShape(arm,pal.outline);
          screenShape([
            [sx-sign,sy-2],[sx+sign*2,sy-2],[ex+sign*3,ey-3],
            [hx+sign*3,hy-4],[hx+sign*5,hy-5],[hx+sign*5,hy-2],
            [hx+sign*3,hy+2],[hx,hy+3],[hx-sign*2,hy+1],
            [ex-sign*2,ey+1],[sx-sign*2,sy+2],
          ],pal.body);
          // Broad molten inner bend and one pale-hot fingertip cluster.
          screenShape([[sx,sy-2],[sx+sign*2,sy],[ex+sign,ey-1],
            [hx+sign*3,hy-3],[hx+sign*3,hy+1],[hx,hy+2],
            [hx-sign,hy],[ex-sign*2,ey],[sx-sign,sy+1]],pal.light);
          screenShape([[hx,hy-1],[hx+sign*2,hy-3],[hx+sign*3,hy-1],
            [hx+sign*2,hy+1],[hx,hy+2]],pal.face);
        },p['hand'+side].depth+1,['chest','shoulder'+side,'elbow'+side,'hand'+side]);
        break;
      case 'voodoo_doll':
        add('Doll patched sack coat','chest',()=>{
          const a=p.chest,b=p.pelvis,x=Math.round(a.x),y=Math.round(a.y),hem=Math.round(b.y)+3;
          // A short, flared patchwork smock obscures the human waist and
          // gives the compact rig a toy-doll torso silhouette.
          screenShape([[x-8,y-4],[x-5,y-7],[x+4,y-7],[x+8,y-3],[x+8,hem-2],[x+5,hem+3],[x-5,hem+3],[x-8,hem-1]],pal.outline);
          screenShape([[x-6,y-3],[x-4,y-5],[x+3,y-5],[x+6,y-2],[x+6,hem-2],[x+4,hem+1],[x-4,hem+1],[x-6,hem-1]],pal.body);
          // The lower half is a single violet skirt panel, with only two
          // broad cloth folds and one crooked repair patch.
          screenShape([[x-6,y+5],[x+5,y+4],[x+6,hem-2],[x+4,hem+1],[x-4,hem+1],[x-6,hem-1]],'#684b80');
          pixelLine(c,{x:x-3,y:y+6},{x:x-2,y:hem-2},pal.shade,1);
          pixelLine(c,{x:x+2,y:y+6},{x:x+3,y:hem-2},'#8d6897',1);
          screenShape([[x-4,y-2],[x-1,y-4],[x+1,y-2],[x-2,y+1]],'#c3a569');
          pixelLine(c,{x:x-4,y:hem-1},{x:x-2,y:hem+1},pal.light,1);
          pixelLine(c,{x:x+2,y:hem},{x:x+4,y:hem+1},pal.light,1);
        },p.chest.depth+3,['chest','pelvis','patchL','patchR']);
        add('Doll tied patch pin','head',()=>{
          const a=p.head,x=Math.round(a.x),y=Math.round(a.y);
          // A single rusty pin binds the mismatched face patch; placement
          // follows the visible front/near profile and disappears at the back.
          if(d===0||d===1||d===2||d===6||d===7){const px=d===2?x+5:d===6?x-5:x-6;c.fillStyle=pal.outline;c.fillRect(px-1,y-3,3,4);c.fillStyle='#c99368';c.fillRect(px,y-2,1,2);}
        },p.head.depth+4,['head','eyeL','eyeR']);
        add('Doll torso pin','chest',()=>{const n=p.chest,x=Math.round(n.x),y=Math.round(n.y)+3;pixelLine(c,{x:x-3,y:y+2},{x:x+2,y:y-3},pal.outline,2);pixelLine(c,{x:x-2,y:y+1},{x:x+1,y:y-2},pal.detail,1);c.fillStyle=pal.eye;c.fillRect(x-1,y-3,2,2);},p.chest.depth+3,['chest','needle']);
        break;
      case 'gargoyle':
      case 'succubus_2':
        for(const side of ['L','R']){
          const n='wingTip'+side,r='wingRoot'+side;
          if(p[n]&&p[r])add(`${s.name} wing ${side}`,n,()=>{
            const w=p[n],root=p[r],sgn=side==='L'?-1:1;
            if(kind==='gargoyle'){
              // Tall, swept stone membrane with a raised shoulder ridge and
              // deep scallops like the source gargoyle's broad wing silhouette.
              const edge=[{x:root.x,y:root.y+4},{x:root.x+sgn*4,y:root.y-8},{x:root.x+sgn*11,y:root.y-12},{x:root.x+sgn*17,y:root.y-9},{x:w.x+sgn*3,y:w.y-4},{x:w.x+sgn*2,y:w.y+5},{x:root.x+sgn*22,y:root.y+15},{x:root.x+sgn*16,y:root.y+12},{x:root.x+sgn*11,y:root.y+9},{x:root.x+sgn*6,y:root.y+7}];
              pixelPolygon(c,edge,pal.outline);
              pixelPolygon(c,edge.map(pt=>({x:pt.x-sgn,y:pt.y-1})),pal.body);
              pixelLine(c,{x:root.x+sgn*2,y:root.y+2},{x:root.x+sgn*9,y:root.y-7},pal.shade,3);
              pixelLine(c,{x:root.x+sgn*4,y:root.y+1},{x:root.x+sgn*14,y:root.y+9},pal.light,1);
              pixelLine(c,{x:root.x+sgn*8,y:root.y-3},{x:root.x+sgn*20,y:root.y+13},pal.shade,1);
            } else {
              // Keep the succubus's swept bat wings narrower than the
              // gargoyle's broad stone-glider membrane.
              const edge=[{x:root.x,y:root.y+4},{x:root.x+sgn*4,y:root.y-5},{x:root.x+sgn*10,y:root.y-7},{x:w.x+sgn*2,y:w.y-5},{x:w.x,y:w.y+5},{x:root.x+sgn*14,y:root.y+9},{x:root.x+sgn*9,y:root.y+6},{x:root.x+sgn*5,y:root.y+7}];
              pixelPolygon(c,edge,pal.outline);pixelPolygon(c,edge.map(pt=>({x:pt.x-sgn,y:pt.y+1})),pal.body);
              pixelLine(c,{x:root.x+sgn*2,y:root.y+2},w,pal.light,1);
              pixelLine(c,{x:root.x+sgn*5,y:root.y+1},{x:root.x+sgn*12,y:root.y+7},pal.shade,1);
            }
          },p[n].depth,[r,n]);
        }
        if(kind==='gargoyle')for(const side of ['L','R'])add('Gargoyle clawed hand '+side,'hand'+side,()=>{
          const h=p['hand'+side],x=Math.round(h.x),y=Math.round(h.y),front=d===0||d===1||d===7,rear=d===3||d===4||d===5;
          const sign=p.handL.x<=p.handR.x?(side==='L'?-1:1):(side==='L'?1:-1);
          screenShape([[x-4,y-2],[x-2,y-4],[x+2,y-4],[x+4,y-1],[x+4,y+2],[x+1,y+4],[x-3,y+3]],pal.outline);
          screenShape([[x-2,y-2],[x,y-3],[x+2,y-2],[x+3,y],[x+2,y+2],[x-2,y+2]],pal.body);
          if(!rear){
            const spread=front?3:2;
            for(let i=-1;i<=1;i++){
              const sy=y+i*spread,ey=sy+(front?i*1:0)+2;
              pixelLine(c,{x:x+sign*2,y:sy},{x:x+sign*6,y:ey},pal.outline,2);
              pixelLine(c,{x:x+sign*3,y:sy},{x:x+sign*5,y:ey-1},pal.light,1);
            }
          }
        },p['hand'+side].depth+2,['elbow'+side,'hand'+side]);
        if(kind==='gargoyle')for(const side of ['L','R'])add('Gargoyle horn '+side,'horn'+side,()=>{const h=p['horn'+side],x=Math.round(h.x),y=Math.round(h.y),sgn=side==='L'?-1:1;c.fillStyle=pal.outline;c.fillRect(x+sgn,y-5,3,7);c.fillRect(x,y-7,2,4);c.fillStyle=pal.light;c.fillRect(x+sgn,y-4,1,3);},p.head.depth+2);
        else for(const side of ['L','R'])add('Ashwing horn '+side,'horn'+side,()=>{const h=p['horn'+side],x=Math.round(h.x),y=Math.round(h.y),sgn=side==='L'?-1:1;c.fillStyle=pal.outline;c.fillRect(x+sgn,y-5,3,7);c.fillStyle=pal.detail;c.fillRect(x+sgn,y-4,1,4);},p.head.depth+2);
        break;
      case 'crystal_golem':
        add('Geode continuous core','chest',()=>{
          const a=p.chest,b=p.pelvis,x=Math.round(a.x),top=Math.round(a.y)-7,bottom=Math.round(b.y)+4;
          // The body is one tall quartz mass with a narrow lower point, not a
          // broad stone torso carrying a detached chest badge.
          const hull=[[x-5,top],[x-9,top+7],[x-8,top+15],[x-5,bottom-3],[x-1,bottom+2],[x+4,bottom-2],[x+8,top+14],[x+7,top+5],[x+3,top-3],[x,top-8]];
          screenShape(hull,pal.outline);
          screenShape(hull.map(([xx,yy])=>[x+(xx-x)*.78,yy+1]),pal.body);
          screenShape([[x-1,top-5],[x+1,top-6],[x+3,top+4],[x+1,bottom-2],[x-3,bottom-2],[x-5,top+9]],pal.detail);
          pixelLine(c,{x:x-2,y:top+2},{x:x-4,y:bottom-3},pal.light,2);
          pixelLine(c,{x:x+3,y:top+7},{x:x+5,y:bottom-5},pal.shade,1);
        },p.chest.depth+2,['chest','pelvis','crystalCore']);
        add('Geode heart facet','crystalCore',()=>{const a=p.crystalCore,x=Math.round(a.x),y=Math.round(a.y);screenShape([[x,y-5],[x+4,y-1],[x+2,y+4],[x-2,y+4],[x-4,y]],pal.outline);screenShape([[x,y-3],[x+2,y],[x+1,y+3],[x-1,y+3],[x-2,y]],pal.energy);pixelLine(c,{x:x-1,y:y-2},{x:x-2,y:y+1},pal.light,1);},p.crystalCore.depth+3,['chest','crystalCore']);
        for(const n of ['crystalL','crystalR','crystalHead'])add('Geode shard '+n,n,()=>{
          const a=p[n],head=n==='crystalHead',w=head?9:8,baseY=head?9:8,peak=head?-16:-10;
          // Broad shoulder crystals overlap into the core and taper to one
          // point. Their close roots prevent a floating-stone silhouette.
          const pts=[{x:a.x-w,y:a.y+baseY},{x:a.x-w*.78,y:a.y+peak+4},{x:a.x-w*.3,y:a.y+peak},{x:a.x+w*.45,y:a.y+peak+3},{x:a.x+w,y:a.y+baseY}];
          pixelPolygon(c,pts,pal.outline);
          pixelPolygon(c,pts.map(pt=>({x:pt.x,y:pt.y+1})),pal.body);
          pixelPolygon(c,[{x:a.x-w*.5,y:a.y+baseY-2},{x:a.x-w*.2,y:a.y+peak+3},{x:a.x+w*.35,y:a.y+peak+4},{x:a.x+w*.35,y:a.y+baseY-1}],pal.detail);
          pixelLine(c,{x:a.x-w*.45,y:a.y+baseY-2},{x:a.x-w*.3,y:a.y+peak+3},pal.light,2);
          pixelLine(c,{x:a.x+w*.2,y:a.y+peak+3},{x:a.x+w*.7,y:a.y+baseY-1},pal.shade,1);
        },p[n].depth+2);
        for(const side of ['L','R'])add('Geode faceted arm '+side,'hand'+side,()=>{
          const shoulder=p['shoulder'+side],elbow=p['elbow'+side],hand=p['hand'+side];
          pixelLine(c,shoulder,elbow,7,pal.outline);pixelLine(c,shoulder,elbow,5,pal.body);
          pixelLine(c,elbow,hand,7,pal.outline);pixelLine(c,elbow,hand,5,pal.detail);
          const x=Math.round(elbow.x),y=Math.round(elbow.y);
          screenShape([[x-5,y+1],[x-3,y-5],[x,y-8],[x+4,y-3],[x+5,y+2],[x+1,y+6],[x-3,y+5]],pal.outline);
          screenShape([[x-3,y],[x-1,y-5],[x+1,y-4],[x+3,y-1],[x+2,y+3],[x-1,y+4]],pal.body);
          pixelLine(c,{x:x-2,y:y-1},{x:x-1,y:y-4},pal.light,1);
        },Math.max(p.handL.depth,p.handR.depth)+2,['shoulder'+side,'elbow'+side,'hand'+side]);
        break;
      case 'skeleton_deckhand':
        add('Deckhand ribcage','chest',()=>{for(let i=-4;i<=4;i+=2){pixelLine(c,{x:p.chest.x-6,y:p.chest.y+i},{x:p.chest.x+6,y:p.chest.y+i},pal.outline,2);pixelLine(c,{x:p.chest.x-4,y:p.chest.y+i},{x:p.chest.x+4,y:p.chest.y+i},pal.face,1);}},p.chest.depth+1);
        add('Deckhand bandana','bandana',()=>{const a=p.bandana,x=Math.round(a.x),y=Math.round(a.y);c.fillStyle=pal.detail;c.fillRect(x-7,y-5,14,4);c.fillRect(x+4,y-2,5,2);c.fillStyle=pal.light;c.fillRect(x-5,y-4,7,1);},p.head.depth+3);
        add('Deckhand cutlass','cutlassTip',()=>{line('handR','cutlassTip',4,pal.outline);line('handR','cutlassTip',2,pal.light);c.fillStyle=pal.detail;c.fillRect(Math.round(p.handR.x)-3,Math.round(p.handR.y)-1,6,2);},p.cutlassTip.depth+2);
        break;
      case 'ogre':
        add('Ogre belly','belly',()=>vol('belly',10,6,7,{...pal,body:pal.face,shade:pal.body,light:pal.light,outline:pal.outline}),p.belly.depth+1);
        add('Ogre leather sash','chest',()=>{const a=p.chest,b=p.belly,x=Math.round(a.x),y=Math.round(a.y),hem=Math.round(b.y)+7;screenShape([[x-8,y-4],[x-4,y-7],[x+5,y-7],[x+8,y-3],[x+9,hem],[x+5,hem+2],[x-6,hem+1],[x-9,y+2]],pal.outline);screenShape([[x-6,y-3],[x-3,y-5],[x+4,y-5],[x+6,y-2],[x+7,hem-1],[x+4,hem],[x-4,hem],[x-7,y+1]],pal.detail);pixelLine(c,{x:x-6,y:y-1},{x:x+5,y:hem-1},pal.shade,3);pixelLine(c,{x:x-5,y:y-1},{x:x+4,y:hem-1},pal.body,1);const by=hem-1;screenShape([[x-4,by-2],[x+4,by-2],[x+5,by+2],[x+3,by+4],[x-3,by+4],[x-5,by+2]],pal.outline);screenShape([[x-3,by-1],[x+3,by-1],[x+4,by+2],[x+2,by+3],[x-2,by+3],[x-4,by+2]],'#b88f59');c.fillStyle=pal.light;c.fillRect(x-1,by,3,1);},p.chest.depth+2,['chest','belly']);
        for(const side of ['L','R'])add('Ogre red shoulder mark '+side,'shoulder'+side,()=>{const a=p['shoulder'+side],x=Math.round(a.x),y=Math.round(a.y);screenShape([[x-3,y-2],[x+2,y-4],[x+3,y-1],[x+1,y+1],[x+3,y+4],[x-1,y+3],[x-3,y+1]],'#a84e3b');c.fillStyle='#e2935d';c.fillRect(x-1,y-2,2,1);},p['shoulder'+side].depth+2);
        for(const side of ['L','R'])add('Ogre tusk '+side,'tusk'+side,()=>{const t=p['tusk'+side],x=Math.round(t.x),y=Math.round(t.y);screenShape([[x-2,y+3],[x+2,y+3],[x+2,y-1],[x+1,y-4],[x,y-5],[x-1,y-3]],pal.outline);screenShape([[x-1,y+2],[x+1,y+2],[x+1,y-1],[x,y-3]],'#e5d4ad');},p.head.depth+2);
        add('Ogre club','clubTip',()=>{line('clubBase','clubTip',6,pal.outline);line('clubBase','clubTip',3,pal.body);vol('clubTip',4,4,5,{...pal,body:pal.shade,shade:pal.outline,light:pal.light,outline:pal.outline});},p.clubTip.depth+3);
        break;
      case 'jimothy':
        add('Jimothy ringed brush tail','tailTip',()=>{
          const a=p.tailBase,b=p.tailMid,z=p.tailTip;
          const stroke=(from,to,width,color)=>pixelLine(c,from,to,color,width);
          stroke(a,b,8,pal.outline);stroke(b,z,7,pal.outline);
          stroke(a,b,6,pal.body);stroke(b,z,5,pal.body);
          stroke(a,b,2,pal.light);stroke(b,z,2,pal.light);
          // Three broad dark rings wrap the tail; their short cross strokes
          // follow its projected angle instead of reading as horizontal bars.
          const dx=z.x-a.x,dy=z.y-a.y,len=Math.hypot(dx,dy)||1,px=-dy/len,py=dx/len;
          for(const t of [.28,.53,.78]){
            const center={x:a.x+dx*t,y:a.y+dy*t},half=3.1;
            pixelLine(c,{x:center.x-px*half,y:center.y-py*half},{x:center.x+px*half,y:center.y+py*half},pal.shade,2);
          }
          const tip={x:Math.round(z.x),y:Math.round(z.y)};
          screenShape([[tip.x-3,tip.y-1],[tip.x-1,tip.y-3],[tip.x+2,tip.y-2],[tip.x+4,tip.y],[tip.x+2,tip.y+3],[tip.x-2,tip.y+3]],pal.outline);
          screenShape([[tip.x-1,tip.y-1],[tip.x+1,tip.y-2],[tip.x+3,tip.y],[tip.x+1,tip.y+2],[tip.x-1,tip.y+2]],pal.light);
        },p.tailTip.depth-2,['pelvis','tailBase','tailMid','tailTip']);
        add('Jimothy round raccoon ears','head',()=>{
          const front=d===0||d===1||d===7,side=d===2||d===6,rear=d===3||d===4||d===5;
          const ears=front?[-6,6]:side?[d===2?5:-5]:rear?[-5,5]:[];
          const y=Math.round(p.head.y)-5;
          for(const ex of ears){
            screenShape([[p.head.x+ex-3,y+2],[p.head.x+ex-3,y-1],[p.head.x+ex-1,y-5],[p.head.x+ex+2,y-4],[p.head.x+ex+4,y+1],[p.head.x+ex+2,y+3]],pal.outline);
            screenShape([[p.head.x+ex-1,y+1],[p.head.x+ex,y-3],[p.head.x+ex+2,y-2],[p.head.x+ex+3,y+1]],pal.body);
            if(front||side)c.fillStyle=pal.detail,c.fillRect(Math.round(p.head.x+ex),y-1,2,2);
          }
          if(front||side){
            const x=Math.round(p.head.x),fy=Math.round(p.head.y)+1;
            // Dark mask, pale eye bridge and cheek tufts give the face the
            // source animal's raccoon identity without tiny fur texture.
            screenShape([[x-7,fy-2],[x-5,fy-4],[x-2,fy-3],[x,y-1],[x+2,fy-3],[x+5,fy-4],[x+7,fy-2],[x+5,fy+2],[x+2,fy+1],[x,fy+3],[x-2,fy+1],[x-5,fy+2]],pal.detail);
            screenShape([[x-2,fy-3],[x,fy-1],[x+2,fy-3],[x+1,fy+2],[x,fy+4],[x-1,fy+2]],pal.face);
            screenShape([[x-7,fy+2],[x-5,fy+2],[x-3,fy+4],[x-6,fy+4]],pal.face);
            screenShape([[x+7,fy+2],[x+5,fy+2],[x+3,fy+4],[x+6,fy+4]],pal.face);
          }else if(rear){
            const x=Math.round(p.head.x);screenShape([[x-4,y+1],[x,y-1],[x+4,y+1],[x+3,y+4],[x-3,y+4]],pal.shade);
          }
        },p.head.depth+1,['head','cap','earL','earR','eyeL','eyeR']);
        add('Jimothy compact dark nose','nose',()=>{
          const n=p.nose,x=Math.round(n.x),y=Math.round(n.y),profile=d===2||d===6||d===1||d===3||d===5||d===7;
          const sign=d===2||d===1||d===3?-1:d===6||d===5||d===7?1:0,nx=x+sign*(profile?2:0);
          c.fillStyle=pal.outline;c.fillRect(nx-2,y-1,4,3);
          c.fillStyle=pal.light;c.fillRect(nx-1,y-1,1,1);
          if(!profile){c.fillStyle=pal.face;c.fillRect(nx-4,y+1,2,1);c.fillRect(nx+2,y+1,2,1);}
        },p.nose.depth+4,['head','nose','muzzle']);
        add('Jimothy lucky charm','charm',()=>{const a=p.charm;c.fillStyle=pal.outline;c.fillRect(Math.round(a.x)-3,Math.round(a.y)-3,6,6);c.fillStyle=pal.energy;c.fillRect(Math.round(a.x)-1,Math.round(a.y)-1,3,3);},p.charm.depth+1);
        break;
      case 'mindflayer':
        add('Mindflayer mantle collar','hood',()=>{const a=p.head,x=Math.round(a.x),y=Math.round(a.y);pixelPolygon(c,[{x:x-9,y:y+4},{x:x-7,y:y+1},{x:x-3,y:y+4},{x:x,y:y+6},{x:x+4,y:y+3},{x:x+8,y:y+1},{x:x+10,y:y+5},{x:x+6,y:y+9},{x:x-6,y:y+9}],pal.outline);pixelPolygon(c,[{x:x-6,y:y+5},{x:x-3,y:y+5},{x:x,y:y+7},{x:x+4,y:y+5},{x:x+7,y:y+5},{x:x+4,y:y+7},{x:x-4,y:y+8}],pal.detail);},p.head.depth-1);
        add('Mindflayer face tentacles','head',()=>{
          const a=p.head,x=Math.round(a.x),y=Math.round(a.y)+3;
          // Broad, separated tendrils hang directly from the face. Their
          // heavy roots and rounded ends preserve the defining source shape.
          for(const [dx,dy,width,bend] of [[-9,12,4,-5],[-3,17,5,-2],[3,17,5,2],[9,12,4,5]]){
            const start={x:x+Math.sign(dx)*2,y:y+2},mid={x:x+dx*.55+bend,y:y+dy*.55},end={x:x+dx,y:y+dy};
            pixelLine(c,start,mid,pal.outline,width+3);pixelLine(c,mid,end,pal.outline,width+2);
            pixelLine(c,start,mid,pal.body,width+1);pixelLine(c,mid,end,pal.body,width);
            pixelLine(c,{x:mid.x-1,y:mid.y},{x:end.x-Math.sign(dx),y:end.y-1},pal.light,1);
          }
        },p.head.depth+3,['head','jaw']);
        break;
      case 'mana_golem':
        add('Mana tapered spirit mantle','chest',()=>{
          const a=p.chest,b=p.pelvis,x=Math.round(a.x),top=Math.round(a.y)-5,bottom=Math.round(Math.max(p.footL?.y||b.y,p.footR?.y||b.y));
          // Broad shoulder-and-chest mass falls into a narrow vapor tail below
          // the waist, giving the spirit its floating silhouette.
          const hull=[[x-7,top],[x-10,top+4],[x-9,top+10],[x-6,top+14],[x-4,bottom-4],[x-1,bottom+4],[x+2,bottom],[x+4,bottom-5],[x+7,top+12],[x+10,top+7],[x+8,top+2],[x+5,top-1]];
          screenShape(hull,pal.outline);
          screenShape(hull.map(([xx,yy])=>[x+(xx-x)*.75,yy+1]),pal.body);
          screenShape([[x-4,top+2],[x-1,top],[x+3,top+3],[x+2,top+8],[x-1,bottom-2],[x-3,top+10]],pal.light);
          screenShape([[x+2,top+7],[x+6,top+10],[x+3,bottom-5],[x+1,bottom]],pal.shade);
        },Math.max(p.footL.depth,p.footR.depth)+1,['chest','pelvis','footL','footR','core']);
        add('Mana chest sigil','core',()=>{const a=p.core,x=Math.round(a.x),y=Math.round(a.y);screenShape([[x,y-5],[x+5,y],[x+2,y+5],[x-2,y+5],[x-5,y]],pal.outline);screenShape([[x,y-3],[x+2,y],[x+1,y+3],[x-1,y+3],[x-2,y]],pal.energy);c.fillStyle='#f3ffe1';c.fillRect(x,y-1,1,3);},p.core.depth+3);
        for(const side of ['L','R'])add('Mana spectral gauntlet '+side,'hand'+side,()=>{
          const a=p['hand'+side],x=Math.round(a.x),y=Math.round(a.y),sgn=side==='L'?-1:1;
          // Oversized blue fists with one dark cuff echo the source's heavy
          // gauntlets while staying registered to both hand joints.
          screenShape([[x-4,y-3],[x-1,y-5],[x+3,y-4],[x+5,y-1],[x+5,y+3],[x+2,y+5],[x-3,y+4],[x-5,y+1]],pal.outline);
          screenShape([[x-3,y-2],[x-1,y-4],[x+2,y-3],[x+4,y],[x+3,y+3],[x,y+4],[x-3,y+2]],pal.body);
          pixelLine(c,{x:x-2,y:y-2},{x:x+2,y:y-3},pal.light,1);
          pixelLine(c,{x:x-sgn*4,y:y+1},{x:x-sgn*6,y:y+3},pal.energy,1);
        },p['hand'+side].depth+2,['elbow'+side,'hand'+side]);
        for(const side of ['L','R'])add('Mana shoulder rune '+side,'shoulder'+side,()=>{const a=p['shoulder'+side],x=Math.round(a.x),y=Math.round(a.y);c.fillStyle=pal.energy;c.fillRect(x-1,y-2,3,4);c.fillStyle='#ecffe2';c.fillRect(x,y-1,1,2);},p['shoulder'+side].depth+2,['chest','shoulder'+side]);
        break;
      case 'forest_golem':
        add('Forest moss heart','mossCore',()=>{vol('mossCore',6,4,5,{...pal,body:pal.detail,shade:pal.shade,light:pal.energy,outline:pal.outline});c.fillStyle=pal.energy;c.fillRect(Math.round(p.mossCore.x)-1,Math.round(p.mossCore.y)-2,3,3);},p.mossCore.depth+3);
        for(const n of ['branchL','branchR'])add('Forest crown branch '+n,n,()=>{const a=p[n],x=Math.round(a.x),y=Math.round(a.y),sgn=n.endsWith('L')?-1:1;pixelLine(c,{x,y:y+5},{x:x+sgn*4,y:y-4},pal.outline,4);pixelLine(c,{x,y:y+4},{x:x+sgn*4,y:y-4},pal.body,2);},p[n].depth+2);
        for(const n of ['leafL','leafR'])add('Forest crown leaf '+n,n,()=>{const a=p[n],x=Math.round(a.x),y=Math.round(a.y);screenShape([[x,y-4],[x+4,y],[x+2,y+4],[x-3,y+2]],pal.outline);screenShape([[x,y-2],[x+2,y],[x+1,y+2],[x-1,y+1]],pal.energy);},p[n].depth+3);
        add('Forest root legs','rootL',()=>{for(const n of ['rootL','rootR']){const r=p[n],x=Math.round(r.x),y=Math.round(r.y);pixelLine(c,{x,y:y-2},{x:x-5,y:y+3},pal.outline,3);pixelLine(c,{x,y:y-2},{x:x+5,y:y+3},pal.outline,3);}},p.rootL.depth-1,['footL','footR','rootL','rootR']);
        break;
    }
  }
  paintLayers(q,model,d,c,p);
  return p;
}

function finiteActorTarget(_g,target,actor){return target&&target.hp>0&&(target.room||null)===(actor.room||null)&&!target.dead;}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function deal(g,target,actor,amount){
  if(!finiteActorTarget(g,target,actor)||target.invuln>0||g.shieldBlocks?.(target,actor))return false;
  const hp=target.hp;if(typeof g.hurt==='function')g.hurt(target,amount,actor);else target.hp=Math.max(0,target.hp-amount);
  return target.hp<hp;
}
function moveToward(g,actor,target,dt,speed){
  const d=distance(actor,target)||1;actor.faceX=(target.x-actor.x)/d;actor.faceY=(target.y-actor.y)/d;
  if(typeof g.moveActor==='function')g.moveActor(actor,actor.faceX*Math.min(d,speed*dt),actor.faceY*Math.min(d,speed*dt));
  else {actor.x+=actor.faceX*Math.min(d,speed*dt);actor.y+=actor.faceY*Math.min(d,speed*dt);}
}
const rangedKind=s=>s.behaviors.fireball?'fireball':s.behaviors.pageVolley?'pageVolley':s.behaviors.psionicPulse?'psionicPulse':s.behaviors.heartBolt?'heartBolt':s.behaviors.arcBolt?'arcBolt':s.behaviors.shardBurst?'shardBurst':null;
const attackColor=kind=>({fireball:'#ff7433',pageVolley:'#f4dba0',psionicPulse:'#c875ed',heartBolt:'#ff83b3',arcBolt:'#7be5dc',shardBurst:'#8de8ff',curse:'#d569db',dive:'#d5a783',clubSlam:'#d4a568',feint:'#c8d9c5',sweep:'#dfb371',rootSnare:'#9ad86d'})[kind]||'#ffe2a0';
function cue(g,x,y,color,radius=28,life=.38){g.effects||=[];g.effects.push({x,y,color,radius,life,duration:life});}
function pulse(g,kind,x,y,seed=0){
  cue(g,x,y,attackColor(kind),kind==='psionicPulse'?52:kind==='clubSlam'?44:kind==='rootSnare'?40:kind==='sweep'?34:27,.42);
  if(kind==='fireball')spawnParticleEffect(g,'px-fire-burst',x,y,seed);
  else if(kind==='shardBurst'||kind==='clubSlam')spawnParticleEffect(g,'rock-fragments',x,y,seed);
  else if(kind==='curse'||kind==='psionicPulse'||kind==='heartBolt')spawnParticleEffect(g,'purple-aura',x,y,seed);
  else if(kind==='rootSnare')spawnParticleEffect(g,'salvage-hands',x,y,seed);
}
function constructFirePatch(g,x,y,life,damage){
  const tx=Math.floor(x/32)*32,ty=Math.floor(y/32)*32;g.firePatches||=[];
  let patch=g.firePatches.find(f=>f.x===tx&&f.y===ty);
  if(!patch){patch={x:tx,y:ty,life,damage,tick:0};g.firePatches.push(patch);}else patch.life=Math.max(patch.life,life);
  return patch;
}
function shot(g,actor,target,kind,damage,index=0,count=1){
  const tx=target.x+(index-(count-1)/2)*13,ty=target.y+(index-(count-1)/2)*8,dx=tx-actor.x,dy=ty-actor.y,d=Math.hypot(dx,dy)||1;
  g.fireballs||=[];
  const ice=kind==='shardBurst';
  g.fireballs.push({x:actor.x,y:actor.y-10,vx:dx/d*205,vy:dy/d*205,life:2.4,trail:.02,damage,burnDamage:kind==='fireball'?5:0,ice,friendly:false,controllerOwner:actor.id,room:actor.room||null,constructKind:kind});
  if(!ice&&kind!=='fireball')cue(g,actor.x,actor.y-8,attackColor(kind),9,.22);
}
function shove(g,actor,target,amount){const dx=target.x-actor.x,dy=target.y-actor.y,d=Math.hypot(dx,dy)||1;g.moveActor?.(target,dx/d*amount,dy/d*amount);}
function damageArea(g,actor,targets,radius,amount,{root=0,knockback=0,kind='clubSlam'}={}){
  let hits=0;
  for(const target of targets){if(!finiteActorTarget(g,target,actor)||distance(actor,target)>radius)continue;
    if(deal(g,target,actor,amount)){hits++;if(root>0&&!g.rootResists?.(target))target.rooted=Math.max(target.rooted||0,root);if(knockback)shove(g,actor,target,knockback);}
  }
  pulse(g,kind,actor.x,actor.y,Math.round(actor.x+actor.y));return hits;
}
function resolveSpecial(g,actor,target,targets,s,n){
  const b=s.behaviors,d=target?distance(actor,target):Infinity;
  const projectile=rangedKind(s);
  if(projectile){
    if(projectile==='psionicPulse'){
      const hits=damageArea(g,actor,targets,145,s.stats.damage,{kind:projectile});
      if(!hits&&d<=(actor.stats?.rangedRange||s.stats.attackRange))shot(g,actor,target,projectile,s.stats.damage);
    } else if(projectile==='pageVolley'){
      for(let i=0;i<3;i++)shot(g,actor,target,projectile,Math.max(4,s.stats.damage-2),i,3);
      pulse(g,projectile,actor.x,actor.y,actor.id||0);
    } else {
      shot(g,actor,target,projectile,s.stats.damage);
      pulse(g,projectile,actor.x,actor.y,actor.id||0);
    }
    n.specialCooldown=b.arcBolt?4.5:b.heartBolt?4.1:b.psionicPulse?5:b.shardBurst?5.2:4.4;
    return;
  }
  if(b.curse){
    if(d<=122&&deal(g,target,actor,Math.max(5,s.stats.damage*.62))){target.rooted=Math.max(target.rooted||0,1.35);}
    pulse(g,'curse',target.x,target.y,actor.id||0);n.specialCooldown=4.4;return;
  }
  if(b.dive){
    n.phase='dive';n.timer=.34;n.diveTarget=target;n.specialCooldown=4.2;
    pulse(g,'dive',target.x,target.y,actor.id||0);return;
  }
  if(b.clubSlam){damageArea(g,actor,targets,91,s.stats.damage+9,{knockback:24,kind:'clubSlam'});n.specialCooldown=4.6;return;}
  if(b.feint){n.phase='feint';n.timer=.3;n.feintTarget=target;n.specialCooldown=3.4;pulse(g,'feint',actor.x,actor.y,actor.id||0);return;}
  if(b.sweep){damageArea(g,actor,targets,82,s.stats.damage+4,{knockback:29,kind:'sweep'});n.specialCooldown=3.8;return;}
  if(b.rootSnare){const hits=damageArea(g,actor,targets,98,s.stats.damage+3,{root:1.65,kind:'rootSnare'});if(!hits&&d<s.stats.attackRange+22&&deal(g,target,actor,s.stats.damage+3))target.rooted=Math.max(target.rooted||0,1.65);n.specialCooldown=4.8;return;}
  if(d<=s.stats.attackRange+24)deal(g,target,actor,s.stats.damage);
  n.specialCooldown=3.6;
}
export function tickConstructActor(game,actor,dt,livingTargets=[]){
  const s=specs[actor?.kind];if(!s)return false;
  if(!Number.isFinite(dt)||dt<=0||game.paused||(game.phase&&game.phase!=='play'))return true;
  const n=actor.constructAI??={phase:'idle',timer:0,cooldown:.6,specialCooldown:2,attacks:0};
  if(actor.hp<=0){actor.animationAction='death';n.phase='dead';return true;}
  const target=livingTargets.filter(p=>finiteActorTarget(game,p,actor)).sort((a,b)=>distance(actor,a)-distance(actor,b))[0];
  n.cooldown=Math.max(0,n.cooldown-dt);n.specialCooldown=Math.max(0,n.specialCooldown-dt);
  if(!target){actor.animationAction='idle';n.phase='idle';return true;}
  const d=distance(actor,target),specialRange=actor.stats?.rangedRange||actor.rangedRange||s.stats.attackRange;
  if(s.behaviors.fireTrail&&actor.moving){n.trailTimer=(n.trailTimer||0)-dt;if(n.trailTimer<=0){constructFirePatch(game,actor.x,actor.y,1.4,Math.max(2,s.stats.damage*.22));spawnParticleEffect(game,'cinder-trail',actor.x,actor.y,actor.id||0);n.trailTimer=.34;}}
  const canSpecial=!!(rangedKind(s)||s.behaviors.curse||s.behaviors.dive||s.behaviors.clubSlam||s.behaviors.feint||s.behaviors.sweep||s.behaviors.rootSnare);
  if(n.phase==='dive'){
    const victim=finiteActorTarget(game,n.diveTarget,actor)?n.diveTarget:target;
    actor.animationAction='run';actor.moving=true;
    if(victim)moveToward(game,actor,victim,dt,s.stats.speed*3.6);
    n.timer-=dt;
    if(n.timer<=0){if(victim&&distance(actor,victim)<73)damageArea(game,actor,livingTargets,75,s.stats.damage+5,{knockback:18,kind:'dive'});n.phase='recover';n.timer=s.stats.recovery*.75;}
    return true;
  }
  if(n.phase==='feint'){
    actor.animationAction='run';actor.moving=true;
    const victim=finiteActorTarget(game,n.feintTarget,actor)?n.feintTarget:target;
    if(victim){const d=distance(actor,victim)||1,sideX=-actor.faceY,sideY=actor.faceX;game.moveActor?.(actor,sideX*Math.min(22,s.stats.speed*dt),sideY*Math.min(22,s.stats.speed*dt));actor.faceX=(victim.x-actor.x)/d;actor.faceY=(victim.y-actor.y)/d;}
    n.timer-=dt;
    if(n.timer<=0){if(victim&&distance(actor,victim)<=s.stats.attackRange+36){deal(game,victim,actor,s.stats.damage+4);shove(game,actor,victim,10);}n.phase='recover';n.timer=s.stats.recovery*.65;n.attacks++;}
    return true;
  }
  const range=canSpecial&&d<specialRange?specialRange:s.stats.attackRange;
  if(n.phase==='windup'||n.phase==='specialWindup'){
    actor.animationAction=n.phase==='specialWindup'?'special':'windup';
    n.timer-=dt;
    if(n.phase==='specialWindup'&&n.timer>0&&n.timer<.16&&n.lastCueTimer<=0){pulse(game,rangedKind(s)||(['curse','dive','clubSlam','feint','sweep','rootSnare'].find(k=>s.behaviors[k])||'attack'),target.x,target.y,actor.id||0);n.lastCueTimer=.18;}
    n.lastCueTimer=Math.max(0,(n.lastCueTimer||0)-dt);
    if(n.timer<=0){
      if(n.phase==='specialWindup')resolveSpecial(game,actor,target,livingTargets,s,n);else deal(game,target,actor,s.stats.damage);
      if(n.phase!=='dive'&&n.phase!=='feint'){n.phase='recover';n.timer=s.stats.recovery;}
      n.cooldown=Math.max(0.35,s.stats.windup*.7);n.attacks++;
    }
    return true;
  }
  if(n.phase==='recover'){
    actor.animationAction='recover';n.timer-=dt;
    if(n.timer<=0){n.phase='idle';actor.animationAction='idle';}
    return true;
  }
  if(canSpecial&&n.specialCooldown<=0&&d<=specialRange){
    actor.faceX=(target.x-actor.x)/(d||1);actor.faceY=(target.y-actor.y)/(d||1);
    n.phase='specialWindup';n.timer=s.stats.windup*1.18;n.lastCueTimer=0;actor.animationAction='special';pulse(game,rangedKind(s)||(['curse','dive','clubSlam','feint','sweep','rootSnare'].find(k=>s.behaviors[k])||'attack'),target.x,target.y,actor.id||0);return true;
  }
  if(d>range){moveToward(game,actor,target,dt,s.stats.speed);actor.moving=true;actor.animationAction=s.behaviors.fly||s.behaviors.glide?'run':'walk';return true;}
  actor.faceX=(target.x-actor.x)/(d||1);actor.faceY=(target.y-actor.y)/(d||1);actor.moving=false;
  if(n.cooldown<=0){n.phase='windup';n.timer=s.stats.windup;actor.animationAction='windup';}
  else actor.animationAction='idle';
  return true;
}

const events=specList.map(([kind,name,baseKind,form,stats,behaviors,eventName,eventCount])=>({
  name:eventName,kind,type:'enemy',count:eventCount,hp:stats.hp,speed:stats.speed,damage:stats.damage,weight:0,
  verse:`${eventName}.\n${name} steps into view.`,tip:`Watch for its ${Object.keys(behaviors).filter(k=>!['melee','hunt','health'].includes(k)).join(', ')||'heavy attacks'} tell; dodge the windup and strike during recovery.`,
  pack:'constructs',devOnly:true,
}));
const defaults=Object.fromEntries(specList.map(([kind,name,baseKind,form,stats,behaviors])=>[kind,{
  name,baseKind,aiKind:kind,rigType:form,faction:'enemy',
  stats:{...stats,detection:520,dropChance:1,rangedRange:Math.max(stats.attackRange,180),rangedCooldown:3.2},
  behaviors:{health:true,hunt:true,melee:true,...behaviors,customPackAI:true},
  motionSource:'native approximation; supplied Wowhead donor animation data not imported or verified',
}]));
const subjects=Object.fromEntries(Object.keys(specs).map(kind=>{
  const data=models[kind],s=specs[kind],selected={blaise:'core',voodoo_doll:'needle',enchanted_book:'pages',gargoyle:'wingTipL',crystal_golem:'crystalCore',skeleton_deckhand:'cutlassTip',ogre:'clubTip',jimothy:'nose',mindflayer:'eyeThird',succubus_2:'wingTipL',mana_golem:'core',enchanted_broom:'bristles',forest_golem:'mossCore'}[kind];
  return [kind,{name:s.name,data,defaults:()=>clone(models[kind]),replace:m=>{Object.assign(models[kind],clone(m));},draw:(c,a,t,m=models[kind],p)=>drawConstruct(c,a,t,m,p),sprite:kind,selected,palette:Object.keys(data.palette),shapeKeys:Object.keys(data.shape),tracks:[selected,...Object.keys(data.joints).filter(n=>/^(foot|hand|wing|crystal|tentacle|root|core)/.test(n)&&n!==selected)].slice(0,5),clip:kind==='enchanted_book'?'special':kind==='gargoyle'||kind==='succubus_2'?'walk':kind==='enchanted_broom'?'run':'attack',scale:s.form==='heavy'?4:5}];
}));

export const CREATURE_PACK=Object.freeze({
  subjects:Object.freeze(subjects),defaults:Object.freeze(defaults),events:Object.freeze(events),
  tickActor:tickConstructActor,
  onSpawn(_game,event,groupActors){if(event?.pack!=='constructs')return false;for(const actor of groupActors||[])if(specs[actor.kind])actor.constructAI={phase:'idle',timer:0,cooldown:.5,specialCooldown:1.6,attacks:0};return true;},
  motionNotes:Object.freeze(Object.fromEntries(Object.keys(specs).map(kind=>[kind,models[kind].motionNotes]))),
});
