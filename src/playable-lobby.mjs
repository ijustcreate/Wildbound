import { buildCreationMenu } from './creation-menu.mjs';
import { Animator } from './animation.mjs';
import {resizeGameSurface,LOBBY_PLAYER_SIZE} from './render-settings.mjs';
import {drawLobbyBoard} from './lobby-board.mjs';
import {applyCelShading} from './cel-shading.mjs';
import {drawEmbeddedArrow,groupLodgedArrows,drawFlyingArrow,arrowVisualAngle} from './embedded-arrow.mjs';
import {drawMagicBolt} from './magic-bolt-render.mjs';
import {drawMagicBurst} from './magic-bolt-effects.mjs';
import {take} from './items.mjs';
import {drawHunterPet} from './hunter-pet-render.mjs';
import {petCard} from './hunter-pet-ui.mjs';
import {LobbyPractice,lobbyDiceOffsets} from './lobby-practice.mjs';
import { drawPlayer } from './player-motion.mjs';
import {drawBowAim} from './bow-aim.mjs';
import { controllerButtonNames } from './controls.mjs';
import { give, canGive } from './items.mjs';
import { loadQuiver } from './arrow-supplies.mjs';
import { ARROW_TYPES } from './quiver.mjs';
import {DAMAGE_COLORS} from './enemy-damage.mjs';
import {LobbyTelevision,drawLobbyTelevision} from './lobby-tv.mjs';

export const LOBBY_OBJECTS = [
  {id:'environment',name:'Map table',x:625,y:548},
  {id:'difficulty',name:'Difficulty totem',x:925,y:165},
  {id:'dice-count',name:'Dice tray',x:780,y:548},
  {id:'board',name:'Gameboard',x:770,y:375},
  {id:'target-lever',name:'Target lever',x:465,y:548},
  {id:'character-station',name:'Explorer station',x:635,y:165},
  {id:'television',name:'Arcade TV',x:785,y:165},
  {id:'starter-chest',name:'Starter chest',x:950,y:520},
];
const LOOK_PRESETS = [
  { skin:'#d9ab76', shirt:'#39745b', pants:'#665b87', shoes:'#49372d', hair:'crop', hairColor:'#593923' },
  { skin:'#865437', shirt:'#d3b562', pants:'#49372d', shoes:'#272c35', hair:'curls', hairColor:'#272c35' },
  { skin:'#f2d6b3', shirt:'#46799e', pants:'#272c35', shoes:'#593923', hair:'ponytail', hairColor:'#a94955' },
  { skin:'#b97850', shirt:'#a94955', pants:'#3f5e58', shoes:'#49372d', hair:'bob', hairColor:'#d3b562' },
  { skin:'#54372c', shirt:'#d49c3d', pants:'#272c35', shoes:'#593923', hair:'long', hairColor:'#d9d4ba' },
  { skin:'#d9ab76', shirt:'#9a638c', pants:'#49372d', shoes:'#272c35', hair:'mohawk', hairColor:'#d9d4ba' },
];
const DIFFICULTY_DETAILS={
  gentle:'Relaxed · Each hit deals 1 damage.',
  adventure:'Balanced · Take 35% less damage.',
  wild:'Brutal · Full enemy damage.',
};
const MAP_DETAILS={
  random:'A changing expedition every time.',
  forest:'Lush trails, rivers, and wild creatures.',
  desert:'Dry dunes, mesas, and scarce water.',
  ice:'Frozen ground, snow, and blizzards.',
  house:'A lived-in house with gardens and doors.',
  temple:'Jungle ruins with dangerous encounters.',
};
export function moveLobbyCharacter(s,input,dt){
  const x=Number.isFinite(input.x)?input.x:0,y=Number.isFinite(input.y)?input.y:0;
  const length=Math.hypot(x,y),scale=180*dt/Math.max(1,length),beforeX=s.x,beforeY=s.y;
  s.x=Math.max(55,Math.min(970,s.x+x*scale));s.y=Math.max(100,Math.min(560,s.y+y*scale));
  const moved=Math.hypot(s.x-beforeX,s.y-beforeY);
  s.moving=moved>.001;
  if(length>.1){s.faceX=x;s.faceY=y;}
  // Use the same distance-to-gait conversion as Game.move in core.mjs.
  s.step+=moved*.13;
}
export function lobbyCamera(width,height){
  const zoom=Math.min(Math.max(1,width)/1024,Math.max(1,height)/632);
  return {x:512,y:314,zoom};
}
export class LobbyState {
  constructor(){this.members=new Map();this.countdown=null;this.started=false;}
  sync(players){
    const ids=new Set(players.map(p=>p.id));
    let changed=false;
    for(const id of this.members.keys())if(!ids.has(id)){this.members.delete(id);changed=true;}
    for(const [i,p] of players.entries())if(!this.members.has(p.id)){
      this.members.set(p.id,{x:300+i*60,y:480,faceX:0,faceY:-1,step:0,spawned:false,panel:'choose',choice:0,focus:0,held:{},attack:0,creationLook:null,customLook:false,creationColorKey:null,recentColors:[],starterClaimed:false});changed=true;
    }
    if(changed)this.invalidate(players);
  }
  invalidate(players){for(const p of players)p.ready=false;this.countdown=null;}
  nearest(p){const s=this.members.get(p.id);return s?.spawned?LOBBY_OBJECTS.filter(o=>Math.hypot(s.x-o.x,s.y-o.y)<100).sort((a,b)=>Math.hypot(s.x-a.x,s.y-a.y)-Math.hypot(s.x-b.x,s.y-b.y))[0]:null;}
  tick(dt,players){
    const ready=players.length>0&&players.every(p=>p.ready&&p.profileId&&this.members.get(p.id)?.spawned&&!this.members.get(p.id)?.panel&&!p.ui&&!p.lobbyDisconnected);
    if(!ready){this.countdown=null;return false;}
    if(this.started)return false;
    this.countdown=(this.countdown??3)-dt;
    if(this.countdown<=0){this.started=true;return true;}
    return false;
  }
}

export class PlayableLobby {
  constructor({root,game,profiles,start,sound}){
    Object.assign(this,{root,getGame:game,profiles,start,sound});this.state=new LobbyState();this.nodes=new Map();this.practice=new LobbyPractice();this.practice.onSound=sound;this.television=new LobbyTelevision();
    this.animator=new Animator();this.labels=[];
    this.practice.persist=()=>{for(const a of this.practice.players){const p=this.getGame().players.find(p=>p.id===a.id);if(p)p.hunterPet=a.hunterPet;}this.getGame().persist();};
    this.practice.onPetFeed=(a,food)=>{const p=this.getGame().players.find(p=>p.id===a.id);return !!p&&take(p.inventory,food);};
    this.difficultyArt=new Image();this.difficultyArt.src=new URL('../assets/difficulty-icons.png',import.meta.url).href;
    this.mapArt=new Image();this.mapArt.src=new URL('../assets/map-icons.png',import.meta.url).href;
    root.classList.add('playable-lobby');
    const area=document.createElement('div');area.className='lobby-world';
    area.innerHTML='<canvas width="1024" height="620" aria-label="Playable lobby: move with WASD or left stick. E or the primary controller button interacts with nearby objects."></canvas><div class="lobby-panels"></div><div class="lobby-countdown" aria-live="polite"></div>';
    root.querySelector('#player-slots').before(area);this.area=area;this.canvas=area.querySelector('canvas');this.panels=area.querySelector('.lobby-panels');
    const modeButton=document.createElement('button');
    modeButton.textContent='House worlds mode: Off';modeButton.setAttribute('aria-pressed','false');
    modeButton.onclick=()=>{const g=this.getGame();g.houseWorldsEnabled=!g.houseWorldsEnabled;modeButton.textContent=`House worlds mode: ${g.houseWorldsEnabled?'On — roll 5 or 8 to travel':'Off'}`;modeButton.setAttribute('aria-pressed',String(g.houseWorldsEnabled));this.state.invalidate(g.players);};
    area.after(modeButton);
    root.querySelector('.party-heading h1').textContent='Gather around the board';
    root.querySelector('.party-help').textContent='Enter / A: join · WASD / left stick: move · E / A (B on Switch): interact · F / A: attack · J / B: jump · TV: D-pad / arrows move; right face / X jumps twice; bottom face / Z runs; down enters pipes; walk away to leave';
    this.canvas.onclick=e=>{
      const p=this.getGame().players.find(p=>p.device==='keyboard');if(!p)return;
      const r=this.canvas.getBoundingClientRect(),view=this.view||{x:512,y:310,zoom:r.width/1024};
      const x=view.x+(e.clientX-r.left-r.width/2)/view.zoom,y=view.y+(e.clientY-r.top-r.height/2)/view.zoom;
      const o=LOBBY_OBJECTS.find(o=>Math.hypot(o.x-x,o.y-y)<65);
      if(o&&this.state.nearest(p)===o)this.open(p,o.id);
    };
    for(const o of LOBBY_OBJECTS.filter(o=>!['board','target-lever','starter-chest','character-station','television'].includes(o.id)))document.getElementById(o.id).addEventListener('change',()=>this.state.invalidate(this.getGame().players));
  }
  reset(){this.practice=new LobbyPractice();this.practice.onSound=this.sound;this.state=new LobbyState();this.television.reset();this.nodes.clear();this.panels.replaceChildren();}
  keepSelectedPlayers(players=this.getGame().players){
    this.state.sync(players);
    for(const [i,p] of players.entries()){
      const s=this.state.members.get(p.id);
      if(!s||!p.profileId)continue;
      Object.assign(s,{spawned:true,panel:null,x:300+i*60,y:480,faceX:0,faceY:-1,step:0});
      const heroes=this.available(p),index=heroes.findIndex(h=>h.id===p.profileId);
      s.choice=index>=0?index:0;
      p.ready=false;
    }
  }
  sync(){
    const players=this.getGame().players;this.state.sync(players);
    for(const [id,node] of this.nodes)if(!players.some(p=>p.id===id)){node.remove();this.nodes.delete(id);}
    for(const p of players){const s=this.state.members.get(p.id);if(s.panel&&!this.nodes.has(p.id))this.renderPanel(p);}
    const count=players.filter(p=>p.ready).length;
    this.root.querySelector('#party-status').textContent=players.length?`${count} / ${players.length} ready · Walk to an object to interact`:'Press Enter or a controller button to join';
  }
  open(p,panel){
    const s=this.state.members.get(p.id);if(!s?.spawned||p.ui)return;
    if(panel==='target-lever'){this.practice.toggleTargets();this.sound?.('ui');return;}
    if(panel==='television'){if(this.television.join(p.id))this.sound?.('ui');return;}
    if(panel==='character-station'){this.openCharacterStation(p);return;}
    s.panel=panel;s.focus=0;this.renderPanel(p);
  }
  openCharacterStation(p){
    const s=this.state.members.get(p.id);if(!s||p.ui)return;
    const heroes=this.available(p),index=heroes.findIndex(h=>h.id===p.profileId);
    s.panel='choose';s.focus=0;s.choice=index>=0?index:0;s.characterHold=0;
    p.ready=false;this.state.countdown=null;this.renderPanel(p);this.sound?.('ui');
  }
  close(p){const s=this.state.members.get(p.id);s.panel=null;this.nodes.get(p.id)?.remove();this.nodes.delete(p.id);}
  available(p){return this.profiles.data.heroes.filter(h=>!this.getGame().players.some(q=>q!==p&&q.profileId===h.id));}
  renderPanel(p){
    const s=this.state.members.get(p.id);this.nodes.get(p.id)?.remove();
    const panel=document.createElement('section');panel.className='lobby-player-panel';panel.classList.toggle('board-menu',s.panel==='board');panel.dataset.ownerDevice=p.device;panel.style.setProperty('--player-color',p.color);panel.setAttribute('aria-label',p.name+' lobby controls');
    const tag=document.createElement('small');tag.textContent=p.device==='keyboard'?'KEYBOARD':'PLAYER '+(this.getGame().players.indexOf(p)+1);panel.append(tag);
    const heading=document.createElement('h2');panel.append(heading);
    const button=(label,fn,parent=panel)=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{fn();this.sync();};parent.append(b);return b;};
    const error=document.createElement('p');error.className='lobby-error';error.setAttribute('role','alert');
    if(s.panel==='choose'){
      heading.textContent='Choose your explorer';
      const heroes=this.available(p);s.choice=((s.choice%Math.max(1,heroes.length))+heroes.length)%Math.max(1,heroes.length);
      const h=heroes[s.choice];
      const preview=document.createElement('canvas');preview.width=220;preview.height=130;panel.append(preview);
      if(h){const c=preview.getContext('2d');c.imageSmoothingEnabled=false;c.translate(110,108);c.scale(2.25,2.25);drawPlayer(c,{...h,faceX:0,faceY:1,animationAction:'idle'},0);}
      button(h?'‹  '+h.name+'  ›':'No saved explorers',()=>{s.choice++;this.renderPanel(p);}).dataset.cycle='character';
      if(h)button('Choose',()=>{
        if(!this.available(p).some(q=>q.id===h.id)){this.renderPanel(p);return;}
        this.profiles.assign(p,h);s.spawned=true;this.state.invalidate(this.getGame().players);this.close(p);this.refreshChoosers();
      });
      button('+ New character',()=>{s.panel='create';s.focus=0;this.renderPanel(p);});
      button('Leave lobby',()=>{this.getGame().players=this.getGame().players.filter(q=>q!==p);this.sync();this.refreshChoosers();});
    }else if(s.panel==='create'){
      heading.textContent='New explorer';
      buildCreationMenu({panel,state:s,profiles:this.profiles,presets:LOOK_PRESETS,
        onCreate:(name,look)=>{this.profiles.assign(p,this.profiles.create(name,look));s.creationName=null;s.spawned=true;this.state.invalidate(this.getGame().players);this.close(p);this.refreshChoosers();},
        onBack:()=>{s.panel='choose';s.focus=0;this.renderPanel(p);}});
    }else if(s.panel==='starter-chest'){
      heading.textContent='Starter chest';
      const intro=document.createElement('p');intro.textContent='Choose your starter gear, or claim the complete kit. The starter quiver comes loaded with eight arrows.';panel.append(intro);
      const items=[['starter_bow','Starter bow',1],['starter_quiver','Starter quiver · 8 arrows',1],['starter_sword','Starter sword',1],['starter_shield','Starter shield',1],['starter_dagger','Starter dagger',1]];
      const addStarter=(list,type,qty)=>type==='starter_quiver'?give(list,'starter_quiver',1)&&give(list,'starter_arrow',8)&&loadQuiver(p,'starter_arrow'):give(list,type,qty);
      const claim=(type,qty)=>{const inventory=structuredClone(p.inventory||[]);if(!addStarter(inventory,type,qty)){error.textContent='Your pack is full.';return;}p.inventory=inventory;s.starterClaimed=true;this.sound?.('loot');this.renderPanel(p);};
      for(const [type,label,qty] of items)button(`Take ${label}${qty>1?' · '+qty:''}`,()=>claim(type,qty));
      button(s.starterClaimed?'Starter kit claimed':'Take complete starter kit',()=>{const inventory=structuredClone(p.inventory||[]);let ok=true;for(const [type,,qty] of items)if(!addStarter(inventory,type,qty)){ok=false;break;}if(ok){p.inventory=inventory;s.starterClaimed=true;this.sound?.('loot');}else error.textContent='The complete starter kit needs more backpack space.';this.renderPanel(p);});
      button('Close',()=>this.close(p));
    }else if(s.panel==='board'){
      heading.textContent='Ready to begin?';
      const info=document.createElement('div');info.className='board-menu-summary';
      for(const id of ['environment','difficulty','dice-count']){const e=document.getElementById(id),setting=document.createElement('span');setting.className='board-setting';setting.textContent=e.selectedOptions[0].text;info.append(setting);}
      panel.append(info);
      button(p.ready?'Cancel readiness':'Ready',()=>{p.ready=!p.ready;this.close(p);});
      button('Not yet',()=>this.close(p));
    }else{
      const o=LOBBY_OBJECTS.find(o=>o.id===s.panel);heading.textContent=o.name;
      const select=document.getElementById(s.panel);
      for(const option of select.options){const b=button('',()=>{
        select.value=option.value;select.dispatchEvent(new Event('change'));this.close(p);
      });if(s.panel==='difficulty'){
        b.classList.add('difficulty-choice');
        b.setAttribute('aria-label',`${option.text}. ${DIFFICULTY_DETAILS[option.value]}`);
        const icon=document.createElement('canvas');icon.width=40;icon.height=40;icon.className='difficulty-choice-icon';this.drawDifficulty(icon.getContext('2d'),option.value,0,0,40);
        const copy=document.createElement('span');copy.className='difficulty-choice-copy';
        const name=document.createElement('strong');name.textContent=(select.value===option.value?'✓ ':'')+option.text;
        const detail=document.createElement('small');detail.textContent=DIFFICULTY_DETAILS[option.value];
        copy.append(name,detail);b.append(icon,copy);
      }else if(s.panel==='environment'){
        b.classList.add('map-choice');
        b.setAttribute('aria-label',`${option.text}. ${MAP_DETAILS[option.value]}`);
        const icon=document.createElement('canvas');icon.width=40;icon.height=40;icon.className='map-choice-icon';this.drawMapIcon(icon.getContext('2d'),option.value,0,0,40);
        const copy=document.createElement('span');copy.className='difficulty-choice-copy';
        const name=document.createElement('strong');name.textContent=(select.value===option.value?'✓ ':'')+option.text;
        const detail=document.createElement('small');detail.textContent=MAP_DETAILS[option.value];
        copy.append(name,detail);b.append(icon,copy);
      }else b.textContent=(select.value===option.value?'✓ ':'')+option.text;}
      button('Close',()=>this.close(p));
    }
    panel.append(error);this.panels.append(panel);this.nodes.set(p.id,panel);this.highlight(p);
  }
  refreshChoosers(){for(const p of this.getGame().players)if(this.state.members.get(p.id)?.panel==='choose')this.renderPanel(p);}
  highlight(p){const s=this.state.members.get(p.id),buttons=[...this.nodes.get(p.id)?.querySelectorAll('button')||[]];s.focus=Math.max(0,Math.min(s.focus,buttons.length-1));buttons.forEach((b,i)=>b.classList.toggle('lobby-focus',i===s.focus));}
  navigate(p,{x=0,y=0,accept=false,back=false,adjust=false}){
    const s=this.state.members.get(p.id),panel=this.nodes.get(p.id);if(!panel)return;
    if(panel.creationNavigate){panel.creationNavigate({x,y,accept,back,adjust});return;}
    if(back){if(s.spawned)this.close(p);else if(s.panel==='create'){s.panel='choose';this.renderPanel(p);}else {this.getGame().players=this.getGame().players.filter(q=>q!==p);this.sync();}return;}
    const buttons=[...panel.querySelectorAll('button')];
    if(x&&s.panel==='choose'&&buttons[s.focus]?.dataset.cycle){s.choice+=x;this.renderPanel(p);return;}
    if(x||y){s.focus=(s.focus+(y||x)+buttons.length)%buttons.length;this.highlight(p);}
    if(accept)buttons[s.focus]?.click();
  }
  key(e){
    const owner=e.target.closest?.('[data-owner-device]')?.dataset.ownerDevice;
    if(owner&&owner!=='keyboard')e.preventDefault();
    const p=this.getGame().players.find(p=>p.device==='keyboard');if(!p)return false;
    const s=this.state.members.get(p.id);if(!s)return false;
    if(p.ui){
      if(owner&&owner!=='keyboard'){e.preventDefault();return true;}
      if(e.target.matches?.('input,select,textarea')&&e.key!=='Escape')return true;
      if(e.key==='Escape'){e.preventDefault();this.getGame().inventoryAction(p,'close');return true;}
      return false;
    }
    if(s.panel){
      if(owner==='keyboard'&&e.target.matches('input')&&!['Escape','Enter'].includes(e.key))return true;
      if(e.key==='Tab'&&s.panel==='create')return true;
      const action={x:e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0,y:e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0,accept:e.key==='Enter',back:e.key==='Escape',adjust:e.code==='Space'};
      e.preventDefault();
      if(action.x||action.y||action.accept||action.back||action.adjust){if(!e.repeat||s.panel==='create')this.navigate(p,action);}return true;
    }
    if(e.key==='Enter'){e.preventDefault();return true;}
    if(e.key==='Escape'){e.preventDefault();p.ready=false;this.state.countdown=null;return true;}
    return false;
  }
  controller(pad,previous){
    const p=this.getGame().players.find(p=>p.device==='pad:'+pad.index);if(!p)return;
    const s=this.state.members.get(p.id);if(!s)return;
    if(s.panel)s.held.lobbyInteract=!!pad.buttons[0]?.pressed;
    const x=Math.abs(pad.axes[0]||0)>.6?Math.sign(pad.axes[0]):0,y=Math.abs(pad.axes[1]||0)>.6?Math.sign(pad.axes[1]):0;
    const repeat=s.panel==='create'&&performance.now()>(s.nextCreationMove||0);
    const dx=pad.buttons[14]?.pressed?-1:pad.buttons[15]?.pressed?1:x,dy=pad.buttons[12]?.pressed?-1:pad.buttons[13]?.pressed?1:y;
    if(s.panel==='create'){
      if(dx||dy){if(repeat||dx!==s.creationDX||dy!==s.creationDY){this.navigate(p,{x:dx,y:dy});s.nextCreationMove=performance.now()+(dx!==s.creationDX||dy!==s.creationDY?300:65);}}
      this.navigate(p,{accept:pad.buttons[0]?.pressed&&!previous[0],back:pad.buttons[1]?.pressed&&!previous[1],adjust:pad.buttons[2]?.pressed&&!previous[2]});
      s.creationDX=dx;s.creationDY=dy;
    }else if(s.panel)this.navigate(p,{x:pad.buttons[14]?.pressed&&!previous[14]?-1:pad.buttons[15]?.pressed&&!previous[15]?1:x!==s.axisX?x:0,y:pad.buttons[12]?.pressed&&!previous[12]?-1:pad.buttons[13]?.pressed&&!previous[13]?1:y!==s.axisY?y:0,accept:pad.buttons[0]?.pressed&&!previous[0],back:pad.buttons[1]?.pressed&&!previous[1]});
    s.axisX=x;s.axisY=y;
  }
  update(dt,inputs,blocked=false){
    this.sync();const players=this.getGame().players;
    for(const p of players){
      const s=this.state.members.get(p.id),input=players.find(q=>q.device===p.device)===p?(inputs[p.device]||{}):{};
      if(this.television?.players.has(p.id)&&(blocked||!s.spawned||p.lobbyDisconnected||Math.hypot(s.x-785,s.y-165)>103||p.ui))this.television.leave(p.id);
      if(!blocked&&s.spawned&&!s.panel&&!p.lobbyDisconnected){
        const game=this.getGame(),edge=key=>input[key]&&!s.held[key];
        if(p.ui)s.inventoryRelease=true;
        if(edge('inventory')){if(p.ui)p.ui=null;else{game.openInventory(p);this.state.invalidate(players);}}
        if(p.ui){
          s.inventoryRelease=true;
          for(const action of ['next','prev','up','down','panel','use','offhand','pick','close'])if(edge(action))game.inventoryAction(p,action);
          const direction=['next','prev','up','down'].find(key=>input[key]);
          s.menuRepeat=direction?(s.menuRepeat||0)+dt:0;
          if(direction&&s.menuRepeat>.35){game.inventoryAction(p,direction);s.menuRepeat=.24;}
        }else{
          const o=this.state.nearest(p);
          if(o?.id==='character-station'&&edge('lobbyInteract'))this.openCharacterStation(p);
          if(this.television?.players.has(p.id)){
            if(edge('interact'))this.television.leave(p.id);
          }else if((edge('tvA')||edge('lobbyInteract'))&&o?.id==='television')this.open(p,'television');
          else if(edge('lobbyInteract')&&o?.id!=='character-station'){
            if(o?.id==='target-lever'){this.practice.toggleTargets();this.sound?.('ui');}
            else if(o)this.open(p,o.id);
          }
          if(o&&input.lobbyInteract)s.stationPress=true;
          if(!input.lobbyInteract)s.stationPress=false;
        }
      }else s.moving=false;
      if(!p.ui&&!['inventory','use','close','interact','attack','jump','dodge','block','trap','potion','bait','offhand','panel'].some(key=>input[key]))s.inventoryRelease=false;
      s.held={...input};
    }
    const practiceInputs={...inputs},tvCommands={};
    for(const p of players)if(this.state.members.get(p.id)?.stationPress)practiceInputs[p.device]={...inputs[p.device],attack:false};
    for(const p of players)if(this.television?.players.has(p.id)){
      const input=inputs[p.device]||{};
      tvCommands[p.id]={left:!!input.tvLeft,right:!!input.tvRight,jump:!!input.tvB,run:!!input.tvA,down:!!input.tvDown,up:!!input.tvUp};
      practiceInputs[p.device]={x:input.walkX||0,y:input.walkY||0};
    }
    this.practice.stepPractice(dt,players,this.state.members,practiceInputs,blocked);
    for(const p of players)if(this.television?.players.has(p.id)){
      const s=this.state.members.get(p.id);if(Math.hypot(s.x-785,s.y-165)>103)this.television.leave(p.id);
    }
    if(!blocked)this.television?.step(dt,tvCommands);
    this.petHudClock=(this.petHudClock||0)+dt;
    if(this.petHudClock>.25&&this.area&&typeof document!=='undefined'){
      this.petHudClock=0;let hud=this.area.querySelector('.lobby-pets');
      if(!hud){hud=document.createElement('div');hud.className='lobby-pets';this.area.append(hud);}
      if(!hud.contains(document.activeElement)){hud.replaceChildren();for(const a of this.practice.players){const card=petCard(this.practice,a);if(card){const owner=document.createElement('small');owner.textContent=a.name+"’s companion";card.prepend(owner);hud.append(card);}}}
    }
    if(!blocked&&this.state.tick(dt,players))this.start();
    this.draw();
    this.area.querySelector('.lobby-countdown').textContent=this.state.countdown!==null?`The board opens in ${Math.max(1,Math.ceil(this.state.countdown))}…`:'';
  }
  drawPractice(c){
    c.save();
    for(const t of this.practice.traps){c.strokeStyle='#dbbd76';c.lineWidth=3;c.beginPath();c.ellipse(t.x,t.y,15,8,0,0,Math.PI*2);c.stroke();}
    for(const b of this.practice.baits){c.fillStyle='#dc9880';c.fillRect(b.x-4,b.y-3,8,6);}
    for(const a of this.practice.loot)if(a.embedded&&ARROW_TYPES.includes(a.type))drawEmbeddedArrow(c,a,this.practice.time);
    for(const a of groupLodgedArrows(this.practice.arrows)){if(a.stuck){drawEmbeddedArrow(c,a,this.practice.time);continue;}c.save();c.translate(a.x,a.y-(a.z||0));c.rotate(arrowVisualAngle(a));drawFlyingArrow(c,a,this.practice.time);c.restore();}
    for(const b of this.practice.spells)drawMagicBolt(c,b);
    for(const f of this.practice.effects){if(f.magicBolt){drawMagicBurst(c,f);continue;}if(!f.text)continue;c.fillStyle=f.color||'#fff';c.font='12px system-ui';this.label(f.text,f.x,f.y,14,f.color||'#fff');}
    c.restore();
  }
  drawDifficulty(c,value,x,y,size){
    if(!this.difficultyArt.complete||!this.difficultyArt.naturalWidth)return;
    const index={gentle:0,adventure:1,wild:2}[value]??1,w=this.difficultyArt.naturalWidth/3;
    c.drawImage(this.difficultyArt,index*w,0,w,this.difficultyArt.naturalHeight,x,y,size,size);
  }
  drawMapIcon(c,value,x,y,size){
    if(!this.mapArt.complete||!this.mapArt.naturalWidth)return;
    const index={random:0,forest:1,desert:2,ice:3,house:4,temple:5}[value]??0,w=this.mapArt.naturalWidth/6;
    c.drawImage(this.mapArt,index*w,0,w,this.mapArt.naturalHeight,x,y,size,size);
  }
  drawBackdrop(c){
    c.fillStyle='#505659';c.fillRect(0,0,1024,620);
    for(let y=68;y<590;y+=42){
      for(let x=16;x<1010;x+=42){
        c.fillStyle=(Math.floor(x/42)+Math.floor(y/42))%3===0?'#62686a':'#656b6d';
        c.fillRect(x,y,40,40);
      }
    }
    c.fillStyle='#343d40';c.fillRect(529,68,5,522);
    c.fillRect(8,58,1008,11);c.fillRect(8,590,1008,12);
    c.fillRect(8,68,7,522);c.fillRect(1010,68,7,522);
  }
  draw(){
    const c=this.canvas.getContext('2d'),{w,h,scale}=resizeGameSurface(this.canvas,c);
    // Fit the room, totem card, and lower captions. Joining never crops stations.
    this.view=lobbyCamera(w*2,h*2);
    const view=this.view;this.labels=[];
    c.fillStyle='#20292d';c.fillRect(0,0,w,h);
    c.translate(w/2,h/2);c.scale(view.zoom/2,view.zoom/2);c.translate(-view.x,-view.y);
    this.drawBackdrop(c);
    c.textAlign='center';
    for(const t of this.practice.targets){
      c.save();c.translate(t.homeX,t.homeY-18);c.rotate(t.angle);
      const travel=(t.x-t.homeX)*Math.cos(t.angle)+(t.y-t.homeY)*Math.sin(t.angle);
      c.fillStyle='#3b3832';c.fillRect(-65,-22,130,5);c.fillStyle='#96958b';c.fillRect(-61,-21,122,1);
      c.fillStyle='#74604a';c.fillRect(travel-3,-18,6,19);
      for(const [radius,color] of [[23,'#8d744a'],[20,'#dbca99'],[16,'#e5e1ca'],[12,'#36464c'],[9,'#598ea6'],[6,'#bf5948'],[3,'#e8bf52']]){c.fillStyle=t.flash>0&&radius===23?'#fff5b2':color;c.beginPath();c.arc(travel,0,radius,0,Math.PI*2);c.fill();}
      c.restore();this.label(t.hits+' hits · '+Math.round(t.score)+' damage',t.x+(t.angle<-1?54:0),t.y+(t.angle<-1?14:30),12);
    }
    for(const o of LOBBY_OBJECTS){
      c.fillStyle='#42474a';c.beginPath();c.ellipse(o.x,o.y+12,58,18,0,0,Math.PI*2);c.fill();
      if(o.id==='environment'){
        c.fillStyle='#775a41';c.fillRect(o.x-47,o.y-35,94,44);c.fillRect(o.x-40,o.y+9,8,16);c.fillRect(o.x+32,o.y+9,8,16);c.fillStyle='#cebf92';c.fillRect(o.x-38,o.y-29,76,29);c.strokeStyle='#607760';c.lineWidth=3;c.beginPath();c.moveTo(o.x-30,o.y-22);c.lineTo(o.x-4,o.y-7);c.lineTo(o.x+26,o.y-24);c.stroke();
      }else if(o.id==='difficulty'){
        c.fillStyle='#918779';c.fillRect(o.x-21,o.y-65,42,76);c.fillStyle='#403c36';c.fillRect(o.x-12,o.y-44,8,9);c.fillRect(o.x+4,o.y-44,8,9);c.fillRect(o.x-9,o.y-20,18,7);
        c.strokeStyle='#c7a75f';c.lineWidth=2;c.beginPath();c.moveTo(o.x,o.y-68);c.lineTo(o.x,o.y-91);c.stroke();
        this.drawDifficulty(c,document.getElementById('difficulty').value,o.x-28,o.y-147,56);
      }else if(o.id==='dice-count'){
        c.fillStyle='#785a46';c.fillRect(o.x-43,o.y-34,86,47);for(const x of lobbyDiceOffsets(document.getElementById('dice-count').value)){c.fillStyle='#ede5cc';c.fillRect(o.x+x,o.y-25,24,24);c.fillStyle='#333';c.fillRect(o.x+x+5,o.y-20,4,4);c.fillRect(o.x+x+15,o.y-10,4,4);}
      }else if(o.id==='starter-chest'){
        c.fillStyle='#4b3527';c.fillRect(o.x-58,o.y-28,116,48);c.fillStyle='#8e623a';c.fillRect(o.x-55,o.y-32,110,44);c.fillStyle='#cfa85e';c.fillRect(o.x-5,o.y-10,10,13);c.strokeStyle='#e0bf73';c.lineWidth=2;c.strokeRect(o.x-55,o.y-32,110,44);c.fillStyle='#f1dfaa';c.font='bold 13px Georgia';this.label('STARTER',o.x,o.y-8,12,'#f1dfaa',650);
      }else if(o.id==='target-lever'){
        c.fillStyle='#574a38';c.fillRect(o.x-15,o.y-12,30,18);c.strokeStyle='#c0b497';c.lineWidth=5;c.beginPath();c.moveTo(o.x,o.y);c.lineTo(o.x+(this.practice.targetsMoving?10:-10),o.y-29);c.stroke();c.fillStyle=this.practice.targetsMoving?'#8dc99a':'#b66b4e';c.fillRect(o.x+(this.practice.targetsMoving?5:-15),o.y-34,11,9);
      }else if(o.id==='television'){
        drawLobbyTelevision(c,this.television,o);
      }else if(o.id==='character-station'){
        c.fillStyle='#40362f';c.fillRect(o.x-42,o.y-33,84,54);c.fillStyle='#6d4f38';c.fillRect(o.x-37,o.y-38,74,50);c.fillStyle='#d7bd7a';c.fillRect(o.x-7,o.y-18,14,19);
        c.strokeStyle='#e4c778';c.lineWidth=2;c.strokeRect(o.x-30,o.y-29,60,28);
        c.fillStyle='#eee2be';c.font='bold 11px system-ui';this.label('HEROES',o.x,o.y-10,11,'#eee2be',650);
        c.fillStyle='#98d2c7';c.beginPath();c.arc(o.x-22,o.y-17,5,0,Math.PI*2);c.arc(o.x+22,o.y-17,5,0,Math.PI*2);c.fill();
      }else{
        drawLobbyBoard(c,this.practice.time);
      }
      c.fillStyle='#f2efdf';c.font='15px system-ui';this.label(o.name,o.x,o.y+(o.id==='target-lever'?27:44),15,'#f4efdc',650);
      if(o.id!=='board'){c.font='12px system-ui';c.fillStyle='#d1d5d4';const detail=o.id==='target-lever'?(this.practice.targetsMoving?'Moving':'Stopped'):o.id==='starter-chest'?'Basic gear · six items':o.id==='character-station'?'A · change hero (B on Switch)':o.id==='television'?(this.television.players.size?'D-pad move · Down: pipe':'Interact · play'):document.getElementById(o.id).selectedOptions[0].text;this.label(detail,o.x,o.y+(o.id==='target-lever'?45:64),12,'#d7e2d8');}
    }
    for(const a of this.practice.players)if(a.hunterPet)drawHunterPet(c,a.hunterPet,a,this.practice.time,48);
    this.drawPractice(c);
    for(const t of this.practice.targets)for(const f of [...t.combatText].reverse()){
      c.save();c.globalAlpha=Math.min(1,f.life/.12);c.translate(t.x,t.y-42-f.age*34-f.offset);
      const scale=1+Math.sin(Math.min(1,f.age/.12)*Math.PI)*.25;c.scale(scale,scale);
      c.font='bold 18px system-ui';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#142021';c.fillStyle=DAMAGE_COLORS[f.type]||DAMAGE_COLORS.physical;this.label(String(Math.round(f.amount)),t.x,t.y-42-f.age*34-f.offset,18,DAMAGE_COLORS[f.type]||DAMAGE_COLORS.physical,700);c.restore();
    }
    for(const p of [...this.getGame().players].sort((a,b)=>this.state.members.get(a.id).y-this.state.members.get(b.id).y)){
      const s=this.state.members.get(p.id);if(!s.spawned)continue;
      const actor=this.practice.players.find(a=>a.id===p.id)||{...p,...s};
      c.fillStyle='#41474b';c.beginPath();c.ellipse(s.x,s.y-(actor.groundHeight||0)+4,20,7,0,0,Math.PI*2);c.fill();
      this.animator.draw(c,{...actor,kind:'player'},this.practice.time,LOBBY_PLAYER_SIZE);
      drawBowAim(c,actor,LOBBY_PLAYER_SIZE/48,this.practice.time);
      c.font='13px system-ui';c.fillStyle=p.ready?'#a8f4c9':p.color;this.label((p.ready?'✓ ':'')+p.name+(p.lobbyDisconnected?' · disconnected':''),s.x,s.y+27,14,p.ready?'#a8f4c9':p.color,650);
      const o=this.state.nearest(p);if(o&&!s.panel&&!p.ui){const names=controllerButtonNames(p.controllerFamily||'generic'),interact=p.device==='keyboard'?'E':names[0],prompt=o.id==='character-station'?interact+' · '+o.name:o.id==='television'?(this.television.players.has(p.id)?'Walk away · leave':interact+' · play TV'):interact+' · '+o.name;// TV prompts belong below the cabinet and its controls, never above the player.
        const promptX=o.id==='television'?o.x:s.x,promptY=o.id==='television'?o.y+80:s.y-95;
        c.fillStyle='#182326';c.fillRect(promptX-75,promptY,150,24);
        c.fillStyle='#fff';c.font='12px system-ui';this.label(prompt,promptX,promptY+12,13);}
    }
    applyCelShading(c);
    // Typography is drawn at display resolution after scene shading, never pixel-scaled.
    c.setTransform(scale/2,0,0,scale/2,0,0);c.textAlign='center';c.textBaseline='middle';
    for(const label of this.labels){
      const x=Math.round(w+(label.x-view.x)*view.zoom),y=Math.round(h+(label.y-view.y)*view.zoom);
      c.font=`${label.weight||500} ${label.size}px system-ui`;c.lineWidth=3;c.strokeStyle='#10231fe8';
      c.strokeText(label.text,x,y);c.fillStyle=label.color;c.fillText(label.text,x,y);
    }
  }
  label(text,x,y,size=14,color='#f4efdc',weight=500){this.labels.push({text,x,y,size,color,weight});}
}
