// Native, editable wildlife additions. Most clips are authored Wildbound
// motion; selected species use mapped donor M2 tracks on editable parts. The
// turkey uses donor Stand and retains its native grounded strut/actions.
import { poseAt, projectPoint, facingIndex } from '../player-motion.mjs';
import { pixelLine, pixelPolygon, pixelVolume } from '../pixel-shapes.mjs';
import { paintLayers } from '../render-order.mjs';
import { defaultSpiderMotion, drawSpider } from '../spider-motion.mjs';
import { defaultNightMotion, drawNightRig } from '../night-rigs.mjs';
import { squirrelWowClip } from '../squirrel-wow-motion.mjs';
import { sheepWowClip } from '../sheep-wow-motion.mjs';
import { skunkWowClip } from '../skunk-wow-motion.mjs';
import { llamaWowClip } from '../llama-wow-motion.mjs';
import { turkeyWowClip } from '../turkey-wow-motion.mjs';
import { goldenRetrieverWowClip, goldenRetrieverWowMotionProvenance } from '../golden-retriever-wow-motion.mjs';
import { TRICERATOPS_WOW_MOTION } from '../triceratops-wow-motion-data.mjs';
import { requestedCreatureDefaults } from '../requested-creature-transfer.mjs';
import { take } from '../items.mjs';

const VIEWS = 8;
const clone = value => structuredClone(value);
const quadrupedKinds = new Set([
  'snail','golden_retriever','llama','sheep','squirrel','triceratops',
  'baby_triceratops','skunk',
]);

const specs = {
  snail: { name:'Amethyst softshell snail', form:'snail', palette:{body:'#888da4',shade:'#525a70',light:'#c4c5d2',face:'#abb3c7',eye:'#f05dbc',outline:'#342b39',shell:'#77549b',shellLight:'#c8a5cf',shellShade:'#423650'}, shape:{bodyWidth:8,bodyLength:13,bodyHeight:4,headRadius:4,shellWidth:9,shellLength:9,shellHeight:8,legWidth:2}, clips:['crawl','hide','taste'], stats:[48,16,5], faction:'neutral', habitat:'forest', behavior:'slow-crawl' },
  jumping_spider: { name:'Bouncer / jumping spider', form:'spider', palette:{body:'#7b5942',shade:'#49382f',light:'#b4835a',face:'#80583f',eye:'#f6dc88',outline:'#2d2525',band:'#c69368',fur:'#d8b58d',fang:'#e6dbc0'}, shape:{bodyWidth:11,abdomenLength:10,abdomenHeight:7,headRadius:5,legWidth:2.5,fur:1}, clips:['stalk','pounce','bite'], stats:[56,58,12], faction:'enemy', habitat:'forest', behavior:'ambush-pounce' },
  fox_kit: { name:'Copperfur fox kit', form:'existing-fox', palette:null, shape:null, clips:['stalk','bite','retreat'], stats:[42,92,8], faction:'neutral', habitat:'forest', behavior:'skittish-wildlife' },
  llama: { name:'Llama', form:'quadruped', palette:{body:'#d7ceb9',shade:'#77716d',light:'#f4e9d2',face:'#8d6252',eye:'#241d1b',outline:'#40313a',muzzle:'#cba98b',mane:'#e8dec9',ear:'#8a6351'}, shape:{bodyWidth:7.2,bodyLength:12.5,bodyHeight:7,headRadius:4,legWidth:2.5,neckLength:15,earLength:9}, clips:['trot','spit-warning','kick'], stats:[62,64,8], faction:'neutral', habitat:'forest', behavior:'flee-then-spit-warning' },
  penguin: { name:'Flipper / ice penguin', form:'penguin', palette:{body:'#364656',shade:'#202c37',light:'#5c7180',face:'#edf0d9',eye:'#43bfc7',outline:'#17212b',beak:'#df9c45',feet:'#cb8140',belly:'#f2ead1'}, shape:{bodyWidth:10,bodyHeight:12,headRadius:4.5,legWidth:2,flipperLength:7}, clips:['waddle','slide','dive'], stats:[38,56,0], faction:'neutral', habitat:'ice-water-edge', behavior:'waddle-dive-flee' },
  crab: { name:'Freshwater pincher crab', form:'crab', palette:{body:'#936d91',shade:'#59445e',light:'#c5a0c1',face:'#98758f',eye:'#5ed4cc',outline:'#342b3d',claw:'#b782ae',belly:'#bda7b8'}, shape:{bodyWidth:10,bodyLength:9,bodyHeight:5,headRadius:4,legWidth:2,clawWidth:4}, clips:['scuttle','pinch','raise-claws'], stats:[52,55,13], faction:'enemy', habitat:'beach', behavior:'side-scuttle-pincher' },
  golden_retriever: { name:'Golden retriever', form:'quadruped', palette:{body:'#c78b43',shade:'#875832',light:'#efc971',face:'#d99f56',eye:'#2c221b',outline:'#50372a',muzzle:'#f1dab0',muzzleShade:'#c6a47a',mane:'#e5b75e',nose:'#352827',ear:'#a36b45'}, shape:{bodyWidth:8.5,bodyLength:14,bodyHeight:7.5,headRadius:5,legWidth:3,tailLength:10,tailWidth:4,earLength:4}, clips:['trot','sit','wag','fetch'], stats:[60,82,0], faction:'neutral', habitat:'house', behavior:'bond-with-bone-follow' },
  skunk: { name:'Highlands skunk', form:'quadruped', palette:{body:'#343640',shade:'#20222b',light:'#666775',face:'#41444c',eye:'#f6df9c',outline:'#181a22',muzzle:'#d0c4ad',stripe:'#f2ebd9',tail:'#30323d'}, shape:{bodyWidth:7.6,bodyLength:12.5,bodyHeight:6.8,headRadius:4.8,legWidth:2,tailLength:15,tailWidth:10.5}, clips:['amble','raise-tail','spray-warning'], stats:[40,54,4], faction:'neutral', habitat:'forest', behavior:'warning-spray-then-flee' },
  triceratops: { name:'Jammer / triceratops', form:'quadruped', palette:{body:'#896747',shade:'#583d36',light:'#c79d67',face:'#98704e',eye:'#201d20',outline:'#342a2c',horn:'#eee0c5',frill:'#76564d'}, shape:{bodyWidth:12,bodyLength:16,bodyHeight:9,headRadius:7,legWidth:4,frillWidth:11,hornLength:8}, clips:['heavy-walk','warn','charge','headbutt'], stats:[220,44,26], faction:'neutral', habitat:'forest', behavior:'territorial-telegraphed-charge' },
  sheep: { name:'Sheep', form:'quadruped', palette:{body:'#dfd7bf',shade:'#a69e8b',light:'#f3eddc',face:'#51443e',eye:'#24201f',outline:'#4f4a45',muzzle:'#d4b596',wool:'#f0e7d2'}, shape:{bodyWidth:9.5,bodyLength:12.5,bodyHeight:8,headRadius:4.5,legWidth:3.2,woolPuffs:6}, clips:['graze','bleat','bound'], stats:[46,48,0], faction:'neutral', habitat:'forest', behavior:'flock-flee' },
  squirrel: { name:'Squirrel', form:'quadruped', palette:{body:'#a65b31',shade:'#64392f',light:'#d18448',face:'#bd7142',eye:'#241e1b',outline:'#3b2926',muzzle:'#e8c99e',tail:'#8e492d',tailLight:'#d68a4d',belly:'#e7d2ad',ear:'#a95335'}, shape:{bodyWidth:5,bodyLength:8,bodyHeight:5,headRadius:4,legWidth:1.5,tailLength:12,tailWidth:7}, clips:['scamper','freeze','leap'], stats:[22,112,0], faction:'neutral', habitat:'forest', behavior:'startle-scurry-tree' },
  baby_triceratops: { name:'Tiny direhorn / baby triceratops', form:'quadruped', palette:{body:'#96a47d',shade:'#5e705a',light:'#c5c997',face:'#9da986',eye:'#252a24',outline:'#3f4938',horn:'#eee0b4',frill:'#81906c'}, shape:{bodyWidth:8,bodyLength:11,bodyHeight:6,headRadius:5,legWidth:2.5,frillWidth:7,hornLength:4}, clips:['quick-walk','call-for-parent','short-charge'], stats:[76,78,9], faction:'neutral', habitat:'forest', behavior:'stay-near-adult-flee' },
  turkey: { name:'Turkey', form:'turkey', palette:{body:'#78604b',shade:'#4a3d37',light:'#a48a66',face:'#617c82',faceShade:'#40565c',faceLight:'#96a9a4',eye:'#231e1b',outline:'#342c2a',beak:'#d69a4d',wattle:'#df4a43',wing:'#80604b',tailLight:'#c5a16c',leg:'#a25d3e',legLight:'#d08d52'}, shape:{bodyWidth:11,bodyHeight:10,headRadius:5.5,legWidth:2,tailWidth:16,wingLength:7}, clips:['strut','peck','flap-run','flap-attack'], stats:[32,82,0], faction:'neutral', habitat:'forest', behavior:'peck-flap-flee' },
};

function quadrupedJoints(spec) {
  const neck = spec.shape.neckLength || 4;
  // Rig positions are absolute renderer coordinates (poseAt applies clip
  // deltas but does not accumulate parent transforms). Keep the joints
  // clustered around the torso so heads, tails and feet meet at game scale.
  const j={pelvis:{parent:'',position:[0,-2,10]},chest:{parent:'pelvis',position:[0,1,12]},neck:{parent:'chest',position:[0,4,13+Math.min(neck,3)]},head:{parent:'neck',position:[0,8,16+Math.min(neck,3)]},muzzle:{parent:'head',position:[0,11,15+Math.min(neck,2)]},eyeL:{parent:'head',position:[-2,9,19+Math.min(neck,2)]},eyeR:{parent:'head',position:[2,9,19+Math.min(neck,2)]},earL:{parent:'head',position:[-4,6,21+Math.min(neck,2)]},earR:{parent:'head',position:[4,6,21+Math.min(neck,2)]},tailBase:{parent:'pelvis',position:[0,-7,11]},tailMid:{parent:'tailBase',position:[0,-12,13]},tailTip:{parent:'tailMid',position:[0,-18,15]}};
  for(const [side,s]of[['L',-1],['R',1]]){
    j['shoulder'+side]={parent:'chest',position:[s*5,3,9]};j['elbow'+side]={parent:'shoulder'+side,position:[s*7,4,5]};j['frontPaw'+side]={parent:'elbow'+side,position:[s*8,5,1]};
    j['hip'+side]={parent:'pelvis',position:[s*5,-4,8]};j['knee'+side]={parent:'hip'+side,position:[s*7,-6,4]};j['rearPaw'+side]={parent:'knee'+side,position:[s*8,-8,1]};
  }
  if(spec.shape.tailLength){j.tailTip.position=[0,-7-spec.shape.tailLength,18];}
  if(spec.shape.frillWidth){j.frill={parent:'head',position:[0,4,20]};j.frillL={parent:'head',position:[-spec.shape.frillWidth,7,18]};j.frillR={parent:'head',position:[spec.shape.frillWidth,7,18]};}
  if(spec.shape.hornLength){j.hornL={parent:'head',position:[-7,12,22]};j.hornR={parent:'head',position:[7,12,22]};j.hornTip={parent:'head',position:[0,15+spec.shape.hornLength,21]};}
  if(spec.form==='snail'){
    j.eyestalkL={parent:'head',position:[-3,11,27]};j.eyestalkR={parent:'head',position:[3,11,27]};j.shell={parent:'pelvis',position:[0,-4,17]};
  }
  return j;
}
function bipedJoints(kind){
  const j={pelvis:{parent:'',position:[0,0,8]},chest:{parent:'pelvis',position:[0,0,13]},neck:{parent:'chest',position:[0,2,17]},head:{parent:'neck',position:[0,4,20]},beak:{parent:'head',position:[0,8,18]},wattle:{parent:'head',position:[0,6,15]},wingL:{parent:'chest',position:[-7,0,12]},wingR:{parent:'chest',position:[7,0,12]},tailFan:{parent:'pelvis',position:[0,-7,10]},hipL:{parent:'pelvis',position:[-3,-2,6]},kneeL:{parent:'hipL',position:[-3,-2,3]},footL:{parent:'kneeL',position:[-3,0,1]},hipR:{parent:'pelvis',position:[3,-2,6]},kneeR:{parent:'hipR',position:[3,-2,3]},footR:{parent:'kneeR',position:[3,0,1]}};
  if(kind==='penguin'){j.beak.position=[0,7,18];j.wingL.position=[-9,0,11];j.wingR.position=[9,0,11];delete j.tailFan;}
  if(kind==='turkey'){
    j.pelvis.position=[0,0,11];j.chest.position=[0,0,15];j.neck.position=[0,2,20];j.head.position=[0,4,23];j.beak.position=[0,8,21];j.wattle.position=[1,6,18];
    j.wingL.position=[-7,0,14];j.wingR.position=[7,0,14];j.tailFan.position=[0,-9,14];
    j.wingTipL={parent:'wingL',position:[-16,-8,11]};j.wingTipR={parent:'wingR',position:[16,8,11]};
    j.hipL.position=[-3,-2,8];j.kneeL.position=[-4,-2,4];j.footL.position=[-4,-2,1];j.hipR.position=[3,2,8];j.kneeR.position=[4,2,4];j.footR.position=[4,2,1];
  }
  return j;
}
function crabJoints(){const j={pelvis:{parent:'',position:[0,0,7]},chest:{parent:'pelvis',position:[0,0,10]},head:{parent:'chest',position:[0,4,12]},eyeL:{parent:'head',position:[-3,5,17]},eyeR:{parent:'head',position:[3,5,17]},clawL:{parent:'chest',position:[-10,4,8]},clawR:{parent:'chest',position:[10,4,8]}};for(const[s,sgn]of[['L',-1],['R',1]])for(let i=0;i<3;i++){const root=`leg${i}${s}`,knee=`knee${i}${s}`,foot=`foot${i}${s}`;j[root]={parent:'pelvis',position:[sgn*5,3-i*4,5]};j[knee]={parent:root,position:[sgn*10,6-i*6,3]};j[foot]={parent:knee,position:[sgn*14,9-i*9,1]};}return j;}

// Unapproved Amethyst Softshell art study. One low foot and a single rising
// mantle carry the shell; the eight facings change the shell foreshortening,
// head placement and visible eye stalks instead of rotating a flat stamp.
function drawSnailPixelStudy(c, p, direction) {
  const dir=(Number(direction)||0)&7;
  const profile=dir===2||dir===6, rear=dir===3||dir===4||dir===5;
  const side=dir===2?-1:dir===6?1:dir<4?1:-1;
  const cx=Math.round(p.pelvis?.x||0),ground=Math.round((p.pelvis?.y||0)+10);
  const C={ink:'#342b39',shell:'#805d8e',shellShade:'#59415f',shellLight:'#ab89b0',shellGlint:'#d2b5cf',body:'#788398',bodyShade:'#51596d',bodyLight:'#a4b2be',pink:'#e346bb',pinkLit:'#ffd5f0',ground:'#1c322a'};
  const rows=(list,xoff,yoff,color,outline=false)=>{
    for(const [y,x,w] of list){
      if(outline){c.fillStyle=C.ink;c.fillRect(cx+x+xoff-1,ground+y+yoff,w+2,1);}
      c.fillStyle=color;c.fillRect(cx+x+xoff,ground+y+yoff,w,1);
    }
  };
  rows([[-1,-9,18],[0,-12,24],[1,-10,20]],0,0,C.ground);
  // Broad, low foot is the grounded anchor. The shell overlaps its rear half;
  // the head and stalks grow from the exposed leading edge.
  const foot=[[-1,-3,8],[-2,-7,17],[-3,-11,25],[-4,-13,28],[-5,-13,28],[-6,-12,26],[-7,-9,20],[-8,-6,14],[-9,-2,7]];
  rows(foot,0,0,C.ink,true);
  rows(foot.map(([y,x,w])=>[y,x+1,w-2]),0,0,C.body);
  rows([[-3,-10,12],[-4,-11,14],[-5,-9,11],[-7,-5,6]],profile?side*3:2,-1,C.bodyLight);
  rows([[-1,-6,12],[-2,-9,18],[-3,-11,21]],0,0,C.bodyShade);
  const shellX=profile?-side*8:dir===1?-7:dir===7?7:dir===3?-6:dir===5?6:-5;
  const shell=profile
    ?[[-19,-1,2],[-18,-5,10],[-17,-9,18],[-16,-12,24],[-15,-13,26],[-14,-13,26],[-13,-12,24],[-12,-10,20],[-11,-8,16],[-10,-6,12],[-9,-4,8]]
    :[[-19,-1,2],[-18,-4,8],[-17,-8,16],[-16,-11,22],[-15,-12,24],[-14,-12,24],[-13,-11,22],[-12,-9,18],[-11,-7,14],[-10,-5,10],[-9,-3,6]];
  rows(shell,shellX,4,C.ink,true);
  rows(shell.map(([y,x,w])=>[y,x+1,w-2]),shellX,4,C.shell);
  rows([[-17,-7,9],[-16,-9,13],[-15,-8,12]],shellX,4,C.shellLight);
  rows([[-17,-5,4],[-16,-7,6]],shellX,4,C.shellGlint);
  rows([[-11,-6,12],[-10,-4,8]],shellX,4,C.shellShade);
  if(profile||dir===1||dir===3||dir===5||dir===7){
    const spiralX=shellX+(profile?-side*5:side*3);
    rows([[-15,-1,3],[-14,-3,5],[-13,-4,6],[-12,-3,5],[-11,-1,3]],spiralX,4,C.shellShade);
    rows([[-14,-1,2],[-13,-2,3]],spiralX,4,C.shellLight);
  }
  const headX=profile?side*19:dir===1?16:dir===7?-16:dir===3?-14:dir===5?14:dir===4?-5:16;
  const head=[[-17,-1,2],[-16,-4,8],[-15,-6,12],[-14,-7,14],[-13,-7,14],[-12,-6,12],[-11,-4,8],[-10,-2,4]];
  if(!rear){
    const neck=[[-12,-4,8],[-11,-6,12],[-10,-8,16],[-9,-9,18],[-8,-9,18],[-7,-8,16],[-6,-7,14]];
    const neckX=profile?headX-side*9:headX-8;
    rows(neck,neckX,0,C.body);
    rows(head,headX,0,C.body);
    rows([[-14,-5,7],[-13,-5,8],[-12,-4,6]],headX,0,C.bodyLight);
    rows([[-11,-2,3]],headX+side*2,0,C.bodyShade);
  } else rows([[-12,-2,4],[-11,-4,8],[-10,-4,8],[-9,-3,6]],headX,0,C.bodyShade);
  const stalkBaseY=rear?-15:-15,eyeY=rear?-19:-21;
  const stalkX=profile?headX+side*2:headX;
  const stems=profile?[stalkX-side*2,stalkX+side*2]:[stalkX-3,stalkX+2];
  for(const ex of stems){
    const baseX=rear?(ex<shellX?ex+1:ex-1):ex, n=stalkBaseY-eyeY;
    for(let k=0;k<=n;k++){const x=baseX+(k>n*.6?Math.sign(ex-baseX):0);c.fillStyle=C.bodyShade;c.fillRect(cx+x,ground+stalkBaseY-k,1,1);}
    c.fillStyle=C.ink;c.fillRect(cx+ex-1,ground+eyeY-1,3,3);
    c.fillStyle=C.pink;c.fillRect(cx+ex-1,ground+eyeY-1,2,1);
    c.fillStyle=C.pinkLit;c.fillRect(cx+ex,ground+eyeY-1,1,1);
  }
}
function squirrelJoints(spec){
  const j=quadrupedJoints(spec);
  // Compact, alert torso with tucked forepaws and strong hindquarters. The
  // familiar editable quadruped bones stay present, but no longer use the
  // generic long, level-backed quadruped proportions.
  j.pelvis.position=[0,-2,10];j.chest.position=[0,1,13];j.neck.position=[0,3,16];j.head.position=[0,6,18];j.muzzle.position=[0,9,17];
  j.eyeL.position=[-2,7,20];j.eyeR.position=[2,7,20];j.earL.position=[-3,4,21];j.earR.position=[3,4,21];
  j.shoulderL.position=[-4,2,12];j.shoulderR.position=[4,2,12];j.elbowL.position=[-6,3,9];j.elbowR.position=[6,3,9];j.frontPawL.position=[-7,4,6];j.frontPawR.position=[7,4,6];
  j.hipL.position=[-4,-4,8];j.hipR.position=[4,-4,8];j.kneeL.position=[-5,-6,4];j.kneeR.position=[5,-6,4];j.rearPawL.position=[-5,-8,1];j.rearPawR.position=[5,-8,1];
  return j;
}
function sheepJoints(spec){
  const j=quadrupedJoints(spec);
  // Lift the fleece well above the floor, then give all four legs a clear
  // shoulder/hip → knee/elbow → hoof chain at the same world scale.
  j.pelvis.position=[0,-2,14];j.chest.position=[0,1,16];j.neck.position=[0,4,18];j.head.position=[0,8,21];j.muzzle.position=[0,11,20];
  j.eyeL.position=[-2,9,24];j.eyeR.position=[2,9,24];j.earL.position=[-4,6,25];j.earR.position=[4,6,25];
  j.shoulderL.position=[-5,3,13];j.shoulderR.position=[5,3,13];j.elbowL.position=[-7,4,8];j.elbowR.position=[7,4,8];j.frontPawL.position=[-8,5,1];j.frontPawR.position=[8,5,1];
  j.hipL.position=[-5,-4,12];j.hipR.position=[5,-4,12];j.kneeL.position=[-7,-6,6];j.kneeR.position=[7,-6,6];j.rearPawL.position=[-8,-8,1];j.rearPawR.position=[8,-8,1];
  return j;
}
function skunkJoints(spec){
  const j=quadrupedJoints(spec);
  // Lift the muzzle slightly and arc the plume above the back so the white
  // face blaze and curled tail remain distinct at native game density.
  j.head.position=[0,8,17];j.muzzle.position=[0,11,16];j.eyeL.position=[-2,9,20];j.eyeR.position=[2,9,20];
  j.tailBase.position=[0,-6,12];j.tailMid.position=[0,-12,18];j.tailTip.position=[0,-7-spec.shape.tailLength,24];
  return j;
}
function squirrelClipFor(model,action){
  const names=Object.keys(model.joints),frames=action==='leap'?10:8,loop=action!=='leap';
  return {fps:action==='scamper'?14:action==='leap'?18:7,length:frames,loop,keys:Array.from({length:frames},(_,frame)=>{
    const t=frame/frames,phase=t*Math.PI*2,joints=Object.fromEntries(names.map(n=>[n,[0,0,0]])),wave=Math.sin(phase);
    if(action==='scamper'){
      // Four-beat bound: hind legs gather and spring, forepaws tuck in flight,
      // and the large tail counter-swings through the arc.
      const lift=Math.max(0,wave),gather=Math.max(0,-wave),reach=(1-wave)*.5;
      // Exaggerate the takeoff and landing beats enough to survive the game's
      // tiny native pixels: the torso rises, forepaws reach on approach, then
      // all four limbs gather beneath the body before the next bound.
      joints.pelvis=[0,0,2+lift*17-gather*4];joints.chest=[0,0,lift*6-gather*1.8];joints.neck=[0,0,lift*2];joints.head=[0,0,-lift*2.2];
      for(const[side,sign]of[['L',1],['R',-1]]){
        joints['hip'+side]=[0,-gather*2.5,0];joints['knee'+side]=[0,sign*(2+lift*3+reach*2),lift*3-gather*2];joints['rearPaw'+side]=[0,-sign*(2+lift*3),lift*5-gather*2];
        joints['shoulder'+side]=[0,sign*lift*1.3,0];joints['elbow'+side]=[0,-sign*(1+reach*4),lift*2.6];joints['frontPaw'+side]=[0,-sign*(3+reach*5),lift*4+reach*2];
      }
      joints.tailBase=[0,0,1+lift*3];joints.tailMid=[Math.sin(phase-.45)*8,0,lift*14-gather*4];joints.tailTip=[Math.sin(phase-.9)*13,0,lift*22-gather*5];
    }else if(action==='leap'){
      const lift=[0,.08,.3,.7,1,.92,.65,.34,.1,0][frame]||0,crouch=[0,0,0,.2,.35,.25,.1,0,0,0][frame]||0;
      joints.pelvis=[0,0,lift*12-crouch*3];joints.chest=[0,lift*2,lift*4-crouch];joints.neck=[0,0,lift*2];joints.head=[0,0,-lift*1.5];
      for(const side of ['L','R']){
        joints['hip'+side]=[0,-crouch*2,0];joints['knee'+side]=[0,crouch*4,lift*2];joints['rearPaw'+side]=[0,-crouch*4,lift*3];
        joints['shoulder'+side]=[0,lift*2,0];joints['elbow'+side]=[0,-lift*2,lift*2];joints['frontPaw'+side]=[0,-lift*3,lift*4];
      }
      joints.tailBase=[0,0,lift*2];joints.tailMid=[-lift*2,0,lift*7];joints.tailTip=[-lift*4,0,lift*11];
    }else if(action==='freeze'){
      const twitch=Math.sin(phase*2);
      // Low haunch crouch, forepaws held close and plume lifted; tiny ear/head
      // checks keep the alert pose from reading as an ordinary idle.
      joints.pelvis=[0,0,-2];joints.chest=[0,0,-1];joints.head=[0,0,1+twitch*.25];joints.earL=[0,0,Math.max(0,twitch)*.5];joints.earR=[0,0,Math.max(0,-twitch)*.5];
      for(const side of ['L','R']){joints['hip'+side]=[0,0,-1];joints['knee'+side]=[0,2,-1];joints['rearPaw'+side]=[0,-2,0];joints['shoulder'+side]=[0,-1,0];joints['elbow'+side]=[0,1,-1];joints['frontPaw'+side]=[0,2,-2];}
      joints.tailBase=[0,0,1];joints.tailMid=[twitch*.6,0,2+Math.max(0,twitch)*2];joints.tailTip=[twitch,0,3+Math.max(0,twitch)*3];
    }
    return {frame,joints};
  })};
}
function clipFor(model,action){
  if(model.type==='golden_retriever'){
    const donorClip=goldenRetrieverWowClip(action);
    if(donorClip)return donorClip;
  }
  if(model.type==='llama'){
    const donorClip=llamaWowClip(action);
    if(donorClip)return donorClip;
  }
  if(model.type==='skunk'){
    const donorAction=({idle:'freeze',walk:'amble',run:'scurry'})[action]||action;
    const donorClip=skunkWowClip(donorAction);
    if(donorClip)return donorClip;
  }
  if(model.type==='sheep'){
    const donorClip=sheepWowClip(action);
    if(donorClip)return donorClip;
  }
  if(model.type==='squirrel'){
    const donorClip=squirrelWowClip(action);
    if(donorClip)return donorClip;
    if(action==='leap')return squirrelClipFor(model,action);
  }
  const names=Object.keys(model.joints),frames=action==='idle'||action==='strut'||action==='flap-run'?8:action==='flap-attack'?10:action==='walk'||action==='run'||action==='graze'?8:6;
  const loop=['idle','walk','run','graze','trot','waddle','scuttle','amble','strut','scamper','crawl','clamber','heavy-walk','quick-walk','flap-run'].includes(action);
  return {fps:loop?10:16,length:frames,loop,keys:Array.from({length:frames},(_,frame)=>{
    const t=frame/Math.max(1,frames-1),phase=t*Math.PI*2,joints=Object.fromEntries(names.map(n=>[n,[0,0,0]])),wave=Math.sin(phase),pulse=Math.sin(t*Math.PI);
    if(['walk','run','trot','waddle','scuttle','amble','strut','scamper','crawl','clamber','heavy-walk','quick-walk','graze'].includes(action)){
      const stride=action==='run'||action==='scamper'||action==='quick-walk'?6:action==='heavy-walk'?2.7:4;
      for(const[side,sign]of[['L',1],['R',-1]]){
        if(joints['frontPaw'+side])joints['frontPaw'+side]=[0,wave*stride*sign,Math.max(0,wave*sign)*2.4];
        if(joints['rearPaw'+side])joints['rearPaw'+side]=[0,-wave*stride*sign,Math.max(0,-wave*sign)*2.4];
        if(joints['foot'+side])joints['foot'+side]=[0,wave*stride*sign,Math.max(0,wave*sign)*2.2];
      }
      joints.pelvis=[0,0,Math.abs(wave)*.8];joints.head=[0,0,-Math.abs(wave)*.25];
      for(const tail of ['tailMid','tailTip','tailFan'])if(joints[tail])joints[tail]=[Math.sin(phase-.6)*2,0,Math.sin(phase-.9)*1.5];
    }
    if(['attack','pounce','charge','headbutt','pinch','short-charge'].includes(action)){
      joints.chest=[0,pulse*4,pulse*2];joints.head=[0,pulse*8,pulse*2];
      for(const n of ['frontPawL','frontPawR','clawL','clawR','hornTip'])if(joints[n])joints[n]=[0,pulse*7,pulse*5];
      if(action==='pounce'||action==='charge')joints.pelvis=[0,pulse*7,pulse*9];
    }
    if(['peck','snatch','taste'].includes(action)){joints.head=[0,pulse*5,-pulse*2];joints.muzzle=[0,pulse*7,-pulse*3];}
    if(['hide','raise-tail','spray-warning','warn','raise-claws'].includes(action)){joints.head=[0,-pulse*2,-pulse*2];joints.tailTip=[0,0,pulse*7];joints.clawL=[-pulse*3,0,pulse*5];joints.clawR=[pulse*3,0,pulse*5];}
    if(action==='dive'){joints.head=[0,pulse*7,-pulse*5];joints.wingL=[-pulse*4,0,-pulse*4];joints.wingR=[pulse*4,0,-pulse*4];}
    if(action==='slide'){joints.pelvis=[0,pulse*5,-pulse*1.5];joints.footL=[0,pulse*4,-pulse];joints.footR=[0,pulse*4,-pulse];}
    if(action==='sit'){joints.pelvis=[0,-2,-3];joints.head=[0,1,1];}
    if(action==='wag'){joints.tailMid=[Math.sin(phase*2)*5,0,1];joints.tailTip=[Math.sin(phase*2+1)*8,0,2];}
    if(action==='flap-run'){joints.wingL=[-3,0,pulse*8];joints.wingR=[3,0,pulse*8];joints.pelvis=[0,pulse*4,0];}
    if(model.type==='turkey'&&action==='strut'){
      // Keep the torso's step bounce restrained while the head makes a clear,
      // alternating forward bob like a strutting bird.
      const bob=Math.sin(phase*2),step=Math.sin(phase);
      joints.pelvis=[0,0,Math.abs(bob)*2.2];joints.chest=[0,0,Math.abs(bob)*1.4];joints.neck=[0,0,bob*2.5];joints.head=[0,0,-bob*6.5];
      joints.footL=[0,step*5.5,Math.max(0,step)*3.2];joints.footR=[0,-step*5.5,Math.max(0,-step)*3.2];
    }
    if(model.type==='turkey'&&action==='peck'){joints.head=[0,pulse*4,-pulse*3];joints.beak=[0,pulse*3,-pulse*3];joints.neck=[0,pulse*1.5,-pulse];joints.pelvis=[0,0,-pulse*.7];}
    if(model.type==='turkey'&&(action==='flap-run'||action==='flap-attack')){
      const beat=Math.cos(phase*(action==='flap-attack'?2:1)),lift=(1+beat)*.5;
      // Wide extension plus a large vertical hinge keeps the flap readable in
      // the small native sprite; the alternating cycle also affects profile views.
      joints.wingL=[0,0,0];joints.wingR=[0,0,0];joints.wingTipL=[-lift*7,-lift*6,lift*21];joints.wingTipR=[lift*7,lift*6,lift*21];joints.chest=[0,0,lift*2.2];joints.pelvis=[0,0,lift*2.8];
      if(action==='flap-attack'){const strike=Math.max(0,Math.sin(phase*2));joints.neck=[0,strike*3,-strike*2];joints.head=[0,strike*4,-strike*3];joints.beak=[0,strike*3,-strike*3];}
    }
    if(action==='freeze'){joints.head=[0,0,-2];joints.pelvis=[0,0,-1];}
    if(action==='call-for-parent'){joints.head=[0,0,4];joints.neck=[0,0,3];}
    if(action==='bleat'){joints.head=[0,0,pulse*3];joints.muzzle=[0,pulse*3,pulse*2];}
    if(action==='leap'){joints.pelvis=[0,pulse*7,pulse*10];joints.tailTip=[pulse*3,0,pulse*4];}
    if(action==='dive'){joints.pelvis=[0,pulse*4,-pulse*3];}
    if(action==='death'){joints.pelvis=[t*4,0,-t*8];joints.head=[0,0,-t*5];}
    if(action==='hurt'){joints.chest=[2*Math.sin(t*Math.PI*2),0,-2*pulse];joints.head=[0,0,-pulse*3];}
    return {frame,joints};
  })};
}
function makeRig(kind,spec){
  const joints=kind==='squirrel'?squirrelJoints(spec):kind==='sheep'?sheepJoints(spec):kind==='skunk'?skunkJoints(spec):spec.form==='crab'?crabJoints():spec.form==='penguin'||spec.form==='turkey'?bipedJoints(spec.form):quadrupedJoints(spec);
  const model={version:1,artGeneration:1,type:kind,name:spec.name,palette:clone(spec.palette),shape:clone(spec.shape),joints:Object.fromEntries(Object.entries(joints).map(([name,joint])=>[name,{parent:joint.parent,position:[...joint.position]}])),visibility:Object.fromEntries(Object.keys(joints).map(name=>[name,Array.from({length:VIEWS},(_,d)=>!name.startsWith('eye')||(![3,4,5].includes(d)&&!(name==='eyeL'&&d===6)&&!(name==='eyeR'&&d===2)))])),clips:{}};
  const actions=new Set(['idle','walk','run','attack','hurt','death',...spec.clips]);if(kind==='sheep'||kind==='skunk')actions.add('freeze');if(kind==='skunk')actions.add('scurry');for(const action of actions)model.clips[action]=clipFor(model,action);
  if(kind==='turkey'){
    // Stand retargets cleanly. Keep the donor Walk as a named candidate for
    // review, but preserve the native strut for gameplay: donor foot pivots
    // travel below the ground baseline in multiple sampled frames.
    model.clips.idle=turkeyWowClip('stand')||model.clips.idle;
    model.clips['wowhead-walk']=turkeyWowClip('walk')||model.clips.walk;
  }
  return model;
}

function paintWildlife(c,actor,time,model,suppliedPose){
  const kind=model.type,s=specs[kind];if(!s)return null;
  if(kind==='jumping_spider')return drawSpider(c,{...actor,kind:'spider'},time,model,suppliedPose);
  if(kind==='fox_kit')return drawNightRig(c,{...actor,kind:'fox',sprite:'fox'},time,{...model,type:'fox'},suppliedPose);
  const clip=model.clips[actor.animationAction||actor.state]||model.clips[actor.moving?'run':'idle']||model.clips.idle;
  const frame=Number.isFinite(actor.playerFrame)?actor.playerFrame:Number.isFinite(actor.poseTime)?actor.poseTime*(clip.length-1):actor.moving?(actor.step||0)/14*clip.length:time*clip.fps;
  const pose=suppliedPose||poseAt(model,model.clips[actor.animationAction||actor.state]?actor.animationAction||actor.state:actor.moving?'run':'idle',frame),d=facingIndex(actor.faceX,actor.faceY),p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),pal=model.palette,shape=model.shape,layers=[];
  const volume=(id,bone,rx,ry,rz,colors=pal)=>layers.push({id,bone,bones:[bone],depth:p[bone]?.depth||0,fn:()=>pixelVolume(c,pose[bone],rx,ry,rz,d,colors)});
  const line=(id,bones,points,color,width)=>layers.push({id,bone:bones[0],bones,depth:points[0].depth,fn:()=>pixelLine(c,points[0],points[1],color,width)});
  if(kind==='golden_retriever'){
    // A compact dog-specific build: the four legs are continuous, stroked
    // segments; broad haunch/chest/ruff masses overlap; face parts stay attached
    // to the same editable head pivots. Bone-bond and motion clips are untouched.
    const limb=(id,a,b,width,color=pal.body)=>{
      if(!p[a]||!p[b])return;
      const depth=(p[a].depth+p[b].depth)*.5;
      layers.push({id,bone:a,bones:[a,b],depth,fn:()=>{
        pixelLine(c,p[a],p[b],pal.outline,width+1.5);
        pixelLine(c,p[a],p[b],color,width);
      }});
    };
    for(const side of ['L','R']){
      for(const[a,b]of[['shoulder'+side,'elbow'+side],['elbow'+side,'frontPaw'+side],['hip'+side,'knee'+side],['knee'+side,'rearPaw'+side]])limb('connected '+a,a,b,3.2);
      volume('paw '+side,'frontPaw'+side,2.5,3,1.6,{...pal,body:pal.shade,light:pal.body,shade:pal.outline,outline:pal.outline});
      volume('hind paw '+side,'rearPaw'+side,2.6,3.2,1.6,{...pal,body:pal.shade,light:pal.body,shade:pal.outline,outline:pal.outline});
    }
    volume('rounded torso','pelvis',shape.bodyWidth,shape.bodyLength,shape.bodyHeight);
    volume('soft hind haunch','pelvis',shape.bodyWidth*.78,6.5,shape.bodyHeight*.86,{...pal,body:pal.body,light:pal.light,shade:pal.shade,outline:pal.body});
    volume('broad shoulder chest','chest',shape.bodyWidth*.9,7,shape.bodyHeight*.94,{...pal,body:pal.mane,light:pal.light,shade:pal.body,outline:pal.body});
    volume('connected neck','neck',5.2,5.5,6.5,{...pal,body:pal.mane,light:pal.light,shade:pal.body,outline:pal.body});
    volume('rounded head','head',5,4.6,5,{...pal,body:pal.face,light:pal.light,shade:pal.body,outline:pal.outline});
    for(const side of ['L','R'])if(p['ear'+side])volume('soft dropped ear '+side,'ear'+side,2.8,3.2,3.4,{...pal,body:pal.ear,light:pal.face,shade:pal.shade,outline:pal.outline});
    volume('cream muzzle','muzzle',3.1,3.8,2.7,{...pal,body:pal.muzzle,light:'#fff0ce',shade:pal.muzzleShade,outline:pal.body});
    // In the straight-on front projection the tail sits directly behind the
    // torso. Hiding that foreshortened strip prevents it peeking over the crown.
    if(d!==0){
      for(const[a,b]of[['tailBase','tailMid'],['tailMid','tailTip']])limb('attached tail '+a,a,b,3.3,pal.mane);
      volume('bushy golden tail','tailMid',3.3,4.3,3.6,{...pal,body:pal.mane,light:pal.light,shade:pal.body,outline:pal.body});
    }
    layers.push({id:'dark nose',bone:'muzzle',bones:['muzzle'],depth:p.muzzle.depth+.35,fn:()=>pixelVolume(c,[pose.muzzle[0],pose.muzzle[1]+1,pose.muzzle[2]+.8],1.4,1.6,1.25,d,{body:pal.nose,shade:pal.nose,light:'#594139',outline:pal.outline})});
    layers.push({id:'mouth line',bone:'muzzle',bones:['muzzle'],depth:p.muzzle.depth+.2,fn:()=>{
      if(d===0||d===1||d===7){c.fillStyle=pal.outline;c.fillRect(Math.round(p.muzzle.x)-1,Math.round(p.muzzle.y)+2,3,1);}
    }});
  }else if(kind==='llama'){
    // Dottie reference cues: a tall soft neck, small rounded face, short upright
    // ears, cream fleece and sturdy close-set legs, kept on the existing llama rig.
    for(const side of ['L','R']){
      for(const[a,b]of[['shoulder'+side,'elbow'+side],['elbow'+side,'frontPaw'+side],['hip'+side,'knee'+side],['knee'+side,'rearPaw'+side]]){
        if(!p[a]||!p[b])continue;
        const w=a.startsWith('shoulder')||a.startsWith('hip')?2.7:2.2;
        layers.push({id:'fleece leg '+a,bone:a,bones:[a,b],depth:(p[a].depth+p[b].depth)*.5,fn:()=>{pixelLine(c,p[a],p[b],pal.outline,w+1.2);pixelLine(c,p[a],p[b],pal.shade,w);}});
      }
      volume('llama hoof '+side,'rearPaw'+side,1.8,2.2,1.5,{...pal,body:pal.shade,light:pal.face,shade:pal.outline});
      volume('llama front hoof '+side,'frontPaw'+side,1.8,2.2,1.5,{...pal,body:pal.shade,light:pal.face,shade:pal.outline});
    }
    volume('rounded fleece barrel','pelvis',shape.bodyWidth,shape.bodyLength,shape.bodyHeight,{...pal,body:pal.body,light:pal.light,shade:pal.shade,outline:pal.outline});
    volume('fluffy shoulder','chest',shape.bodyWidth*.72,6.2,shape.bodyHeight*.78,{...pal,body:pal.light,light:'#fff2dc',shade:pal.body,outline:pal.body});
    // A clearly elongated fleece column gives the llama its recognizable
    // upright neck without moving or replacing any of the saved rig joints.
    volume('long upright fleece neck','neck',4.1,4.8,16.2,{...pal,body:pal.light,light:'#fff2dc',shade:pal.body,outline:pal.body});
    volume('soft rounded llama crown','head',5.6,4.5,6,{...pal,body:pal.light,light:'#fff2dc',shade:pal.body,outline:pal.outline});
    volume('small friendly llama muzzle','muzzle',2.8,3.2,2.4,{...pal,body:pal.muzzle,light:pal.light,shade:pal.face,outline:pal.outline});
    for(const side of ['L','R'])if(p['ear'+side]){
      volume('upright fleece ear '+side,'ear'+side,1.25,1.6,4.5,{...pal,body:pal.ear,light:pal.face,shade:pal.shade,outline:pal.outline});
      layers.push({id:'ear inner '+side,bone:'ear'+side,bones:['ear'+side],depth:p['ear'+side].depth+.15,fn:()=>pixelLine(c,p['ear'+side],projectPoint([pose['ear'+side][0],pose['ear'+side][1]+.35,pose['ear'+side][2]+1],d),'#d8aa91',1)});
    }
    for(const[a,b]of[['tailBase','tailMid'],['tailMid','tailTip']])if(p[a]&&p[b])line('short fleece tail '+a,[a,b],[p[a],p[b]],pal.shade,2.5);
  }else if(kind==='triceratops'){
    // Jammer reference cues: armored shoulder mass, a wide fan frill, two long
    // brow horns and one nose horn. The baby variant and behavior stay untouched.
    for(const side of ['L','R'])for(const[a,b,w]of[['shoulder'+side,'elbow'+side,4.1],['elbow'+side,'frontPaw'+side,3.8],['hip'+side,'knee'+side,4.2],['knee'+side,'rearPaw'+side,3.8]])if(p[a]&&p[b]){
      layers.push({id:'armored limb '+a,bone:a,bones:[a,b],depth:(p[a].depth+p[b].depth)*.5,fn:()=>{pixelLine(c,p[a],p[b],pal.outline,w+1.4);pixelLine(c,p[a],p[b],pal.shade,w);}});
    }
    for(const side of ['L','R']){
      volume('heavy hoof '+side,'frontPaw'+side,3.2,3.6,2,{...pal,body:pal.shade,light:pal.body,shade:pal.outline});
      volume('hind hoof '+side,'rearPaw'+side,3.2,3.6,2,{...pal,body:pal.shade,light:pal.body,shade:pal.outline});
    }
    volume('deep armored torso','pelvis',shape.bodyWidth,shape.bodyLength,shape.bodyHeight,{...pal,body:pal.body,light:pal.light,shade:pal.shade,outline:pal.outline});
    volume('raised shoulder armor','chest',shape.bodyWidth*.86,7.5,shape.bodyHeight*.9,{...pal,body:pal.light,light:'#dec18b',shade:pal.body,outline:pal.outline});
    if(p.frill)volume('wide raised shield frill','frill',shape.frillWidth*1.4,7,8.5,{...pal,body:pal.frill,light:pal.light,shade:pal.shade,outline:pal.outline});
    if(p.head)volume('horned head','head',shape.headRadius,5,5.6,{...pal,body:pal.face,light:pal.light,shade:pal.body,outline:pal.outline});
    if(p.frill&&p.frillL&&p.frillR){
      for(const side of ['L','R'])line('frill rim '+side,['frill','frill'+side],[p.frill,p['frill'+side]],pal.light,2.1);
      line('frill crest',['frill','head'],[p.frill,p.head],pal.light,2);
    }
    for(const side of ['L','R'])if(p['horn'+side]){
      line('brow horn dark '+side,['head','horn'+side],[p.head,p['horn'+side]],pal.outline,4.8);
      line('brow horn bone '+side,['head','horn'+side],[p.head,p['horn'+side]],pal.horn,2.6);
    }
    if(p.hornTip){line('nose horn dark',['head','hornTip'],[p.head,p.hornTip],pal.outline,4);line('nose horn bone',['head','hornTip'],[p.head,p.hornTip],pal.horn,2);}
    if(p.muzzle)volume('blunt beaked muzzle','muzzle',3.6,4.2,3,{...pal,body:pal.face,light:pal.light,shade:pal.shade,outline:pal.outline});
    if(p.tailBase&&p.tailTip)line('low tail',['tailBase','tailTip'],[p.tailBase,p.tailTip],pal.shade,2.5);
  }else if(kind==='snail'){
    // Build the shell, living mantle and face as overlapping rounded masses
    // on the real eight-way rig, rather than a flat shell stamp over a plate.
    volume('grounded soft foot','pelvis',8,13,3,{...pal,body:pal.body,shade:pal.shade,light:pal.light,outline:pal.outline});
    if(p.shell)volume('amethyst shell','shell',12,11,9,{...pal,body:pal.shell,light:pal.shellLight,shade:pal.shellShade,outline:pal.outline});
    if(p.head)volume('raised snail head','head',5.5,5,5,{...pal,body:pal.face,light:pal.light,shade:pal.body,outline:pal.outline});
    for(const side of ['L','R'])if(p['eyestalk'+side]){
      const eye=p['eyestalk'+side];
      layers.push({id:'attached eye stalk '+side,bone:'head',bones:['head','eyestalk'+side],depth:eye.depth+.2,fn:()=>{
        pixelLine(c,p.head,eye,pal.outline,2);
        pixelLine(c,p.head,eye,pal.body,1);
        c.fillStyle=pal.outline;c.fillRect(Math.round(eye.x)-2,Math.round(eye.y)-2,4,4);
        c.fillStyle=pal.eye;c.fillRect(Math.round(eye.x)-1,Math.round(eye.y)-1,2,2);
      }});
    }
  }else if(s.form==='crab'){
    for(const side of ['L','R'])for(let i=0;i<3;i++){
      const root=`leg${i}${side}`,knee=`knee${i}${side}`,foot=`foot${i}${side}`;
      for(const [a,b] of [[root,knee],[knee,foot]])if(p[a]&&p[b]){
        line(`leg outline ${a}`,[a,b],[p[a],p[b]],pal.outline,shape.legWidth+2);
        layers.push({id:`leg fill ${a}`,bone:a,bones:[a,b],depth:p[a].depth+.1,fn:()=>pixelLine(c,p[a],p[b],pal.body,shape.legWidth)});
      }
    }
    for(const side of ['L','R'])if(p['claw'+side]){
      const shoulder=side==='L'?'clawL':'clawR';
      line('pincer arm '+side,['chest',shoulder],[p.chest,p[shoulder]],pal.outline,4);
      layers.push({id:'pincer arm fill '+side,bone:'chest',bones:['chest',shoulder],depth:p.chest.depth+.1,fn:()=>pixelLine(c,p.chest,p[shoulder],pal.body,2)});
      volume('broad open pincer '+side,shoulder,shape.clawWidth*1.75,6.5,5.6,{...pal,body:pal.claw,light:pal.light,shade:pal.shade});
      const claw=p[shoulder],chest=p.chest;
      if(claw&&chest)layers.push({id:'open pincer tips '+side,bone:shoulder,bones:[shoulder],depth:claw.depth+.28,fn:()=>{
        const dx=claw.x-chest.x,dy=claw.y-chest.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
        const at=(along,across)=>({x:Math.round(claw.x+ux*along*1.35+nx*across*1.35),y:Math.round(claw.y+uy*along*1.35+ny*across*1.35)});
        const outline=[at(-1,2),at(1,2),at(4,3),at(3,1),at(1,0),at(3,-1),at(4,-3),at(1,-2),at(-1,-2)];
        pixelPolygon(c,outline,pal.outline);
        const fill=[at(-1,1),at(1,1),at(3,2),at(2,1),at(1,0),at(2,-1),at(3,-2),at(1,-1),at(-1,-1)];
        pixelPolygon(c,fill,pal.claw);
        const glint=[at(0,1),at(1,1),at(2,2)];
        pixelPolygon(c,glint,pal.light);
      }});
    }
    for(const side of ['L','R'])if(p['eye'+side]){
      const eye=p['eye'+side];
      layers.push({id:'eye stalk '+side,bone:'head',bones:['head','eye'+side],depth:eye.depth+.25,fn:()=>{
        pixelLine(c,p.head,eye,pal.outline,2);
        pixelLine(c,p.head,eye,pal.body,1);
        c.fillStyle=pal.outline;c.fillRect(Math.round(eye.x)-2,Math.round(eye.y)-2,4,4);
        c.fillStyle=pal.eye;c.fillRect(Math.round(eye.x)-1,Math.round(eye.y)-1,2,2);
      }});
    }
    volume('carapace','chest',shape.bodyWidth,shape.bodyLength,shape.bodyHeight);
    volume('front shell sheen','chest',shape.bodyWidth*.58,shape.bodyLength*.7,shape.bodyHeight*.6,{...pal,body:pal.light,shade:pal.body,outline:pal.body});
    volume('face','head',shape.headRadius,3,3,{...pal,body:pal.face,light:pal.light});
  }else if(s.form==='penguin'||s.form==='turkey'){
    if(kind==='penguin'){
      // Flipper reads as an upright, plump bird: a navy egg, connected dark
      // crown and one broad ivory bib. The previous squat stack read as a seal.
      volume('upright penguin egg','pelvis',shape.bodyWidth*.9,6.8,shape.bodyHeight+3,{...pal,body:pal.body,light:pal.light,shade:pal.shade,outline:pal.outline});
      volume('connected dark crown','head',shape.headRadius+1.5,4.2,4.8,{...pal,body:pal.body,light:pal.light,shade:pal.shade,outline:pal.outline});
      if(d===0||d===1||d===7){
        volume('single broad ivory bib','chest',shape.bodyWidth*.67,4.8,shape.bodyHeight*.72,{...pal,body:pal.belly,light:'#fff4dc',shade:pal.belly,outline:pal.belly});
        volume('soft cheek mask','head',shape.headRadius*.82,3.3,2.8,{...pal,body:pal.belly,light:'#fff6e0',shade:pal.belly,outline:pal.belly});
      }else if(d===2||d===6){
        volume('side bib wedge','chest',2.8,4.1,shape.bodyHeight*.62,{...pal,body:pal.belly,light:'#fff4dc',shade:pal.belly,outline:pal.belly});
        volume('side cheek flash','head',2,2.6,2.5,{...pal,body:pal.belly,light:pal.belly,shade:pal.belly,outline:pal.belly});
      }
      for(const side of ['L','R']){
        const start=p['wing'+side];
        const tip=projectPoint([pose['wing'+side][0]*1.32,pose['wing'+side][1]+(side==='L'?-shape.flipperLength-1:shape.flipperLength+1),pose['wing'+side][2]-5],d);
        if(start){
          const shoulder={x:start.x,y:start.y+1},wrist={x:tip.x,y:tip.y-2};
          pixelLine(c,shoulder,wrist,pal.outline,6);
          pixelLine(c,{x:shoulder.x+(side==='L'?1:-1),y:shoulder.y},{x:wrist.x+(side==='L'?1:-1),y:wrist.y},pal.body,3.5);
          pixelPolygon(c,[{x:wrist.x-2,y:wrist.y-1},{x:wrist.x+2,y:wrist.y-2},{x:wrist.x+3,y:wrist.y+1},{x:wrist.x,y:wrist.y+3},{x:wrist.x-2,y:wrist.y+1}],pal.outline);
          pixelPolygon(c,[{x:wrist.x-1,y:wrist.y},{x:wrist.x+1,y:wrist.y-1},{x:wrist.x+2,y:wrist.y+1},{x:wrist.x,y:wrist.y+2}],pal.light);
        }
      }
      const beak=p.beak;if(beak){const x=Math.round(beak.x),y=Math.round(beak.y);pixelPolygon(c,[{x:x-3,y:y-1},{x:x+3,y:y-1},{x:x+2,y:y+2},{x,y:y+5},{x:x-2,y:y+2}],pal.outline);pixelPolygon(c,[{x:x-2,y:y},{x:x+2,y:y},{x:x+1,y:y+2},{x,y:y+3},{x:x-1,y:y+2}],pal.beak);c.fillStyle=pal.light;c.fillRect(x-1,y,2,1);}
      const head=p.head;if(head&&(d===0||d===1||d===7)){const x=Math.round(head.x),y=Math.round(head.y);c.fillStyle=pal.outline;c.fillRect(x-3,y-1,2,3);c.fillRect(x+2,y-1,2,3);c.fillStyle=pal.eye;c.fillRect(x-2,y,1,1);c.fillRect(x+3,y,1,1);c.fillStyle='#fff6df';c.fillRect(x-2,y-1,1,1);c.fillRect(x+3,y-1,1,1);}
      for(const side of ['L','R'])if(p['foot'+side]){const f=p['foot'+side],x=Math.round(f.x),y=Math.round(f.y)+2;pixelPolygon(c,[{x:x-3,y:y-1},{x:x+3,y:y-1},{x:x+4,y:y+1},{x:x+6,y:y+2},{x:x-5,y:y+2}],pal.outline);pixelPolygon(c,[{x:x-2,y:y},{x:x+2,y:y},{x:x+4,y:y+1},{x:x-4,y:y+1}],pal.feet);}
    }else{
      volume('rounded body','pelvis',shape.bodyWidth+1,8,shape.bodyHeight+1);
      volume('broad breast','chest',shape.bodyWidth*.72,4.5,shape.bodyHeight*.72,{...pal,body:pal.body,light:pal.light,shade:pal.shade,outline:pal.outline});
      volume('head','head',shape.headRadius,4,4,{...pal,body:pal.face,light:pal.faceLight,shade:pal.faceShade});
    }
    if(kind==='turkey'){
      volume('raised neck','neck',2.3,2.8,4.2,{...pal,body:pal.face,light:pal.faceLight,shade:pal.faceShade,outline:pal.outline});
      volume('red wattle','wattle',2,2,3.6,{...pal,body:pal.wattle,light:pal.wattle,shade:pal.wattle,outline:pal.outline});
      const wattle=p.wattle;if(wattle)layers.push({id:'wattle highlight',bone:'wattle',bones:['wattle'],depth:wattle.depth+.1,fn:()=>{c.fillStyle=pal.wattle;c.fillRect(Math.round(wattle.x),Math.round(wattle.y),2,3);}});
    }
    if(kind==='turkey')for(const side of ['L','R']){
      const start=p['wing'+side],end=kind==='turkey'&&p['wingTip'+side]?p['wingTip'+side]:projectPoint([pose['wing'+side][0]*1.35,pose['wing'+side][1]+(side==='L'?-shape.wingLength:shape.wingLength),pose['wing'+side][2]-1],d);
      if(kind==='turkey'&&start&&end){
        layers.push({id:'broad hinged turkey wing '+side,bone:'wing'+side,bones:['wing'+side,'wingTip'+side],depth:Math.max(p.chest?.depth||0,start.depth,end.depth)+34,fn:()=>{
          const dx=end.x-start.x,dy=end.y-start.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,px=dx/len,py=dy/len,sign=side==='L'?1:-1;
          const at=(t,n=0,k=0)=>({x:Math.round(start.x+dx*t+nx*n+px*k),y:Math.round(start.y+dy*t+ny*n+py*k)});
          const outer=[at(0,-2),at(.35,-3.5),at(.58,-5),at(.78,-4.5),at(.9,-3),at(1,0),at(.92,2),at(.75,3.5),at(.58,4),at(.4,3),at(.2,2),at(0,2)];
          pixelPolygon(c,outer,pal.outline);
          const inner=outer.map((point,i)=>({x:Math.round(point.x+(start.x-point.x)*.22),y:Math.round(point.y+(start.y-point.y)*.22)}));pixelPolygon(c,inner,pal.wing);
          pixelLine(c,at(.22,0),at(.84,-1),pal.light,1.5);
          for(const f of [.48,.62,.76])pixelLine(c,at(f,0),at(Math.min(.98,f+.19),sign*2),pal.tailLight,1.15);
        }});
      }else{
        if(start)line('flipper '+side,['wing'+side],[start,end],pal.outline,5);
        volume('flipper '+side,'wing'+side,2.4,3.5,4,{...pal,body:pal.light,light:pal.light,shade:pal.shade,outline:pal.outline});
      }
    }
    if(kind==='turkey')volume('beak','beak',2,3,2,{...pal,body:pal.beak,light:pal.beak,shade:pal.beak,outline:pal.outline});
    if(kind==='turkey')for(const side of ['L','R'])if(p['hip'+side]&&p['knee'+side]&&p['foot'+side]){
      const hip=p['hip'+side],knee=p['knee'+side],foot=p['foot'+side];
      layers.push({id:'visible turkey shank and toes '+side,bone:'hip'+side,bones:['hip'+side,'knee'+side,'foot'+side],depth:Math.max(hip.depth,knee.depth,foot.depth)+40,fn:()=>{
        pixelLine(c,hip,knee,pal.outline,3.2);pixelLine(c,knee,foot,pal.outline,3.2);
        pixelLine(c,hip,knee,pal.leg,1.8);pixelLine(c,knee,foot,pal.leg,1.8);
        const x=Math.round(foot.x),y=Math.round(foot.y)+2;
        pixelPolygon(c,[{x:x-3,y:y-1},{x:x+2,y:y-1},{x:x+4,y:y+1},{x:x+2,y:y+2},{x:x-4,y:y+1}],pal.outline);
        pixelPolygon(c,[{x:x-2,y:y},{x:x+2,y:y},{x:x+3,y:y+1},{x:x-3,y:y+1}],pal.legLight);
        for(const toe of [-2,0,2])pixelLine(c,{x:x+toe,y:y+1},{x:x+toe+1,y:y+2},pal.beak,1.2);
      }});
    }
    if(kind==='turkey'){
      const half=d===2||d===6?4.5:d===1||d===3||d===5||d===7?8.5:11.5;
      const root=p.tailFan;
      // The fan is set behind the torso in every projection, so its broad
      // silhouette frames the bird instead of covering its head and breast.
      layers.push({id:'raised turkey tail fan',bone:'tailFan',bones:['tailFan','pelvis'],depth:root.depth-100,fn:()=>{
        const x=Math.round(root.x),y=Math.round(root.y),point=(dx,dy)=>({x:x+Math.round(dx),y:y+Math.round(dy)});
        const silhouette=[point(-half,4),point(-half*1.04,-4),point(-half*.94,-10),point(-half*.72,-15),point(-half*.4,-19),point(0,-21),point(half*.4,-19),point(half*.72,-15),point(half*.94,-10),point(half*1.04,-4),point(half,4),point(half*.45,5),point(0,5),point(-half*.45,5)];
        pixelPolygon(c,silhouette,pal.outline);
        const inner=[point(-half*.88,2),point(-half*.93,-4),point(-half*.82,-9),point(-half*.62,-14),point(-half*.35,-17),point(0,-19),point(half*.35,-17),point(half*.62,-14),point(half*.82,-9),point(half*.93,-4),point(half*.88,2),point(half*.4,3),point(0,3),point(-half*.4,3)];
        pixelPolygon(c,inner,pal.wing);
        // A broad warm outer rim frames the fan; sparse radial shafts preserve
        // the feather read without reducing the silhouette to a striped disk.
        pixelLine(c,point(-half*.72,-15),point(-half*.36,-18),pal.tailLight,1.5);
        pixelLine(c,point(-half*.36,-18),point(0,-20),pal.tailLight,1.5);
        pixelLine(c,point(0,-20),point(half*.36,-18),pal.tailLight,1.5);
        pixelLine(c,point(half*.36,-18),point(half*.72,-15),pal.tailLight,1.5);
        for(let feather=-3;feather<=3;feather++){
          const end=point(feather*half/3,-8-Math.max(0,2-Math.abs(feather)));
          pixelLine(c,point(0,2),end,Math.abs(feather)%2?pal.shade:pal.tailLight,1);
        }
      }});
    }
  }else{
    for(const side of ['L','R'])for(const pair of [['shoulder','elbow'],['elbow','frontPaw'],['hip','knee'],['knee','rearPaw']]){const a=pair[0]+side,b=pair[1]+side;if(p[a]&&p[b])line(a,[a,b],[p[a],p[b]],pal.outline,shape.legWidth+1);}
    if(p.pelvis)volume(kind==='sheep'?'woolly oval body':'body','pelvis',shape.bodyWidth,shape.bodyLength,shape.bodyHeight);
    if(kind==='golden_retriever'&&p.neck)volume('connected golden neck ruff','neck',5.5,5,6.2,{...pal,body:pal.mane,light:'#f4d88b',shade:pal.body,outline:pal.body});
    if(p.chest)volume('chest','chest',shape.bodyWidth*.72,6,shape.bodyHeight*.76,{...pal,body:pal.light,light:pal.light});
    if(kind==='squirrel'&&p.chest){
      volume('warm cream chest bib','chest',shape.bodyWidth*.56,3.4,shape.bodyHeight*.65,{...pal,body:pal.belly,light:'#f3e7ce',shade:pal.muzzle,outline:pal.body});
      if(p.head&&[0,1,2,6,7].includes(d))layers.push({id:'cream squirrel cheeks',bone:'head',bones:['head'],depth:p.head.depth+.06,fn:()=>{
        const side=d===2?1:d===6?-1:0,x=Math.round(p.head.x+side),y=Math.round(p.head.y);
        const mask=d===2||d===6
          ?[{x:x-1,y:y+1},{x:x+1,y:y+1},{x:x+1,y:y+2},{x:x,y:y+3},{x:x-1,y:y+2}]
          :[{x:x-3,y:y+1},{x:x+3,y:y+1},{x:x+3,y:y+2},{x:x+2,y:y+3},{x:x-2,y:y+3},{x:x-3,y:y+2}];
        pixelPolygon(c,mask,pal.muzzle);
        c.fillStyle=pal.belly;c.fillRect(x-1,y+2,2,1);
      }});
      for(const side of ['L','R'])if(p['ear'+side]){
        const ear=p['ear'+side];layers.push({id:'russet ear inset '+side,bone:'head',bones:['head','ear'+side],depth:ear.depth+.18,fn:()=>{
          const x=Math.round(ear.x),y=Math.round(ear.y);
          if(d===0||d===1||d===7||d===2||d===6){c.fillStyle=pal.muzzle;c.fillRect(x-1,y-1,2,2);}
        }});
      }
    }
    if(kind==='skunk'&&p.head){
      // A soft facial blaze and pale cheek patches make the tiny dark face
      // read as a friendly skunk instead of a generic black quadruped.
      layers.push({id:'soft skunk face blaze',bone:'head',bones:['head'],depth:p.head.depth+.12,fn:()=>{
        const x=Math.round(p.head.x),y=Math.round(p.head.y);
        if([0,1,7].includes(d))pixelPolygon(c,[{x:x-1,y:y-3},{x:x+1,y:y-3},{x:x+2,y:y-1},{x:x+1,y:y+1},{x,y:y+2},{x:x-1,y:y+1},{x:x-2,y:y-1}],pal.stripe);
        if([0,1,7,2,6].includes(d)){
          const side=d===2?1:d===6?-1:0;
          pixelPolygon(c,[{x:x+side-3,y:y+1},{x:x+side-1,y:y},{x:x+side+2,y:y},{x:x+side+3,y:y+2},{x:x+side+1,y:y+3},{x:x+side-2,y:y+3}],pal.muzzle);
          c.fillStyle=pal.body;c.fillRect(x+side-1,y+2,2,1);
        }
      }});
    }
    if(p.head&&kind!=='triceratops'&&kind!=='baby_triceratops')volume('head','head',kind==='squirrel'||kind==='golden_retriever'?shape.headRadius+1:shape.headRadius,kind==='squirrel'||kind==='golden_retriever'?4.4:4,kind==='squirrel'?4.8:kind==='golden_retriever'?5:4,{...pal,body:pal.face,light:pal.light,shade:pal.shade});
    if(p.muzzle)volume('muzzle','muzzle',s.form==='quadruped'&&kind==='golden_retriever'?3:2,3,2,{...pal,body:pal.muzzle||pal.face,light:pal.light,shade:pal.shade,outline:pal.outline});
    if(p.tailBase&&p.tailTip){
      if(kind==='squirrel'){
        // A single curled plume replaces the old three blocky tail pillows.
        // It follows the same editable tail joints while staying one readable
        // warm silhouette in every projected facing.
        if(p.tailBase&&p.tailMid&&p.tailTip)layers.push({id:'curled squirrel tail',bone:'tailBase',bones:['tailBase','tailMid','tailTip'],depth:(p.tailBase.depth+p.tailMid.depth+p.tailTip.depth)/3-(d===0||d===4?100:0),fn:()=>{
          // The earlier wider version still read as a small tail in profile.
          // Give it a broad, rounded curl whose main mass reaches roughly the
          // squirrel's head-to-body height, then taper into the same tail tip.
          // The projected joint path still turns the plume with each facing.
          const path=[p.tailBase,p.tailMid,p.tailTip],steps=8,headOn=d===0||d===4;
          const widths=headOn?[2.4,4.2,6.0,7.7,8.7,8.4,7.5,5.1,1.4]:[2.8,5.0,7.5,9.2,10.0,9.4,8.2,5.8,1.6],centers=[];
          if(headOn){
            // When the tail axis points into the camera, projection collapses
            // all three joints to a line. Resolve the visible back as a
            // rounded curl behind the haunch, and let the body occlude its
            // center instead of stamping a disk over the head or torso.
            const root={x:path[0].x,y:path[0].y+5},mirror=d===4?-1:1;
            const curl=[[0,2],[-2,1],[-4,-2],[-4,-5],[-2,-8],[2,-10],[6,-10],[8,-7],[8,-3]];
            for(const [x,y]of curl)centers.push({x:root.x+x*mirror,y:root.y+y});
          }else for(let i=0;i<=steps;i++){
            const t=i/steps,seg=t<=.5?0:1,local=seg===0?t*2:(t-.5)*2,a=path[seg],b=path[seg+1];
            centers.push({x:a.x+(b.x-a.x)*local,y:a.y+(b.y-a.y)*local});
          }
          const contour=scale=>{
            const points=[];
            for(let i=0;i<=steps;i++){
              const before=centers[Math.max(0,i-1)],after=centers[Math.min(steps,i+1)],dx=after.x-before.x,dy=after.y-before.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,w=widths[i]*scale;
              points.push({x:Math.round(centers[i].x+nx*w),y:Math.round(centers[i].y+ny*w)});
            }
            for(let i=steps;i>=0;i--){
              const before=centers[Math.max(0,i-1)],after=centers[Math.min(steps,i+1)],dx=after.x-before.x,dy=after.y-before.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,w=widths[i]*scale;
              points.push({x:Math.round(centers[i].x-nx*w),y:Math.round(centers[i].y-ny*w)});
            }
            return points;
          };
          pixelPolygon(c,contour(1),pal.outline);
          pixelPolygon(c,contour(.8),pal.tail);
          const highlight=[];
          for(let i=2;i<=5;i++)highlight.push({x:Math.round(centers[i].x+1),y:Math.round(centers[i].y-1)});
          pixelLine(c,highlight[0],highlight[highlight.length-1],pal.tailLight,2.2);
          c.fillStyle=pal.muzzle;c.fillRect(Math.round(centers[5].x),Math.round(centers[5].y),2,2);
        }});
        if(p.earL)volume('round ear L','earL',2.2,1.8,2.5,{...pal,body:pal.body,light:pal.tailLight,shade:pal.shade,outline:pal.outline});
        if(p.earR)volume('round ear R','earR',2.2,1.8,2.5,{...pal,body:pal.body,light:pal.tailLight,shade:pal.shade,outline:pal.outline});
      }else line('tail',['tailBase','tailMid','tailTip'],[p.tailBase,p.tailMid,p.tailTip],pal.outline,shape.tailWidth||2);
      if(kind==='golden_retriever'&&p.tailMid)volume('soft golden tail tuft','tailMid',3.2,4.1,3.2,{...pal,body:pal.mane,light:pal.light,shade:pal.body,outline:pal.body});
    }
    if(kind==='snail'&&p.shell)volume('amethyst shell','shell',shape.shellWidth,shape.shellLength,shape.shellHeight,{...pal,body:pal.shell,light:pal.shellLight,shade:pal.shellShade,outline:pal.outline});
    if(kind==='triceratops'||kind==='baby_triceratops'){
      if(p.frill){
        layers.push({id:'frill',bone:'frill',bones:['frill','head'],depth:p.frill.depth-.25,fn:()=>pixelVolume(c,pose.frill,shape.frillWidth,5,5,d,{...pal,body:pal.frill,light:pal.light,shade:pal.shade,outline:pal.outline})});
        for(const side of ['L','R'])if(p['frill'+side])line('frill rim '+side,['frill','frill'+side],[p.frill,p['frill'+side]],pal.light,2);
      }
      if(p.head)volume('head','head',shape.headRadius,4,4,{...pal,body:pal.face,light:pal.light});
      if(p.hornTip)line('nose horn',['head','hornTip'],[p.head,p.hornTip],pal.horn,3);
      for(const side of ['L','R'])if(p['horn'+side])line('brow horn '+side,['head','horn'+side],[p.head,p['horn'+side]],pal.horn,2);
    }
    if(kind==='sheep'){
      // One continuous fleece mass carries the silhouette; a few edge scallops
      // describe wool without dotting the full body.
      volume('full rounded fleece mantle','pelvis',shape.bodyWidth*1.24,shape.bodyLength*1.02,shape.bodyHeight*1.12,{...pal,body:pal.wool,light:pal.light,shade:pal.body,outline:pal.outline});
      volume('connected fleece shoulders','chest',shape.bodyWidth*1.04,6.6,shape.bodyHeight*.94,{...pal,body:pal.wool,light:pal.light,shade:pal.body,outline:pal.outline});
      for(let i=0;i<5;i++){
        const t=(i-2)/2,center=projectPoint([pose.pelvis[0]+t*shape.bodyWidth*.8,pose.pelvis[1]+2,pose.pelvis[2]+shape.bodyHeight*.55],d);
        layers.push({id:'fleece scallop '+i,bone:'pelvis',bones:['pelvis'],depth:center.depth+.15,fn:()=>{
          c.fillStyle=pal.shade;c.fillRect(Math.round(center.x)-2,Math.round(center.y),5,3);
          c.fillStyle=pal.wool;c.fillRect(Math.round(center.x)-2,Math.round(center.y)-1,4,2);
        }});
      }
      if(p.head){
        volume('dark sheep face','head',shape.headRadius*.83,3.2,4.5,{...pal,body:pal.face,light:pal.muzzle,shade:pal.outline,outline:pal.outline});
        volume('soft sheep muzzle','muzzle',2.4,2.4,1.8,{...pal,body:pal.muzzle,light:pal.light,shade:pal.face,outline:pal.face});
        layers.push({id:'short fleece ears',bone:'head',bones:['head'],depth:p.head.depth+.2,fn:()=>{
          for(const side of [-1,1]){
            const base=projectPoint([pose.head[0]+side*3.1,pose.head[1]+1.2,pose.head[2]+.5],d);
            const tip=projectPoint([pose.head[0]+side*5.6,pose.head[1]+1.7,pose.head[2]+1.3],d);
            const inner=projectPoint([pose.head[0]+side*4.2,pose.head[1]+.7,pose.head[2]+.7],d);
            pixelPolygon(c,[{x:Math.round(base.x),y:Math.round(base.y)},{x:Math.round(tip.x),y:Math.round(tip.y)},{x:Math.round(inner.x),y:Math.round(inner.y)}],pal.face);
          }
        }});
      }
      for(const side of ['L','R'])for(const pair of [['shoulder','elbow'],['elbow','frontPaw'],['hip','knee'],['knee','rearPaw']]){
        const a=pair[0]+side,b=pair[1]+side;if(!p[a]||!p[b])continue;
        layers.push({id:'warm grey articulated sheep leg '+a,bone:a,bones:[a,b],depth:(p[a].depth+p[b].depth)*.5+.03,fn:()=>pixelLine(c,p[a],p[b],pal.shade,Math.max(1.5,shape.legWidth-1.1))});
      }
      for(const hoof of ['frontPawL','frontPawR','rearPawL','rearPawR'])if(p[hoof])layers.push({id:'small split sheep hoof '+hoof,bone:hoof,bones:[hoof],depth:p[hoof].depth+.12,fn:()=>pixelVolume(c,pose[hoof],1.55,2,1.1,d,{...pal,body:'#4b4542',light:'#776c60',shade:'#373638',outline:'#332f30'})});
    }
    if(kind==='squirrel'&&p.eyeL){const e=p.eyeL;layers.push({id:'bright squirrel eye',bone:'head',bones:['head','eyeL'],depth:e.depth+.18,fn:()=>{c.fillStyle=pal.outline;c.fillRect(Math.round(e.x)-1,Math.round(e.y)-1,3,3);c.fillStyle='#fff0ce';c.fillRect(Math.round(e.x)-1,Math.round(e.y)-1,1,1);}});}
    if(kind==='skunk'&&p.tailBase&&p.tailMid&&p.tailTip){
      layers.push({id:'fluffy curled skunk tail with cream stripe',bone:'tailBase',bones:['tailBase','tailMid','tailTip'],depth:Math.max(p.pelvis?.depth||0,p.tailBase.depth,p.tailMid.depth,p.tailTip.depth)+.15,fn:()=>{
        const path=[p.tailBase,p.tailMid,p.tailTip],centers=[],steps=8,widths=[1.8,4.2,6.8,8.6,9.2,8.3,6.3,3.8,1.4];
        for(let i=0;i<=steps;i++){const t=i/steps,seg=t<=.5?0:1,u=seg===0?t*2:(t-.5)*2,a=path[seg],b=path[seg+1];centers.push({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u});}
        const contour=scale=>{const points=[];for(let i=0;i<=steps;i++){const before=centers[Math.max(0,i-1)],after=centers[Math.min(steps,i+1)],dx=after.x-before.x,dy=after.y-before.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,w=widths[i]*scale;points.push({x:Math.round(centers[i].x+nx*w),y:Math.round(centers[i].y+ny*w)});}for(let i=steps;i>=0;i--){const before=centers[Math.max(0,i-1)],after=centers[Math.min(steps,i+1)],dx=after.x-before.x,dy=after.y-before.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,w=widths[i]*scale;points.push({x:Math.round(centers[i].x-nx*w),y:Math.round(centers[i].y-ny*w)});}return points;};
        pixelPolygon(c,contour(1),pal.outline);pixelPolygon(c,contour(.8),pal.tail);
        pixelLine(c,centers[2],centers[7],pal.stripe,4.8);pixelLine(c,centers[4],centers[7],pal.light,1.7);
        const tip=centers[8],x=Math.round(tip.x),y=Math.round(tip.y);pixelPolygon(c,[{x:x-2,y},{x:x-1,y:y-2},{x:x+1,y:y-2},{x:x+2,y},{x:x+1,y:y+2},{x:x-1,y:y+2}],pal.stripe);
      }});
    }
    if(kind==='llama')for(const side of ['L','R'])if(p['ear'+side])volume('long upright fleece ear '+side,'ear'+side,1.8,2.2,shape.earLength/2,{...pal,body:pal.mane,light:pal.light,shade:pal.shade,outline:pal.outline});
    if(kind==='golden_retriever')for(const side of ['L','R'])if(p['ear'+side])volume('soft dropped golden ear '+side,'ear'+side,2.8,2.4,shape.earLength*.8,{...pal,body:pal.ear,light:pal.mane,shade:pal.shade,outline:pal.outline});
  }
  if(kind==='golden_retriever')for(const side of ['L','R'])if(p['eye'+side]&&model.visibility[`eye${side}`]?.[d]!==false){const eye=p['eye'+side];layers.push({id:'gentle eye '+side,bone:'head',bones:['head','eye'+side],depth:eye.depth+.22,fn:()=>{c.fillStyle=pal.outline;c.fillRect(Math.round(eye.x)-1,Math.round(eye.y)-1,3,3);c.fillStyle=pal.eye;c.fillRect(Math.round(eye.x),Math.round(eye.y),1,2);c.fillStyle='#fff0cf';c.fillRect(Math.round(eye.x)-1,Math.round(eye.y)-1,1,1);}});}
  else if(kind==='llama')for(const side of ['L','R'])if(p['eye'+side]&&model.visibility[`eye${side}`]?.[d]!==false){const eye=p['eye'+side];layers.push({id:'sweet llama eye '+side,bone:'head',bones:['head','eye'+side],depth:eye.depth+.18,fn:()=>{c.fillStyle=pal.outline;c.fillRect(Math.round(eye.x)-1,Math.round(eye.y)-1,3,3);c.fillStyle=pal.eye;c.fillRect(Math.round(eye.x),Math.round(eye.y)-1,1,2);c.fillStyle='#fff9e8';c.fillRect(Math.round(eye.x)-1,Math.round(eye.y)-1,1,1);}});}
  else if(kind==='skunk')for(const side of ['L','R'])if(p['eye'+side]){const eye=p['eye'+side];layers.push({id:'bright friendly skunk eye '+side,bone:'head',bones:['head','eye'+side],depth:eye.depth+.12,fn:()=>{c.fillStyle=pal.outline;c.fillRect(Math.round(eye.x)-1,Math.round(eye.y)-1,3,3);c.fillStyle=pal.eye;c.fillRect(Math.round(eye.x),Math.round(eye.y)-1,1,2);c.fillStyle='#fff8df';c.fillRect(Math.round(eye.x)-1,Math.round(eye.y)-1,1,1);}});}
  else if(kind!=='snail'&&kind!=='crab')for(const side of ['L','R'])if(p['eye'+side]){const eye=p['eye'+side];layers.push({id:'Eye '+side,bone:'head',bones:['head','eye'+side],depth:eye.depth+.1,fn:()=>{c.fillStyle=pal.eye;c.fillRect(Math.round(eye.x)-1,Math.round(eye.y)-1,2,2);}});}
  paintLayers(layers,model,d,c,p);return p;
}

const existingFox=requestedCreatureDefaults(defaultNightMotion('fox'),'fox');existingFox.type='fox_kit';existingFox.name='Copperfur fox kit / original game art + exact Copperfur motion';
// The ear triangles use absolute model coordinates. Keep their bases beside
// the crown and draw them over the skull so the roots stay visibly attached.
existingFox.joints.earL.position=[-3.6,10,23.5];existingFox.joints.earR.position=[3.6,10,23.5];
existingFox.renderOrder=Array.from({length:8},()=>['Fox bushy tail','Fox rear leg L','Fox rear leg R','Fox body','Fox neck ruff','Fox front leg L','Fox front leg R','Fox head','Fox tall ear L','Fox tall ear R','Fox cream muzzle','Fox eye L','Fox eye R']);
const spider=clone(defaultSpiderMotion('jumping_spider'));spider.type='jumping_spider';spider.name='Bouncer / native pounce over Bouncer Wowhead locomotion';spider.palette={...spider.palette,body:'#6b5141',face:'#86634b',light:'#bd9777',eye:'#e9dca7',band:'#a88061'};
spider.clips.pounce=clipFor(spider,'pounce');
const models=Object.fromEntries(Object.entries(specs).map(([kind,s])=>[kind,kind==='fox_kit'?existingFox:kind==='jumping_spider'?spider:makeRig(kind,s)]));
models.golden_retriever.motionDonorRevision=1;
models.golden_retriever.provenance=clone(goldenRetrieverWowMotionProvenance);
for(const [action,clip] of Object.entries(TRICERATOPS_WOW_MOTION.clips))models.triceratops.clips[`wowhead-${action}`]=clone(clip);
models.triceratops.motionDonorRevision=1;
models.triceratops.provenance=clone(TRICERATOPS_WOW_MOTION.provenance);
function validateModel(kind,m){const baseline=models[kind];if(!baseline||m?.type!==kind||!m.joints||!m.palette||!m.shape||!m.clips)return false;for(const [name,j]of Object.entries(baseline.joints))if(!m.joints[name]||!Array.isArray(m.joints[name].position)||m.joints[name].position.length!==3||m.joints[name].position.some(v=>!Number.isFinite(v)))return false;return Object.values(m.visibility||{}).every(v=>Array.isArray(v)&&v.length===8&&v.every(x=>typeof x==='boolean'));}
function defaultFor(kind){return()=>clone(models[kind]);}
function replaceFor(kind){return model=>{if(!validateModel(kind,model))throw Error('Invalid wildlife rig: '+kind);for(const key of Object.keys(models[kind]))delete models[kind][key];Object.assign(models[kind],clone(model));};}
const subject=(kind,s)=>({name:s.name,data:models[kind],defaults:defaultFor(kind),replace:replaceFor(kind),draw:(c,a,t,m=models[kind],pose=null)=>paintWildlife(c,{...a,kind},t,m,pose),sprite:kind==='fox_kit'?'fox':kind,selected:models[kind].joints.head?'head':'pelvis',palette:Object.keys(models[kind].palette),shapeKeys:Object.keys(models[kind].shape),tracks:Object.keys(models[kind].joints).filter(n=>/^(head|tail|frontPaw|rearPaw|foot|claw|horn|shell|wing)/.test(n)).slice(0,8),clip:kind==='fox_kit'?'walk':'run',scale:kind==='squirrel'||kind==='baby_triceratops'?7:kind==='crab'||kind==='snail'?6:5});
const subjects=Object.fromEntries(Object.entries(specs).map(([kind,s])=>[kind,subject(kind,s)]));
const defaults=Object.fromEntries(Object.entries(specs).map(([kind,s])=>{
  const rigType=s.form==='penguin'||s.form==='turkey'?'winged':'quadruped';
  const enemy=['jumping_spider','crab','triceratops'].includes(kind);
  const behaviors={health:true,loot:enemy,hunt:enemy,melee:enemy,jump:['jumping_spider','squirrel','baby_triceratops'].includes(kind),dash:kind==='jumping_spider',flee:['fox_kit','llama','penguin','skunk','sheep','squirrel','turkey'].includes(kind),territorial:kind==='triceratops',bondWithBone:kind==='golden_retriever',webs:false};
  const stats={hp:s.stats[0],speed:s.stats[1],damage:s.stats[2],detection:kind==='jumping_spider'?220:kind==='triceratops'?180:100,attackRange:kind==='triceratops'?76:kind==='crab'?40:36,windup:kind==='jumping_spider'?.55:.8,recovery:kind==='jumping_spider'?.75:1.1,dropChance:enemy?1:0};
  return [kind,{name:s.name,baseKind:kind,aiKind:kind,rigType,stats,behaviors,faction:s.faction,startArea:s.habitat==='ice-water-edge'?'shallow_water':s.habitat==='beach'?'beach':'any',wildlifePackKind:kind,requiresStartArea:s.habitat==='ice-water-edge'||s.habitat==='beach'}];
}));

const eventFlavor={
  snail:['A violet shell shines beneath the leaves.','A quiet trail curls through the moss.'],
  jumping_spider:['Eight legs still in the brush.','The hunter springs only after its crouch.'],
  fox_kit:['Copper fur flickers at the forest edge.','A wary kit watches from the ferns.'],
  llama:['A soft-footed traveler noses the grass.','It may spit if you crowd its space.'],
  penguin:['Small tracks cross the frozen shore.','A curious bird waddles beside open water.'],
  crab:['Claws stir at the tide line.','The pincher waits for room to wind up.'],
  golden_retriever:['A friendly nose sniffs around the house.','A bone could turn this visitor into family.'],
  skunk:['A black-and-white tail lifts in warning.','Give the skunk space before it sprays.'],
  triceratops:['Heavy steps shake the forest floor.','The lowered frill warns of a straight charge.'],
  sheep:['A woolly visitor grazes in the clearing.','The flock scatters when danger draws near.'],
  squirrel:['A russet tail flashes up a nearby tree.','The small forager freezes, then darts away.'],
  baby_triceratops:['A tiny horned shape stays near its herd.','It bolts when startled or approached too fast.'],
  turkey:['A broad fan rustles in the undergrowth.','The bird pecks, then flaps clear of danger.'],
};
const events=Object.entries(specs).map(([kind,s])=>({name:s.behavior==='bond-with-bone-follow'?'A golden friend':kind==='jumping_spider'?'Bouncer in the brush':kind==='territorial-telegraphed-charge'?'The old horned guardian':kind==='side-scuttle-pincher'?'Pinchers at the tide line':s.name+' encounter',kind,count:kind==='crab'?4:kind==='penguin'?3:kind==='sheep'?4:kind==='turkey'?3:1,hp:s.stats[0],speed:s.stats[1],damage:s.stats[2],environment:s.habitat==='house'?'house':s.habitat==='ice-water-edge'?'ice':s.habitat==='beach'?'beach':undefined,weight:kind==='crab'?5:kind==='golden_retriever'?3:0,devOnly:kind!=='crab'&&kind!=='golden_retriever',wildlifePackKind:kind,verse:eventFlavor[kind].join('\n'),tip:kind==='jumping_spider'?'Watch its crouch, dodge the leap, and punish its landing. It does not spin webs.':kind==='golden_retriever'?'Offer a bone to earn a loyal house companion.':kind==='penguin'?'These peaceful birds gather along the ice-water edge.':kind==='crab'?'Give the pincher room to wind up, then step behind its claws.':kind==='triceratops'?'The head lowers before its charge; sidestep its path.':`Watch how the ${s.name.toLowerCase()} moves, and give its warning behavior room.`}));

function nearestLiving(game,actor,targets){return targets.filter(t=>t&&t!==actor&&t.hp>0&&!t.room).sort((a,b)=>Math.hypot(a.x-actor.x,a.y-actor.y)-Math.hypot(b.x-actor.x,b.y-actor.y))[0]||null;}
function moveActor(game,actor,dx,dy,dt,speedScale=1){
  const distance=Math.hypot(dx,dy)||1,speed=Math.max(0,Number(actor.speed)||40)*speedScale;
  const step=Math.min(distance,speed*dt),mx=dx/distance*step,my=dy/distance*step;
  const ox=actor.x,oy=actor.y;
  if(game.moveActor)game.moveActor(actor,mx,my);else {actor.x+=mx;actor.y+=my;}
  const moved=Math.hypot(actor.x-ox,actor.y-oy);
  actor.moving=moved>0.1;
  if(moved>0.1){actor.faceX=(actor.x-ox)/moved;actor.faceY=(actor.y-oy)/moved;}
  return moved;
}
function roam(game,actor,dt,rate=.18){
  actor.homeX??=actor.x;actor.homeY??=actor.y;
  actor.wildlifeWanderTime=(actor.wildlifeWanderTime||0)-dt;
  if(actor.wildlifeWanderTime<=0){const seed=(Math.abs(actor.id||1)*.137+(game.time||0)*.071)%1,a=seed*Math.PI*2;actor.wildlifeWanderTarget={x:actor.homeX+Math.cos(a)*66,y:actor.homeY+Math.sin(a)*48};actor.wildlifeWanderTime=3+seed*3;}
  const target=actor.wildlifeWanderTarget||actor;
  if(Math.hypot(target.x-actor.x,target.y-actor.y)>6){moveActor(game,actor,target.x-actor.x,target.y-actor.y,dt,rate);actor.animationAction=actor.speed>75?'walk':'walk';actor.state='wander';}
  else {actor.moving=false;actor.animationAction='idle';actor.state='idle';}
}
function tickPincher(game,actor,target,dt){
  const d=Math.hypot(target.x-actor.x,target.y-actor.y)||1,dx=target.x-actor.x,dy=target.y-actor.y;
  actor.wildlifeCooldown=Math.max(0,(actor.wildlifeCooldown||0)-dt);
  if(actor.wildlifeBehaviorPhase==='windup'){
    actor.wildlifeBehaviorTime-=dt;actor.animationAction='raise-claws';actor.state='windup';actor.moving=false;
    if(actor.wildlifeBehaviorTime<=0){actor.wildlifeBehaviorPhase='attack';actor.wildlifeBehaviorTime=.16;}
    return true;
  }
  if(actor.wildlifeBehaviorPhase==='attack'){
    actor.wildlifeBehaviorTime-=dt;actor.animationAction='pinch';actor.state='pinch';actor.moving=false;
    if(actor.wildlifeBehaviorTime<=0){if(d<54)game.hurt?.(target,actor.damage||12,actor);actor.wildlifeBehaviorPhase='recover';actor.wildlifeBehaviorTime=.65;actor.wildlifeCooldown=1.8;}
    return true;
  }
  if(actor.wildlifeBehaviorPhase==='recover'){
    actor.wildlifeBehaviorTime-=dt;actor.animationAction='recover';actor.moving=false;
    if(actor.wildlifeBehaviorTime<=0)actor.wildlifeBehaviorPhase='';
    return true;
  }
  actor.faceX=dx/d;actor.faceY=dy/d;
  if(d>52){moveActor(game,actor,dx,dy,dt,1);actor.animationAction='scuttle';}
  else if(actor.wildlifeCooldown<=0){actor.wildlifeBehaviorPhase='windup';actor.wildlifeBehaviorTime=.48;actor.moving=false;actor.animationAction='raise-claws';}
  else {actor.moving=false;actor.animationAction='idle';}
  return true;
}
function tickCharge(game,actor,target,dt){
  const d=Math.hypot(target.x-actor.x,target.y-actor.y)||1,dx=target.x-actor.x,dy=target.y-actor.y;
  actor.wildlifeCooldown=Math.max(0,(actor.wildlifeCooldown||0)-dt);
  if(actor.wildlifeBehaviorPhase==='windup'){
    actor.wildlifeBehaviorTime-=dt;actor.animationAction='warn';actor.state='windup';actor.moving=false;
    if(actor.wildlifeBehaviorTime<=0){actor.wildlifeBehaviorPhase='charge';actor.wildlifeBehaviorTime=.62;actor.wildlifeChargeX=actor.faceX;actor.wildlifeChargeY=actor.faceY;}
    return true;
  }
  if(actor.wildlifeBehaviorPhase==='charge'){
    actor.wildlifeBehaviorTime-=dt;actor.animationAction='charge';actor.state='charge';
    moveActor(game,actor,actor.wildlifeChargeX,actor.wildlifeChargeY,dt,2.7);
    if(Math.hypot(target.x-actor.x,target.y-actor.y)<40){game.hurt?.(target,actor.damage||20,actor);actor.wildlifeBehaviorPhase='recover';actor.wildlifeBehaviorTime=.9;actor.wildlifeCooldown=2.8;}
    else if(actor.wildlifeBehaviorTime<=0){actor.wildlifeBehaviorPhase='recover';actor.wildlifeBehaviorTime=.9;actor.wildlifeCooldown=2.8;}
    return true;
  }
  if(actor.wildlifeBehaviorPhase==='recover'){
    actor.wildlifeBehaviorTime-=dt;actor.animationAction='recover';actor.moving=false;
    if(actor.wildlifeBehaviorTime<=0)actor.wildlifeBehaviorPhase='';
    return true;
  }
  actor.faceX=dx/d;actor.faceY=dy/d;
  if(d>145){moveActor(game,actor,dx,dy,dt,.82);actor.animationAction='walk';}
  else if(actor.wildlifeCooldown<=0){actor.wildlifeBehaviorPhase='windup';actor.wildlifeBehaviorTime=.72;actor.animationAction='warn';actor.state='windup';}
  else {actor.moving=false;actor.animationAction='idle';}
  return true;
}
export function tickWildlifeActor(game,actor,dt,livingTargets=[]){
  const kind=actor.wildlifePackKind;if(!specs[kind])return false;
  actor.wildlifeMoodTime=Math.max(0,(actor.wildlifeMoodTime||0)-dt);
  if(actor.hp<=0||actor.frozen>0||actor.stun>0)return false;
  if(kind==='golden_retriever'){
    if(actor.allyOwner!=null)return false;
    actor.moving=false;actor.animationAction=actor.wildlifeMoodTime>0?'wag':'sit';actor.state='idle';return true;
  }
  if(kind==='jumping_spider'){
    const target=nearestLiving(game,actor,livingTargets);if(!target){roam(game,actor,dt,.18);return true;}
    const distance=Math.hypot(target.x-actor.x,target.y-actor.y),dx=target.x-actor.x,dy=target.y-actor.y;
    if(actor.state==='pounce-recover'){actor.wildlifeMoodTime-=dt;if(actor.wildlifeMoodTime<=0){actor.state='hunt';actor.wildlifeCooldown=1.05;}return true;}
    actor.wildlifeCooldown=Math.max(0,(actor.wildlifeCooldown||0)-dt);
    if(distance<148&&actor.wildlifeCooldown<=0&&actor.state!=='pounce-windup'){actor.state='pounce-windup';actor.wildlifeMoodTime=.46;actor.faceX=dx/(distance||1);actor.faceY=dy/(distance||1);return true;}
    if(actor.state==='pounce-windup'){actor.wildlifeMoodTime-=dt;if(actor.wildlifeMoodTime<=0){actor.state='pounce';actor.wildlifeMoodTime=.24;actor.pounceTargetId=target.id;}return true;}
    if(actor.state==='pounce'){actor.wildlifeMoodTime-=dt;const len=Math.min(distance,Math.max(0,actor.speed||58)*dt*2.8);game.moveActor?.(actor,dx/(distance||1)*len,dy/(distance||1)*len);actor.moving=true;if(actor.wildlifeMoodTime<=0){actor.state='pounce-recover';actor.wildlifeMoodTime=.62;actor.wildlifeCooldown=1.2;}return true;}
  }
  if(['crab','triceratops'].includes(kind)){
    const target=nearestLiving(game,actor,livingTargets);
    if(!target){roam(game,actor,dt,kind==='crab'?.12:.08);return true;}
    return kind==='crab'?tickPincher(game,actor,target,dt):tickCharge(game,actor,target,dt);
  }
  const target=nearestLiving(game,actor,livingTargets);
  if(target){
    const d=Math.hypot(target.x-actor.x,target.y-actor.y),threshold=kind==='squirrel'?142:kind==='skunk'?92:kind==='llama'?118:kind==='sheep'?102:kind==='penguin'?84:kind==='turkey'?94:kind==='baby_triceratops'?132:kind==='snail'?46:100;
    if(d<threshold){
      if(actor.wildlifeBehaviorPhase==='warning'){
        actor.wildlifeBehaviorTime-=dt;actor.animationAction=kind==='skunk'?'raise-tail':kind==='llama'?'spit-warning':kind==='squirrel'?'freeze':kind==='turkey'?'flap-run':'call-for-parent';actor.moving=false;
        if(actor.wildlifeBehaviorTime<=0){actor.wildlifeBehaviorPhase='flee';actor.wildlifeBehaviorTime=2.3;actor.wildlifeMoodTime=2.3;}
        return true;
      }
      if(!actor.wildlifeBehaviorPhase){actor.wildlifeBehaviorPhase='warning';actor.wildlifeBehaviorTime=kind==='squirrel'?.35:kind==='llama'?.55:kind==='skunk'?.7:.28;actor.animationAction=kind==='skunk'?'raise-tail':kind==='llama'?'spit-warning':kind==='squirrel'?'freeze':'call-for-parent';actor.state='warn';actor.moving=false;}
      if(actor.wildlifeBehaviorPhase==='flee'){
        actor.wildlifeBehaviorTime-=dt;const dx=actor.x-target.x,dy=actor.y-target.y;
        moveActor(game,actor,dx,dy,dt,kind==='squirrel'?1.5:1.15);actor.animationAction=kind==='turkey'?'flap-run':'run';actor.state='flee';
        if(actor.wildlifeBehaviorTime<=0)actor.wildlifeBehaviorPhase='';
      }
      return true;
    }
  }
  if(actor.wildlifeBehaviorPhase==='flee')actor.wildlifeBehaviorPhase='';
  roam(game,actor,dt,kind==='snail'?.055:kind==='sheep'?.12:kind==='squirrel'?.24:.16);
  return true;
}
export function interactWildlifeActor(game,actor,player){
  if(actor?.wildlifePackKind!=='golden_retriever'||actor.hp<=0||actor.allyOwner!=null||!player?.inventory)return false;
  if(!take(player.inventory,'bone',1))return {ok:false,message:'The retriever sniffs your hand. Bring it a bone.'};
  actor.faction='ally';actor.allyOwner=player.id;actor.state='follow';actor.wildlifeMoodTime=0;actor.moving=false;actor.attack=0;actor.animationAction='sit';
  game.message?.(`${player.name}'s new friend pads close at their heel.`);game.persist?.();return {ok:true,message:'The retriever accepts the bone and becomes your follower.'};
}
function onSpawn(game,event,groupActors=[]){
  const kind=event?.wildlifePackKind||event?.kind;if(!specs[kind])return;
  for(const actor of groupActors){actor.wildlifePackKind=kind;actor.wildlifeMoodTime=kind==='golden_retriever'?1.4:0;actor.wildlifeCooldown=kind==='jumping_spider'?1.1:0;actor.homeX=actor.x;actor.homeY=actor.y;}
  if(kind==='penguin')for(const actor of groupActors){actor.iceShoreWander=true;actor.swimCapable=true;actor.faction='neutral';}
  if(kind==='crab')groupActors.forEach((actor,index)=>{actor.crabGroupIndex=index;actor.faction='enemy';});
  if(kind==='golden_retriever')for(const actor of groupActors){actor.houseCompanionOffer=true;actor.faction='neutral';actor.animationAction='sit';}
  if(kind==='baby_triceratops'){const adult=groupActors.find(a=>a.kind==='triceratops');for(const actor of groupActors)if(actor!==adult)actor.parentCreatureId=adult?.id;}
}

export const CREATURE_PACK={subjects,defaults,events,tickActor:tickWildlifeActor,onSpawn,interactActor:interactWildlifeActor};
export const WILDLIFE_DONOR_NOTES={
  fox_kit:{requestedReference:'https://www.wowhead.com/npc=171702/copperfur-kit#modelviewer',transfer:'Exact selected Copperfur M2 motion already converted into fox-donor-data.mjs and reused here with the original editable fox art.',verifiedLocally:true},
  jumping_spider:{requestedReference:'https://www.wowhead.com/npc=222532/bouncer#modelviewer',transfer:'Exact Bouncer NPC 222532 Stand/Walk/Run bone tracks drive the editable eight-leg spider rig. Native pounce/windup/recovery remain unchanged; webs remain disabled.',verifiedForRequestedDonor:true,displayId:119179,fileDataId:5752188},
  otherSpecies:{transfer:'No exact Wowhead animation exports were found in this pack. Their included idle/locomotion/attack motions are native Wildbound approximations pending donor-specific M2 availability and mapping.'},
};
