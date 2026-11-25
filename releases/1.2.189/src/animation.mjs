import {enemyCombatAnimation} from './enemy-combat-animation.mjs';
import {drawTacticalTell} from './combat-tactics-state.mjs';
import {visualActorId} from './animation-id.mjs';
import {drawGorilla} from './temple.mjs';
import {CapeInertia} from './cape-inertia.mjs';
import {witchHatFrame,WitchHatInertia} from './witch-hat-motion.mjs';
import {merlinBeardFrame} from './merlin-outfit-art.mjs';
import {LocomotionHistory} from './native-locomotion.mjs';
import {characterLightingAt,shadeCharacterSurface} from './character-lighting.mjs';
import {humanoidArtStatus} from './humanoid-hd.mjs';
import {drawAnaconda} from './anaconda-art.mjs';
import {drawWildFauna} from './wild-fauna-art.mjs';
import {drawOtter} from './otter-motion.mjs';
import {championPower} from './arena-drink-state.mjs';
import {shrinkingScale} from './shrinking-candy.mjs';
import {WILD_FAUNA_KINDS} from './wild-fauna-data.mjs';
import {companionVisualActor} from './companion-locomotion.mjs';
import {creaturePackVisualActor} from './creature-pack-animation-routing.mjs';
export const usesLegacyWildFaunaArt = actor =>
  WILD_FAUNA_KINDS.includes(actor?.kind) && !['chicken','penguin','river_otter'].includes(actor.kind);
import {beastMotions,beastMotionRevisions} from './beast-motion.mjs';
import {beetleAction,beetleFrame} from './beetle-motion.mjs';
import {spiderAction,spiderFrame} from './spider-motion.mjs';
import {ScarfInertia} from './school-scarves.mjs';
import {headwearDrawSubject,recordHeadwearTarget,renderedHeadwearFit,wornHeadwear} from './live-edit-headwear.mjs';
import {drawBee,drawBeeHive} from './bee-art.mjs';
import {drawTsetse} from './tsetse-art.mjs';
import {drawRaven} from './raven-art.mjs';
import {drawSpiderEgg} from './spider-egg-art.mjs';
import { NIGHT_KINDS, STAMPEDE_KINDS, nightMotions, nightMotionRevisions, nightAction, nightFrame } from './night-rigs.mjs';
import { ITEMS } from "./items.mjs";
import {
  playerMotion,
  withPlayerPoseCache,
  playerMotionRevision,
  playerFrame,
  playerAction,
  playerLayers,
  drawPlayer,
  directionVector,
  playerHeadwearFacing,
  playerHeadwearPickingBounds,
  playerWitchHatMotion,
  isDefaultExplorer,
} from "./player-motion.mjs";
import {drawVillager} from './villager-motion.mjs';
import {
  lionAction,
  lionFrame,
  lionMotion,
  tigerMotion,
  lionRevision,
  tigerRevision,
} from "./lion-motion.mjs";
import { rigSubject } from "./rig-subjects.mjs";
import { animationFrame } from "./frame-workshop.mjs";
import { spriteToRgba } from "./pixels.mjs";
import {celShadingEnabled} from './cel-shading.mjs';
import {cutoutSurface} from './cutout-art.mjs';
import { creatures } from "./definitions.mjs";
import { drawRig } from "./rig-render.mjs";
import {
  rhinoMotion,
  rhinoFrame,
  rhinoMotionRevision,
} from "./rhino-motion.mjs";
import { facingIndex } from "./player-motion.mjs";
import {drawPatronus} from './patronus-art.mjs';
import {drawHeldTorchFlame,hasHeldTorch} from './torch-flame.mjs';
// Poses are independent of frame rate. Rasterize articulated parts at 64px,
// then scale with nearest-neighbour sampling to retain actual pixel edges.
export class Animator {
  constructor(assets) {
    this.assets = assets;
    this.surface = document.createElement("canvas");
    this.surface.width = this.surface.height = 64;
    this.ctx = this.surface.getContext("2d");
    this.frameCache = new WeakMap();
    this.rigSurface = document.createElement("canvas");
    this.rigSurface.width = this.rigSurface.height = 256;
    this.humanoidSurface=document.createElement('canvas');
    this.humanoidSurface.width=this.humanoidSurface.height=512;
    this.stampedeFrames = new Map();
    this.playerFrames = new Map();
    this.playerRevision = playerMotionRevision;
    this.catFrames = new Map();
    this.catRevisions = { lion: lionRevision, tiger: tigerRevision };
    this.beetleFrames=new Map();this.beetleRevision=beastMotionRevisions.beetle;
    this.stampedeRevision = rhinoMotionRevision;
    this.nightStampedeFrames = new Map();
    this.nightStampedeRevisions = { ...nightMotionRevisions };
  }
  draw(ctx, actor, time, size = 48) {
    if(actor.patronus)return drawPatronus(ctx,actor,time,(pen,pose)=>this.draw(pen,pose,time,size));
    size=(actor.shackBoggart?actor.boggartSize??size:size)*championPower(actor)*shrinkingScale(actor);
    if(actor.kind==='baby_spider'&&!actor.sprite)actor={...actor,sprite:'spider'};
    actor=enemyCombatAnimation(actor,rigSubject(actor.sprite||actor.kind)?.data);
    const rig=rigSubject(actor.sprite||actor.kind);
    const headwear=rig?.draw===drawPlayer?headwearDrawSubject(this.liveHeadwearGame,actor):null;
    if(typeof actor.id==='string')actor={...actor,id:visualActorId(actor.id)};
    if((actor.sprite==='player'||actor.sprite?.startsWith('explorer')||!actor.kind)&&playerMotion.locomotionRevision>=1){
      this.locomotionHistory??=new LocomotionHistory();
      actor={...actor,...this.locomotionHistory.sample(actor,time,playerAction(actor),playerFrame(actor,time))};
    }
    if(headwear?.previewView!=null){
      const [faceX,faceY]=directionVector(headwear.previewView);
      actor={...actor,faceX,faceY,liveHeadwearPreviewView:headwear.previewView};
    }
    const headwearView=headwear?playerHeadwearFacing(actor,rig.data):null;
    const liveHeadwearFit=headwear?.key&&renderedHeadwearFit(this.liveHeadwearGame,headwear.key,headwearView);
    if(liveHeadwearFit)actor={...actor,liveHeadwearFit};
    if((rig?.draw===drawPlayer||rig?.draw===drawVillager)&&ITEMS[wornHeadwear(actor)]?.style==='witch'){
      this.witchHatInertia??=new WitchHatInertia();
      actor={...actor,witchHatInertia:this.witchHatInertia.sample(actor,time)};
    }
    const cape=actor.equipment?.cape||actor.field?.cosmetics?.cape;
    const torch=rig?.draw===drawPlayer&&hasHeldTorch(actor);
    if(cape||torch){
      this.capeInertia??=new CapeInertia();
      const motion=this.capeInertia.sample(actor,time);
      if(cape)actor={...actor,capeMotion:motion};
      if(torch)actor={...actor,torchMotion:motion};
    }
    if(ITEMS[actor.equipment?.back||actor.field?.cosmetics?.back]?.scarf){this.scarfInertia??=new ScarfInertia();actor={...actor,scarfMotion:this.scarfInertia.sample(actor,time)};}
    const groundActor=actor;
    if(actor.kind==='imp'){size*=.7;if(actor.hp>0)actor={...actor,y:actor.y-(actor.impFlightHeight??20)};}
    if(actor.kind==='succubus'&&actor.hp>0&&actor.succubusFlightHeight>0)actor={...actor,y:actor.y-actor.succubusFlightHeight};
    if(actor.kind==='bat'&&actor.roostHeight>0)actor={...actor,y:actor.y-actor.roostHeight};
    if(actor.jumpHeight>0||actor.groundHeight>0)actor={...actor,y:actor.y-(actor.jumpHeight||0)-(actor.groundHeight||0)};
    const character=rig?.data?.joints?.handL;
    const lighting=character&&this.lighting&&characterLightingAt(this.lighting,groundActor,{lift:groundActor.y-actor.y,bodyHeight:22*size/48});
    const paint=()=>withPlayerPoseCache(()=>{
      if(headwear?.picking&&ctx.globalAlpha>=.9){
        const {bounds,hatBounds}=playerHeadwearPickingBounds(actor,time,size,rig.data,headwear.itemId);
        recordHeadwearTarget(this.liveHeadwearGame,headwear,bounds,hatBounds,headwearView);
      }
      const result=celShadingEnabled()&&character?this.drawCutoutCharacter(ctx,actor,time,size,lighting):this.drawActor(ctx,actor,time,size,lighting);
      drawTacticalTell(ctx,actor,time,size);
      return result;
    });
    if (this.metrics?.enabled)
      return this.metrics.measure("animation", () =>
        paint(),
      );
    return paint();
  }
  drawCutoutCharacter(ctx,actor,time,size,lighting){
    this.cutoutSource??=document.createElement('canvas');const source=this.cutoutSource;
    if(source.width!==320){source.width=source.height=320;}
    const c=source.getContext('2d');c.resetTransform();c.clearRect(0,0,320,320);c.globalAlpha=1;c.filter='none';c.globalCompositeOperation='source-over';c.imageSmoothingEnabled=false;
    const scale=96/size;c.setTransform(scale,0,0,scale,160,160);
    const torches=[];
    this.drawActor(c,{...actor,x:0,y:0},time,size,null,(x,y,seed)=>torches.push({x,y,seed}));
    const surface=cutoutSurface(source,{pixelScale:2,outputScale:4}),span=160*size/48;
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(this.litFrame(surface,lighting,span),actor.x-span/2,actor.y-span/2,span,span);ctx.restore();
    for(const {x,y,seed} of torches)drawHeldTorchFlame(ctx,actor.x+x,actor.y+y,time,seed,size/48,actor.torchMotion);
  }
  litFrame(surface,lighting,worldWidth){
    if(!lighting?.lights.length)return surface;
    this.litSurface??=document.createElement('canvas');
    const target=this.litSurface;
    if(target.width!==surface.width||target.height!==surface.height){target.width=surface.width;target.height=surface.height;}
    const c=target.getContext('2d');c.clearRect(0,0,target.width,target.height);c.imageSmoothingEnabled=false;c.drawImage(surface,0,0);
    shadeCharacterSurface(target,lighting,{pixelsPerWorld:surface.width/worldWidth});return target;
  }
  drawActor(ctx, actor, time, size = 48,lighting=null,paintTorch) {
    if(actor.kind==='river_otter'){drawOtter(ctx,actor,time,size);return;}
    if(drawRaven(ctx,actor,time,size))return;
    if(actor.kind==='anaconda'){drawAnaconda(ctx,actor,time);return;}
    if(usesLegacyWildFaunaArt(actor)){drawWildFauna(ctx,actor,time,size);return;}
    if(actor.kind==='bee'){drawBee(ctx,actor,time,size);return;}
    if(actor.kind==='tsetse'){drawTsetse(ctx,actor,time,size);return;}
    if(actor.kind==='bee_hive'){drawBeeHive(ctx,actor,time,size);return;}
    if(actor.kind==='gorilla'){drawGorilla(ctx,actor,time);return;}
    if(actor.kind==='spider_egg'){
      drawSpiderEgg(ctx,actor);ctx.fillStyle='#fff4ca';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(Math.max(0,Math.ceil(actor.hatchIn))+'s',actor.x,actor.y-23);return;
    }
    const nameKey = actor.sprite || actor.kind,
      rig = actor.rigOverride || creatures[nameKey]?.rig;
    const explicitPose=actor.animationAction||Number.isFinite(actor.playerFrame)||Number.isFinite(actor.poseTime)||Number.isFinite(actor.animationProgress);
    actor=companionVisualActor(actor,rigSubject(nameKey)?.data);
    actor=creaturePackVisualActor(actor);
    // Players have exactly one animation path. Old sheets and creature modes
    // cannot override the shared player definition loaded by Animation Studio.
    const subject=rigSubject(nameKey);
    if (subject) {
      const torch=subject.draw===drawPlayer&&hasHeldTorch(actor);
      const tallHat = wornHeadwear(actor) === 'greyhaven_starwatch_hat';
      if((nameKey==='player'||nameKey?.startsWith('explorer'))&&actor.trainRide?.seat&&actor.animationAction==='train_sit'&&
         !actor.rigOverride&&!actor.itemArtItems&&!actor.moving&&actor.hp>0&&!(actor.flash>0)&&!(actor.hit>0)&&
         !(actor.attack>0)&&!(actor.charge>0)&&!actor.bowAiming&&!actor.swordPolish&&!actor.carryingItem&&
         !actor.heldChickenId&&!actor.broomMount&&!torch&&actor.equipment?.head!=='jack_o_lantern'&&
         !['hand1','hand2'].some(slot=>ITEMS[actor.equipment?.[slot]]?.energyBlade)&&!playerLayers(actor,time).length){
        this.seatedFrames??=new Map();
        const clip=playerMotion.clips.train_sit,raw=playerFrame(actor,time,playerMotion,'train_sit');
        const frame=Math.floor((clip.loop?(raw%clip.length+clip.length)%clip.length:raw)*2)/2;
        const scarf=actor.scarfMotion?.tails?.map(t=>[Math.round(t.x),Math.round(t.y),Math.round(t.z)]);
        const cape=actor.capeMotion&&[Math.round(actor.capeMotion.vx/20),Math.round(actor.capeMotion.vy/20),Math.floor(actor.capeMotion.phase*2)%13];
        if(ITEMS[wornHeadwear(actor)]?.style==='witch')actor={...actor,witchHatMotion:playerWitchHatMotion(actor,time)};
        const key=JSON.stringify([nameKey,playerMotionRevision,humanoidArtStatus().revision,facingIndex(actor.faceX,actor.faceY),playerHeadwearFacing(actor),frame,
          actor.appearance,isDefaultExplorer(actor),actor.equipment,Object.values(actor.equipment||{}).map(id=>ITEMS[id]?.artRevision||0),actor.field?.cosmetics,
          (actor.inventory||[]).filter(item=>ITEMS[item?.type]?.relic).slice(0,2).map(item=>item.type),scarf,cape,Math.sin(time*2)>0,actor.liveHeadwearFit,
          actor.witchHatMotion&&witchHatFrame(actor.witchHatMotion),merlinBeardFrame(actor,time)]);
        const halfSpan=tallHat?72:64,drawSize=size*halfSpan/24;
        let seat=this.seatedFrames.get(key);
        if(seat)this.seatedFrames.delete(key);
        else{
          seat=document.createElement('canvas');seat.width=seat.height=halfSpan*8;
          const pen=seat.getContext('2d');pen.scale(4,4);pen.translate(halfSpan,halfSpan);
          rigSubject(nameKey).draw(pen,{...actor,playerFrame:frame},time);
          if(this.seatedFrames.size>=40)this.seatedFrames.delete(this.seatedFrames.keys().next().value);
        }
        this.seatedFrames.set(key,seat);
        ctx.imageSmoothingEnabled=false;
        ctx.drawImage(this.litFrame(seat,lighting,drawSize),Math.round(actor.x-drawSize/2),Math.round(actor.y-drawSize/2),drawSize,drawSize);
        return;
      }
      if(['spider','tarantula'].includes(nameKey)&&(!explicitPose||actor.enemyCombatFrame)&&!actor.rigOverride){
        this.spiderFrames??=new Map();
        const model=beastMotions[nameKey],action=spiderAction(actor),clip=model.clips[action]||model.clips.idle,raw=spiderFrame(actor,time,model);
        const frame=Math.floor((clip.loop?(raw%clip.length+clip.length)%clip.length:Math.max(0,Math.min(clip.length-1,raw)))*2)/2;
        const key=[nameKey,beastMotionRevisions[nameKey],facingIndex(actor.faceX,actor.faceY),action,frame,actor.kind==='baby_spider'].join(':');let surface=this.spiderFrames.get(key);
        if(!surface){surface=document.createElement('canvas');surface.width=surface.height=128;const pen=surface.getContext('2d');pen.translate(64,64);rigSubject(nameKey).draw(pen,{...actor,playerFrame:frame},time,model);if(this.spiderFrames.size>=128)this.spiderFrames.delete(this.spiderFrames.keys().next().value);this.spiderFrames.set(key,surface);}
        ctx.imageSmoothingEnabled=false;ctx.drawImage(surface,Math.round(actor.x-size*4/3),Math.round(actor.y-size*4/3),size*8/3,size*8/3);return;
      }
      if(nameKey==='beetle'&&(!explicitPose||actor.enemyCombatFrame)&&!actor.rigOverride){
        if(this.beetleRevision!==beastMotionRevisions.beetle){this.beetleFrames.clear();this.beetleRevision=beastMotionRevisions.beetle;}
        const model=beastMotions.beetle,action=beetleAction(actor),clip=model.clips[action]||model.clips.idle,raw=beetleFrame(actor,time,model);
        const frame=Math.floor((clip.loop?(raw%clip.length+clip.length)%clip.length:Math.max(0,Math.min(clip.length-1,raw)))*2)/2;
        const key=[facingIndex(actor.faceX,actor.faceY),action,frame].join(':');let surface=this.beetleFrames.get(key);
        if(!surface){surface=document.createElement('canvas');surface.width=surface.height=96;const c=surface.getContext('2d');c.translate(48,48);rigSubject(nameKey).draw(c,{...actor,playerFrame:frame},time,model);if(this.beetleFrames.size>=128)this.beetleFrames.delete(this.beetleFrames.keys().next().value);this.beetleFrames.set(key,surface);}
        ctx.imageSmoothingEnabled=false;ctx.drawImage(surface,Math.round(actor.x-size),Math.round(actor.y-size),size*2,size*2);return;
      }
      if (STAMPEDE_KINDS.includes(nameKey) && actor.state === 'stampede' && !actor.aggro &&
          !(actor.flash > 0) && !(actor.hit > 0) && !(actor.hp <= 0) && !actor.dead &&
          !actor.animationAction && !Number.isFinite(actor.playerFrame) && !Number.isFinite(actor.poseTime) &&
          !Number.isFinite(actor.animationProgress) && !actor.rigOverride) {
        if (this.nightStampedeRevisions[nameKey] !== nightMotionRevisions[nameKey]) {
          this.nightStampedeFrames.clear();
          this.nightStampedeRevisions[nameKey] = nightMotionRevisions[nameKey];
        }
        const model = nightMotions[nameKey], action = nightAction(nameKey, actor, model), clip = model.clips[action];
        const raw = nightFrame(nameKey, actor, time, model), sample = Math.floor(((raw % clip.length + clip.length) % clip.length) * 2) / 2;
        const key = [nameKey, facingIndex(actor.faceX, actor.faceY), action, sample].join(':');
        let surface = this.nightStampedeFrames.get(key);
        if (!surface) {
          surface = document.createElement('canvas'); surface.width = surface.height = 256;
          const cc = surface.getContext('2d'); cc.translate(128, 128);
          rigSubject(nameKey).draw(cc, { ...actor, playerFrame: sample }, time, model);
          if (this.nightStampedeFrames.size >= 192) this.nightStampedeFrames.delete(this.nightStampedeFrames.keys().next().value);
          this.nightStampedeFrames.set(key, surface);
        }
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(surface, Math.round(actor.x - size * 8 / 3), Math.round(actor.y - size * 8 / 3), size * 16 / 3, size * 16 / 3);
        return;
      }
      if (
        (nameKey === "player" || nameKey?.startsWith("explorer")) &&
        !actor.swordChargeAim && !(actor.charge>0) && !actor.swordPolish &&
        !actor.animationAction &&
        !Number.isFinite(actor.playerFrame) &&
        !Number.isFinite(actor.poseTime) &&
        !actor.rigOverride &&
        !(actor.hit > 0) &&
        !actor.equipment?.cape &&
        !actor.field?.cosmetics?.cape &&
        !actor.shoulderBroom && !torch &&
        !ITEMS[actor.equipment?.back||actor.field?.cosmetics?.back]?.scarf &&
        actor.equipment?.head !== 'jack_o_lantern' && actor.equipment?.head !== 'bone_carver_crown' && actor.equipment?.gloves !== 'bone_carver_claws' &&
        playerAction(actor) === "idle" && !playerLayers(actor,time).length && !actor.locomotionTransition && !actor.locomotionTurning
      ) {
        if (this.playerRevision !== playerMotionRevision) {
          this.playerFrames.clear();
          this.playerRevision = playerMotionRevision;
        }
        const clip = playerMotion.clips.idle,
          frame =
            Math.floor(
              (((playerFrame(actor, time) % clip.length) + clip.length) %
                clip.length) *
                2,
            ) / 2;
        if(ITEMS[wornHeadwear(actor)]?.style==='witch')actor={...actor,witchHatMotion:playerWitchHatMotion(actor,time)};
        const key = JSON.stringify([
          humanoidArtStatus().revision,
          facingIndex(actor.faceX, actor.faceY),
          playerHeadwearFacing(actor),
          frame,
          actor.equipment,
          Object.values(actor.equipment||{}).map(id=>ITEMS[id]?.artRevision||0),
          actor.appearance,
          actor.greyhavenCostume,
          isDefaultExplorer(actor),
          actor.field?.cosmetics,
          (actor.inventory || [])
            .filter((i) => ITEMS[i?.type]?.relic)
            .slice(0, 2)
            .map((i) => i.type),
          Math.sin(time * 2) > 0,
          actor.liveHeadwearFit,
          actor.witchHatMotion&&witchHatFrame(actor.witchHatMotion),
          merlinBeardFrame(actor,time),
        ]);
        const halfSpan=tallHat?72:48,drawSize=size*halfSpan/24;
        let surface = this.playerFrames.get(key);
        if (!surface) {
          surface = document.createElement("canvas");
          surface.width = surface.height = halfSpan*8;
          const cc = surface.getContext("2d");
          cc.scale(4,4);cc.translate(halfSpan,halfSpan);cc.imageSmoothingEnabled=false;
          rigSubject(nameKey).draw(cc, { ...actor, playerFrame: frame }, time);
          if (this.playerFrames.size >= 64)
            this.playerFrames.delete(this.playerFrames.keys().next().value);
          this.playerFrames.set(key, surface);
        }
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          this.litFrame(surface,lighting,drawSize),
          Math.round(actor.x - drawSize/2),
          Math.round(actor.y - drawSize/2),
          drawSize,
          drawSize,
        );
        return;
      }
      if (
        ["lion", "tiger"].includes(nameKey) &&
        !actor.animationAction &&
        !Number.isFinite(actor.playerFrame) &&
        !Number.isFinite(actor.poseTime) &&
        !actor.rigOverride &&
        !(actor.flash > 0) &&
        !(actor.hit > 0) &&
        ["idle", "run"].includes(lionAction(actor))
      ) {
        const motion = nameKey === "tiger" ? tigerMotion : lionMotion,
          revision = nameKey === "tiger" ? tigerRevision : lionRevision;
        if (this.catRevisions[nameKey] !== revision) {
          this.catFrames.clear();
          this.catRevisions[nameKey] = revision;
        }
        const action = lionAction(actor),
          clip = motion.clips[action],
          frame =
            Math.floor(
              (((lionFrame(actor, time, motion) % clip.length) + clip.length) %
                clip.length) *
                2,
            ) / 2;
        const key = [
          nameKey,
          actor.skin || "",
          facingIndex(actor.faceX, actor.faceY),
          action,
          frame,
        ].join(":");
        let surface = this.catFrames.get(key);
        if (!surface) {
          surface = document.createElement("canvas");
          surface.width = surface.height = 256;
          const cc = surface.getContext("2d");
          cc.translate(128, 128);
          rigSubject(nameKey).draw(cc, { ...actor, playerFrame: frame }, time, motion);
          if (this.catFrames.size >= 96)
            this.catFrames.delete(this.catFrames.keys().next().value);
          this.catFrames.set(key, surface);
        }
        ctx.drawImage(
          surface,
          Math.round(actor.x - (size * 8) / 3),
          Math.round(actor.y - (size * 8) / 3),
          (size * 16) / 3,
          (size * 16) / 3,
        );
        return;
      }
      // The herd shares one rig. Reuse quarter-key poses instead of rasterizing
      // every limb for every animal at every display refresh. Editor poses bypass this.
      if (
        nameKey === "rhino" &&
        actor.state === "stampede" &&
        !actor.aggro &&
        !(actor.flash > 0) &&
        !(actor.hit > 0) &&
        !actor.animationAction &&
        !Number.isFinite(actor.playerFrame) &&
        !Number.isFinite(actor.poseTime) &&
        !actor.rigOverride
      ) {
        if (this.stampedeRevision !== rhinoMotionRevision) {
          this.stampedeFrames.clear();
          this.stampedeRevision = rhinoMotionRevision;
        }
        const clip = rhinoMotion.clips.charge;
        const raw = rhinoFrame(actor, time);
        const frame = clip.loop
          ? ((raw % clip.length) + clip.length) % clip.length
          : Math.max(0, Math.min(clip.length - 1, raw));
        const sample = Math.floor(frame * 4) / 4;
        const key = facingIndex(actor.faceX, actor.faceY) + ":" + sample;
        let surface = this.stampedeFrames.get(key);
        if (!surface) {
          surface = document.createElement("canvas");
          surface.width = surface.height = 256;
          const c = surface.getContext("2d");
          c.translate(128, 128);
          rigSubject(nameKey).draw(c, { ...actor, playerFrame: sample }, time);
          if (this.stampedeFrames.size >= 64)
            this.stampedeFrames.delete(this.stampedeFrames.keys().next().value);
        } else this.stampedeFrames.delete(key);
        this.stampedeFrames.set(key, surface);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          surface,
          Math.round(actor.x - (size * 8) / 3),
          Math.round(actor.y - (size * 8) / 3),
          (size * 16) / 3,
          (size * 16) / 3,
        );
        return;
      }
      const humanoid=!!(subject.data?.joints?.handL&&subject.data?.joints?.footL&&!subject.data.skeleton&&!subject.data.robot);
      // Native articulated pixel parts use a bounded surface at detail resolution.
      const detailed=humanoid||['murk_wolf','dreadmane_lion','slime'].includes(nameKey);
      let surface=detailed?this.humanoidSurface:this.rigSurface;
      if(detailed&&tallHat){
        if(!this.tallHumanoidSurface){
          this.tallHumanoidSurface=document.createElement('canvas');
          this.tallHumanoidSurface.width=this.tallHumanoidSurface.height=576;
        }
        surface=this.tallHumanoidSurface;
      }
      const halfSpan=surface.width/(detailed?8:2),drawSize=size*halfSpan/24;
      const c = surface.getContext("2d");
      c.clearRect(0, 0, surface.width, surface.height);
      c.save();
      if(detailed)c.scale(4,4);
      c.translate(halfSpan,halfSpan);
      // Capture the transformed wick while painting the item. Draw the plume on
      // the scene canvas so the actor raster cannot crop the flame or its glow.
      const torches=[];
      if(torch)actor={...actor,collectHeldTorch:(x,y,seed)=>{
        const m=c.getTransform();
        torches.push({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f,seed});
      }};
      const cfg = creatures[nameKey];
      const motionDuration =
        actor.state === "windup"
          ? cfg?.edited
            ? cfg.stats.windup
            : nameKey === "snake"
              ? 0.85
              : nameKey === "golem"
                ? 0.9
                : 0.65
          : actor.state === "charge"
            ? (cfg?.stats.dashDistance || 163) /
              Math.max(1, cfg?.stats.dashSpeed || 340)
            : cfg?.edited
              ? cfg.stats.recovery
              : 0.65;
      // Night behavior owns state timing. Avoid replacing its duration with the
      // legacy charge/recovery heuristic; explicit stateAge also remains usable.
      rigSubject(nameKey).draw(c, (actor.tactics||NIGHT_KINDS.includes(nameKey)||nameKey==='dreadmane_lion') ? actor : { ...actor, motionDuration }, time);
      c.restore();
      ctx.imageSmoothingEnabled = false;
      const x=Math.round(actor.x-drawSize/2),y=Math.round(actor.y-drawSize/2);
      ctx.drawImage(
        this.litFrame(surface,lighting,drawSize),
        x,y,
        drawSize,
        drawSize,
      );
      if(torches.length){
        const pixel=drawSize/surface.width;
        const paint=paintTorch??((x,y,seed)=>drawHeldTorchFlame(ctx,x,y,time,seed,size/48,actor.torchMotion));
        for(const wick of torches)paint(x+wick.x*pixel,y+wick.y*pixel,wick.seed);
      }
      return;
    }
    if (rig?.mode === "rig") {
      const c = this.rigSurface.getContext("2d");
      c.clearRect(0, 0, 256, 256);
      c.imageSmoothingEnabled = false;
      c.save();
      c.translate(128, 128);
      const posed = ["skeleton", "archer"].includes(actor.kind)
        ? {
            ...actor,
            equipment: { hand1: actor.kind === "skeleton" ? "sword" : "bow" },
          }
        : actor;
      drawRig(c, this.assets, posed, time, rig);
      c.restore();
      ctx.drawImage(
        this.rigSurface,
        Math.round(actor.x - (size * 8) / 3),
        Math.round(actor.y - (size * 8) / 3),
        (size * 16) / 3,
        (size * 16) / 3,
      );
      return;
    }
    const frame =
      rig?.mode === "frames"
        ? animationFrame(this.assets.animationBank, nameKey, actor, time)
        : null;
    if (frame) {
      let canvas = this.frameCache.get(frame);
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.width = canvas.height = 64;
        canvas
          .getContext("2d")
          .putImageData(new ImageData(spriteToRgba(frame), 64, 64), 0, 0);
        this.frameCache.set(frame, canvas);
      }
      ctx.drawImage(
        canvas,
        Math.round(actor.x - (size * 2) / 3),
        Math.round(actor.y - (size * 2) / 3),
        (size * 4) / 3,
        (size * 4) / 3,
      );
      return;
    }
    const c = this.ctx;
    c.clearRect(0, 0, 64, 64);
    c.imageSmoothingEnabled = false;
    c.save();
    c.translate(32, 32);
    const name = actor.sprite || actor.kind,
      skin = actor.skin || name,
      source =
        this.assets.canvas(name) ||
        (["skeleton", "archer"].includes(name)
          ? this.assets.canvas("explorer-teal")
          : null);
    if (!source) {
      c.restore();
      return;
    }
    const frozen = actor.state === "snared" || actor.state === "windup";
    const part = (sx, sy, sw, sh, x, y, w, h, angle = 0) => {
      c.save();
      c.translate(Math.round(x), Math.round(y));
      c.rotate(angle);
      c.drawImage(
        source,
        (sx / 48) * source.width,
        (sy / 48) * source.height,
        (sw / 48) * source.width,
        (sh / 48) * source.height,
        Math.round(-w / 2),
        0,
        w,
        h,
      );
      c.restore();
    };
    if (name === "wasp") {
      const flap = frozen ? 0.4 : 0.5 + Math.sin(time * 29) * 0.4;
      part(0, 8, 23, 32, -9, -9, 26, Math.max(7, Math.round(31 * flap)), -0.2);
      part(25, 8, 23, 32, 9, -9, 26, Math.max(7, Math.round(31 * flap)), 0.2);
      part(17, 9, 14, 35, 0, -14, 15, 34);
    } else {
      // Keep custom sprites (for example the tiger's 10x3 art) pixel-square
      // when they are placed in the 48px animation cell.
      const scale = Math.min(48 / source.width, 48 / source.height),
        width = source.width * scale,
        height = source.height * scale;
      c.drawImage(source, -width / 2, -height / 2, width, height);
    }
    c.restore();
    ctx.drawImage(
      this.surface,
      Math.round(actor.x - (size * 2) / 3),
      Math.round(actor.y - (size * 2) / 3),
      (size * 4) / 3,
      (size * 4) / 3,
    );
  }
}
