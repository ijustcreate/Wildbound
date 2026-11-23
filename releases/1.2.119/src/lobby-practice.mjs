import {LOBBY_BOARD} from './lobby-board.mjs';
import {Game} from './core.mjs';
import {structureBlocked} from './expansion.mjs';
import {refreshVitals} from './items.mjs';
import {restoreHunterPet,petRecord} from './hunter-pets.mjs';
import {LOBBY_FLOOR,LOBBY_TV} from './lobby-geometry.mjs';

export const LOBBY_FURNITURE=[
 // Match the visible lower-row tables; the old footprints were on the top wall.
 {id:'environment',kind:'table',x:578,y:551,w:94,h:12,surfaceHeight:39,lobbySurface:true,jumpable:true},
 {id:'dice-count',kind:'table',x:737,y:551,w:86,h:12,surfaceHeight:39,lobbySurface:true,jumpable:true},
 {id:'character-station',kind:'desk',x:593,y:175,w:84,h:11,surfaceHeight:50,lobbySurface:true,jumpable:true},
 {id:'television',kind:'table',x:LOBBY_TV.x,y:LOBBY_TV.y,w:LOBBY_TV.w,h:LOBBY_TV.h,surfaceHeight:LOBBY_TV.height,lobbySurface:true,jumpable:true},
 {id:'starter-chest',kind:'table',x:894,y:551,w:112,h:12,surfaceHeight:44,lobbySurface:true,jumpable:true},
 {...LOBBY_BOARD},
];
export const LOBBY_FIXTURES=[
 {id:'difficulty',x:934,y:158,w:42,h:18},
 {id:'target-lever',x:447,y:545,w:36,h:15},
];

// A separate simulation uses the real combat/movement code without touching saves.
export class LobbyPractice extends Game {
  constructor(){
    super();this.phase='play';this.openingBoard=false;this.generatedEnvironment='lobby';
    this.house={walls:structuredClone(LOBBY_FIXTURES),doors:[],furniture:structuredClone(LOBBY_FURNITURE),pools:[],floors:[],rooms:[],trees:[]};this.scenery=[];this.terrain.fill('grass');this.pickups=[];
    this.targetsMoving=false;this.targetClock=0;this.targets=[{x:280,y:125,angle:0},{x:455,y:125,angle:0},{x:120,y:178,angle:-Math.PI/4},{x:52,y:350,angle:-Math.PI/2},{x:52,y:520,angle:-Math.PI/2}].map((t,i)=>({...t,id:i,homeX:t.x,homeY:t.y,hits:0,score:0,flash:0}));
    for(const t of this.targets)Object.assign(t,{id:this.nextId++,kind:'practice_target',practiceTarget:true,hp:1e9,maxHp:1e9,combatText:[],state:'idle',speed:0,damage:0});
    this.enemies=this.targets;
  }
  blocked(x,y,radius=8,_flying=false,_water=false,_doors=false,offset=0,elevation=0,projectile=false,from=null){return x-radius<LOBBY_FLOOR.left||x+radius>LOBBY_FLOOR.right||y-radius<LOBBY_FLOOR.top||y+radius>LOBBY_FLOOR.bottom||structureBlocked(this,x,y,radius,false,offset,elevation,projectile,from);}
  projectileBlocked(x,y,radius=1,impact=false){
    if(x-radius<LOBBY_FLOOR.left||x+radius>LOBBY_FLOOR.right||y-radius<LOBBY_FLOOR.top||y+radius>LOBBY_FLOOR.bottom||structureBlocked(this,x,y,radius,false,0,0,true))return true;
    return false;
  }
  toggleTargets(){this.targetsMoving=!this.targetsMoving;return this.targetsMoving;}
  updateTargets(dt){if(this.targetsMoving)this.targetClock+=dt;for(const t of this.targets){if(this.targetsMoving){const travel=Math.sin(this.targetClock*1.4+t.id*Math.PI*.5)*42;t.x=t.homeX+Math.cos(t.angle)*travel;t.y=t.homeY+Math.sin(t.angle)*travel;}t.reportRemaining=Math.max(0,(t.reportRemaining||0)-dt);t.flash=Math.max(0,t.flash-dt);t.state='idle';for(const [i,f] of t.combatText.entries()){f.age+=dt;f.life-=dt;f.offset+=(i*19-f.offset)*(1-Math.exp(-dt*24));}t.combatText=t.combatText.filter(f=>f.life>0);}}
  canHitBoard(){return false;}
  collect(p,l,quick=false){const collected=super.collect(p,l,quick);if(collected)this.onLobbyPickup?.(p,l);return collected;}
  portal(){return false;}
  beginSeal(){return false;}
  createActor(player,state){
    const actor=this.addPlayer(player.device,player.name),id=actor.id;
    Object.assign(actor,structuredClone(player),{id:player.id,previousInput:{},ui:null,room:null,progress:0,hp:player.maxHp||100});
    this.nextId=Math.max(this.nextId,id+1,player.id+1);
    Object.assign(actor,{x:state.x,y:state.y,faceX:state.faceX,faceY:state.faceY,step:state.step,jumpImpulse:570,jumpGravity:1900});
    actor.hunterPet=restoreHunterPet(petRecord(player.hunterPet));
    return actor;
  }
  stepPractice(dt,players,members,inputs,blocked=false){
    this.players=this.players.filter(a=>players.some(p=>p.id===a.id&&members.get(p.id)?.spawned&&p.profileId===a.profileId));
    const commands={};
    for(const p of players){
      const s=members.get(p.id);if(!s?.spawned)continue;
      const a=this.players.find(a=>a.id===p.id)||this.createActor(p,s);
      // Lobby position remains owned by its member state (also used by diagnostics).
      a.x=s.x;a.y=s.y;
      a.equipment=structuredClone(p.equipment);a.inventory=structuredClone(p.inventory);
      (a.field||={}).quiver=p.field?.quiver;
      a.equipmentSockets=structuredClone(p.equipmentSockets||{});refreshVitals(a);
      const active=!blocked&&!s.panel&&!p.ui&&!p.room&&!p.lobbyDisconnected&&players.find(q=>q.device===p.device)===p;
      commands[p.device]=active?{...inputs[p.device],inventory:false,portal:false}:{};
      if(!active){delete a.swordStrike;delete a.swordFacing;a.swordHitPause=0;a.attack=0;a.charge=0;a.queuedAttack=null;a.previousInput={};a.dashTime=0;a.dashRecovery=0;a.slideX=a.slideY=0;a.bowAiming=false;a.holdingPosition=false;a.blocking=false;}
      a.consumeInput=false;
    }
    if(this.players.length&&!blocked){this.updateTargets(dt);super.update(dt,commands);}
    for(const a of this.players){
      const s=members.get(a.id);
      const player=players.find(p=>p.id===a.id);if(player&&(a.hunterPet||player.hunterPet))player.hunterPet=a.hunterPet;
      if(player&&a.brokenStickSlots?.length){for(const slot of a.brokenStickSlots)if(player.equipment[slot]==='stick'){player.equipment[slot]=null;if(player.equipmentSockets)delete player.equipmentSockets[slot];}a.brokenStickSlots=[];}
      Object.assign(s,{x:a.x,y:a.y,step:a.step,faceX:a.faceX,faceY:a.faceY,moving:a.moving,attack:a.attack,jumpHeight:a.jumpHeight||0,groundHeight:a.groundHeight||0,wingHover:!!a.wingHover});
    }
    // Practice retains cooldowns but replenishes consumables from the selected hero.
    for(const a of this.players){const p=players.find(p=>p.id===a.id);a.inventory=structuredClone(p.inventory);}
    this.loot=this.loot.slice(-40);this.traps=this.traps.slice(-40);
  }
}

export const lobbyDiceOffsets=count=>Number(count)===1?[-12]:[-28,8];
