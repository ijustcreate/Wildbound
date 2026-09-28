import {Game} from './core.mjs';

// A separate simulation uses the real combat/movement code without touching saves.
export class LobbyPractice extends Game {
  constructor(){
    super();this.phase='play';this.openingBoard=false;this.generatedEnvironment='lobby';
    this.house=null;this.scenery=[];this.terrain.fill('grass');this.pickups=[];
  }
  blocked(x,y){return x<55||x>970||y<100||y>560;}
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
      if(!active){a.charge=0;a.queuedAttack=null;a.previousInput={};a.dashTime=0;}
      a.consumeInput=false;
    }
    if(this.players.length&&!blocked)super.update(dt,commands);
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
