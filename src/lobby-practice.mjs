import {Game} from './core.mjs';
import {structureBlocked} from './expansion.mjs';

export const LOBBY_FURNITURE=[
 {id:'environment',kind:'table',x:183,y:180,w:94,h:35,surfaceHeight:16,jumpable:true},
 {id:'dice-count',kind:'table',x:757,y:430,w:86,h:25,surfaceHeight:16,jumpable:true},
 {id:'board',kind:'table',x:450,y:270,w:120,h:30,surfaceHeight:16,jumpable:true},
];

// A separate simulation uses the real combat/movement code without touching saves.
export class LobbyPractice extends Game {
  constructor(){
    super();this.phase='play';this.openingBoard=false;this.generatedEnvironment='lobby';
    this.house={walls:[{x:779,y:180,w:42,h:24}],doors:[],furniture:structuredClone(LOBBY_FURNITURE),pools:[],floors:[],rooms:[],trees:[]};this.scenery=[];this.terrain.fill('grass');this.pickups=[];
    this.targetsMoving=false;this.targetClock=0;this.targets=[350,520,690].map((x,i)=>({id:i,homeX:x,x,y:125,hits:0,score:0,flash:0}));
  }
  blocked(x,y,radius=8,_flying=false,_water=false,_doors=false,offset=0,elevation=0){return x-radius<47||x+radius>978||y-radius<92||y+radius>568||structureBlocked(this,x,y,radius,false,offset,elevation);}
  projectileBlocked(x,y,radius=1,impact=false){
    if(x<48||x>978||y<92||y>568||structureBlocked(this,x,y,radius,false,0,20,true))return true;
    const target=this.targets.find(t=>Math.hypot(x-t.x,y-t.y)<18+radius);
    if(!target)return false;
    if(impact){const distance=Math.abs(x-target.x);target.hits++;target.score+=distance<6?10:distance<12?5:1;target.flash=.22;this.onSound?.('hit',target);}
    return true;
  }
  toggleTargets(){this.targetsMoving=!this.targetsMoving;return this.targetsMoving;}
  updateTargets(dt){if(this.targetsMoving)this.targetClock+=dt;for(const t of this.targets){if(this.targetsMoving)t.x=t.homeX+Math.sin(this.targetClock*1.4+t.id*Math.PI*.5)*42;t.flash=Math.max(0,t.flash-dt);}}
  canHitBoard(){return false;}
  portal(){return false;}
  beginSeal(){return false;}
  createActor(player,state){
    const actor=this.addPlayer(player.device,player.name),id=actor.id;
    Object.assign(actor,structuredClone(player),{id:player.id,previousInput:{},ui:null,room:null,progress:0,hp:player.maxHp||100});
    this.nextId=Math.max(this.nextId,id+1,player.id+1);
    Object.assign(actor,{x:state.x,y:state.y,faceX:state.faceX,faceY:state.faceY,step:state.step});
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
      const active=!blocked&&!s.panel&&!p.lobbyDisconnected&&players.find(q=>q.device===p.device)===p;
      commands[p.device]=active?{...inputs[p.device],inventory:false,portal:false}:{};
      if(!active){a.charge=0;a.queuedAttack=null;a.previousInput={};a.dashTime=0;a.bowAiming=false;a.blocking=false;}
      a.consumeInput=false;
    }
    if(this.players.length&&!blocked){this.updateTargets(dt);super.update(dt,commands);}
    for(const a of this.players){
      const s=members.get(a.id);
      Object.assign(s,{x:a.x,y:a.y,step:a.step,faceX:a.faceX,faceY:a.faceY,moving:a.moving,attack:a.attack});
    }
    // Practice retains cooldowns but replenishes consumables from the selected hero.
    for(const a of this.players){const p=players.find(p=>p.id===a.id);a.inventory=structuredClone(p.inventory);}
    this.loot=this.loot.slice(-40);this.traps=this.traps.slice(-40);
  }
}

export const lobbyDiceOffsets=count=>Number(count)===1?[-12]:[-28,8];
