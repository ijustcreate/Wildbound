import {creatures} from './definitions.mjs';
import {clearShot} from './navigation.mjs';

export const sameAudioRoom=(a,b)=>(a?.room||null)===(b?.room||null);
export const audioPosition=a=>a?.room?{x:a.roomX??a.x,y:a.roomY??a.y}:a;
export function audioDistance(a,b){
  if(!sameAudioRoom(a,b))return Infinity;
  const p=audioPosition(a),q=audioPosition(b);
  return p&&q?Math.hypot(p.x-q.x,p.y-q.y):Infinity;
}
export function activeHostile(e){
  const faction=e?.faction||creatures[e?.kind]?.faction;
  return !!e&&(e.hp??(e.alive?1:0))>0&&!e.defeated&&e.alive!==false&&!e.practiceTarget
    &&!e.pet&&e.owner==null&&e.allyOwner==null&&!e.friendly&&e.hostile!==false&&!['ally','neutral'].includes(faction);
}
const attacks=new Set(['windup','attack','charge','breath','rocklift','swoop','swipe','bite','pounce','tailSwipe','shoot','slam','fire','sting','swallow']);
const resting=new Set(['idle','sit','lie','branch_rest','climb','sleep','snared','flee','death']);
export class CombatMusicThreat {
  constructor(){this.reset();}
  reset(world=null){this.world=world;this.previous=new WeakMap();this.players=new WeakMap();this.combat=false;this.enter=0;this.hold=0;this.scanClock=0;this.nearby=0;this.threat=false;}
  update(world,dt=.016,active=true,{tv=false}={}){
    if(world!==this.world)this.reset(world);
    dt=Math.max(0,Math.min(.25,dt));
    if(!active||!world||world.won||world.completed||(!tv&&world.phase!=='play')){this.reset(world);return 0;}
    this.scanClock-=dt;
    if(this.scanClock<=0){
      this.scanClock=.1;this.nearby=0;this.threat=false;
      const players=world.players instanceof Map?[...world.players.values()]:world.players||[];
      const hurtPlayers=new WeakSet();
      for(const p of players){const old=this.players.get(p);if(old!=null&&p.hp<old)hurtPlayers.add(p);this.players.set(p,p.hp);}
      const platformer=tv&&world.enemies instanceof Map;
      const alive=p=>(p.hp??(p.alive?1:0))>0&&!p.menuPaused;
      const enemies=world.enemies instanceof Map?[...world.enemies.values()]:world.enemies||[];
      for(const e of [...enemies,...(world.ghosts||[]).filter(a=>a.wildTiger)]){
        if(!activeHostile(e))continue;
        const old=this.previous.get(e),hurt=old!=null&&e.hp<old;this.previous.set(e,e.hp);
        const nearbyPlayers=players.filter(p=>alive(p)&&audioDistance(e,p)<=(platformer?85:320)
          &&(!world.house||e.room||!world.projectileBlocked||clearShot(world,e,p)));
        if(!nearbyPlayers.length)continue;
        this.nearby++;
        const attacking=attacks.has(e.state)||!resting.has(e.state)&&(e.attack||e.fireballsAttack||e.throwTime||0)>0;
        // 'hunt' is also the spawn default. It needs actual pursuit, not mere presence.
        const pursuing=e.moving&&['hunt','chase','stalk','prowl'].includes(e.state)&&!resting.has(e.state);
        const tvHunt=tv&&players.some(p=>alive(p)&&audioDistance(e,p)<(platformer?35:210)
          &&(platformer&&!!e.vx||['lion','tiger'].includes(e.kind)||e.kind==='archer'&&e.cooldown>1.6));
        const hit=hurt||nearbyPlayers.some(p=>hurtPlayers.has(p));
        if(hit)this.combat=true; // A sampled damage edge lasts one scan; don't debounce it away.
        if(attacking||hit||tvHunt||!resting.has(e.state)&&(e.aggro||pursuing))this.threat=true;
      }
    }
    if(this.threat){this.enter+=dt;this.hold=4.5;if(this.enter>=.22)this.combat=true;}
    else {this.enter=0;this.hold=Math.max(0,this.hold-dt);if(!this.hold)this.combat=false;}
    return this.combat?1:0;
  }
}
