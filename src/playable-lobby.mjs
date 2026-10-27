import {buildExpeditionMenu} from './expedition-menu.mjs';
import {drawDeathSteps} from './death-steps.mjs';
import {drawTracks} from './environment.mjs';
import {drawRealmSprite,REALM_COLORS} from './realm-art.mjs';
import { buildCreationMenu } from './creation-menu.mjs';
import {drawLobbyBackdrop} from './lobby-backdrop.mjs';
import {drawLobbyCeilingWash,drawLobbyCastShadow,drawLobbyActorShadow} from './lobby-lighting.mjs';
import {LOBBY_FLOOR} from './lobby-geometry.mjs';
import { Animator } from './animation.mjs';
import {characterLightingFrame} from './character-lighting.mjs';
import {resizeGameSurface,LOBBY_PLAYER_SIZE} from './render-settings.mjs';
import {drawLobbyBoard} from './lobby-board.mjs';
import {drawLobbyMapTable,drawLobbyDifficultyTotem,drawLobbyDiceTray,drawLobbyExplorerStation,drawLobbyTargetLever} from './lobby-prop-art.mjs';
import {applyCelShading} from './cel-shading.mjs';
import {drawBansheeSteps} from './banshee-steps.mjs';
import {drawEmbeddedArrow,groupLodgedArrows,drawFlyingArrow,arrowVisualAngle,drawArrowTrail} from './embedded-arrow.mjs';
import {drawBoomerang} from './boomerang.mjs';
import {drawMagicBolt} from './magic-bolt-render.mjs';
import {playerInput} from './inventory-input.mjs';
import {drawMagicBurst} from './magic-bolt-effects.mjs';
import {take} from './items.mjs';
import {drawHunterPet} from './hunter-pet-render.mjs';
import {petCard} from './hunter-pet-ui.mjs';
import {LobbyPractice} from './lobby-practice.mjs';
import {lobbyPracticeInput} from './lobby-input-release.mjs';
import { drawPlayer } from './player-motion.mjs';
import {drawBowAim} from './bow-aim.mjs';
import { controllerButtonNames, controllerFamily } from './controls.mjs';
import { controllerGlyph } from './controller-glyphs.mjs';
import { ARROW_TYPES } from './quiver.mjs';
import {DAMAGE_COLORS} from './enemy-damage.mjs';
import {LobbyTelevision,drawLobbyTelevision,drawLobbyControllers} from './lobby-tv.mjs';
import {lobbyObjectNearby,lobbyLabelY,lobbyPropDepth,lobbyActorDepth,targetReportAlpha,drawSeatedLobbyPlayer,canUseLobbyTV} from './lobby-scene.mjs';
import {TvWildbound} from './tv-wildbound.mjs';
import {tickSalvage} from './salvage.mjs';
import {tickLobbyStorage} from './lobby-storage.mjs';
import {spatialMenuNeighbor} from './menu-navigation.mjs';
import {planPlayerPanels,anchoredPopupBox} from './player-panel-layout.mjs';
import {drawPortal} from './portal-art.mjs';
import {drawStarterChest,restockStarterChests} from './starter-chest.mjs';
import {freshCharacter} from './items.mjs';
import {drawItem} from './item-art.mjs';
import {blankExplorerPreview} from './blank-explorer.mjs';

export const LOBBY_OBJECTS = [
  {id:'environment',name:'Map table',x:625,y:548},
  {id:'difficulty',name:'Difficulty totem',x:955,y:165},
  {id:'dice-count',name:'Dice tray',x:780,y:548},
  {id:'board',name:'Gameboard',x:770,y:375},
  {id:'target-lever',name:'Target lever',x:465,y:548},
  {id:'character-station',name:'Explorer station',x:635,y:165},
  {id:'television',name:'Arcade TV',x:785,y:165},
  {id:'starter-chest',name:'Starter chest',x:950,y:548},
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
  gentle:'Each hit deals 1 damage.',
  adventure:'Enemies deal 35% less damage.',
  wild:'Enemies deal full damage.',
};
const MAP_DETAILS={
  swamp:'Old-growth bayou islands, winding rivers, boardwalks, and fireflies.',
  caverns:'Connected limestone chambers, glowing crystals, underground pools, and falling stone.',
  shadow:'Twisted woodland, pale wildlife, luminous wards, and murk wolves.',
  random:'A changing expedition every time.',
  forest:'Lush trails, rivers, and wild creatures.',
  desert:'Dry dunes, mesas, and scarce water.',
  ice:'Frozen ground, snow, and blizzards.',
  house:'A lived-in house with gardens and doors.',
  temple:'Jungle ruins with dangerous encounters.',
  beach:'Turquoise surf, tide pools, sea arches, and a coastal pier.',
  graveyard:'A fenced cemetery, restless graves, black wings, and candlelit crypts.',
};
const MAP_MODE_DETAILS={
  bounded:'The current board-sized expedition, with a clear edge and finale.',
  boundless:'Explore an endless version of your selected map, with connected regions and landmarks. The board clearing stays safe; danger waits beyond it.',
};
export function moveLobbyCharacter(s,input,dt){
  const x=Number.isFinite(input.x)?input.x:0,y=Number.isFinite(input.y)?input.y:0;
  const length=Math.hypot(x,y),scale=180*dt/Math.max(1,length),beforeX=s.x,beforeY=s.y;
  s.x=Math.max(LOBBY_FLOOR.left+8,Math.min(LOBBY_FLOOR.right-8,s.x+x*scale));s.y=Math.max(LOBBY_FLOOR.top+8,Math.min(LOBBY_FLOOR.bottom-8,s.y+y*scale));
  const moved=Math.hypot(s.x-beforeX,s.y-beforeY);
  s.moving=moved>.001;
  if(length>.1){s.faceX=x;s.faceY=y;}
  // Use the same distance-to-gait conversion as Game.move in core.mjs.
  s.step+=moved*.13;
}
export function lobbyCamera(width,height){
  const zoom=Math.min(Math.max(1,width)/1024,Math.max(1,height)/592);
  return {x:516,y:324,zoom};
}
export class LobbyState {
  constructor(){this.members=new Map();this.countdown=null;this.started=false;}
  sync(players){
    const ids=new Set(players.map(p=>p.id));
    let changed=false;
    for(const id of this.members.keys())if(!ids.has(id)){this.members.delete(id);changed=true;}
    for(const [i,p] of players.entries())if(!this.members.has(p.id)){
      this.members.set(p.id,{x:300+i*60,y:480,faceX:0,faceY:-1,step:0,spawned:false,panel:'choose',choice:0,focus:0,held:{},attack:0,creationLook:null,customLook:false,creationColorKey:null,recentColors:[]});changed=true;
    }
    if(changed)this.invalidate(players);
  }
  invalidate(players){for(const p of players)p.ready=false;this.countdown=null;}
  nearest(p,controllers){const s=this.members.get(p.id);return s?.spawned?LOBBY_OBJECTS.filter(o=>o.id==='television'?canUseLobbyTV(s,s,controllers):Math.hypot(s.x-o.x,s.y-o.y)<100).sort((a,b)=>Math.hypot(s.x-a.x,s.y-a.y)-Math.hypot(s.x-b.x,s.y-b.y))[0]:null;}
  tick(dt,players){
    const ready=players.length>0&&players.every(p=>p.ready&&p.profileId&&this.members.get(p.id)?.spawned&&!this.members.get(p.id)?.panel&&!p.ui&&!p.room&&!p.lobbyDisconnected);
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
    this.boardReadyMenuOpen=false;this.boardReadyNode=null;
    this.animator=new Animator();this.labels=[];
    this.configurePractice();
    this.difficultyArt=new Image();this.difficultyArt.src=new URL('../assets/difficulty-icons.png',import.meta.url).href;
    this.mapArt=new Image();this.mapArt.src=new URL('../assets/map-icons.png',import.meta.url).href;
    this.beachArt=new Image();this.beachArt.src=new URL('../assets/beach-background-v1.png',import.meta.url).href;
    this.cemeteryArt=new Image();this.cemeteryArt.src=new URL('../assets/map-cemetery-v1.png',import.meta.url).href;
    this.realmMapArt=Object.fromEntries(['swamp','caverns','shadow'].map(env=>{const image=new Image();image.src=new URL(`../assets/inventory-environment-${env}-v1.png`,import.meta.url).href;return [env,image];}));
    root.classList.add('playable-lobby');
    const area=document.createElement('div');area.className='lobby-world';
    area.innerHTML='<canvas width="1024" height="620" aria-label="Playable lobby: move with WASD or left stick. E or the primary controller button interacts with nearby objects."></canvas><div class="lobby-panels"></div><div class="lobby-countdown" aria-live="polite"></div>';
    root.querySelector('#player-slots').before(area);this.area=area;this.canvas=area.querySelector('canvas');this.panels=area.querySelector('.lobby-panels');
    root.querySelector('.party-heading h1').textContent='Gather around the board';
    this.defaultHelp='Enter / A: join · WASD / left stick: move · E / Y (X on Switch): interact · F / X (Y on Switch): attack · J / A (B on Switch): jump · RT / ZR / Space: dash · LT / ZL: hold position / aim · D-pad Up / P: storage portal · LB / L / H: potion · TV: D-pad / arrows move; A (Z key) jumps twice; X runs (X key); down enters pipes; walk away to leave';
    root.querySelector('.party-help').textContent=this.defaultHelp;
    this.canvas.onclick=e=>{
      const p=this.getGame().players.find(p=>p.device==='keyboard');if(!p)return;
      const r=this.canvas.getBoundingClientRect(),view=this.view||{x:512,y:310,zoom:r.width/1024};
      const x=view.x+(e.clientX-r.left-r.width/2)/view.zoom,y=view.y+(e.clientY-r.top-r.height/2)/view.zoom;
      const o=LOBBY_OBJECTS.find(o=>Math.hypot(o.x-x,o.y-y)<65);
      if(o&&this.state.nearest(p,this.television?.controllers)===o)this.open(p,o.id);
    };
    for(const id of ['map-mode','environment','difficulty','dice-count'])document.getElementById(id).addEventListener('change',()=>this.state.invalidate(this.getGame().players));
  }
  configurePractice(){
    this.practice.onSound=this.sound;
    this.practice.persist=()=>{for(const a of this.practice.players){const p=this.getGame().players.find(p=>p.id===a.id);if(p)p.hunterPet=a.hunterPet;}this.getGame().persist();};
    this.practice.onLobbyPickup=actor=>{const p=this.getGame().players.find(p=>p.id===actor.id);if(p){p.inventory=structuredClone(actor.inventory);p.field=structuredClone(actor.field);this.getGame().persist();}};
    this.practice.onPetFeed=(a,food)=>{const p=this.getGame().players.find(p=>p.id===a.id);return !!p&&take(p.inventory,food);};
    this.getGame().canDropLobbyItem=p=>!!this.state.members.get(p.id)?.spawned;
    this.getGame().dropLobbyItem=(p,type,qty,metadata)=>this.dropItem(p,type,qty,metadata);
  }
  reset(){delete this.getGame().tvWorld;this.practice=new LobbyPractice();this.state=new LobbyState();this.configurePractice();this.television.reset();this.tvWildbound=null;this.starterChestArt=null;this.nodes.clear();this.panels.replaceChildren();const help=this.root?.querySelector('.party-help');if(help)help.textContent=this.defaultHelp;}
  dropItem(player,type,qty,metadata={}){const member=this.state.members.get(player.id);if(!member?.spawned)return false;return this.practice.dropLoot(member.x,member.y,type,qty,player.name+' dropped',true,metadata);}
  returnFromTv(){
    const game=this.getGame();
    for(const p of game.players)if(this.tvWildbound?.players.has(p.id))p.ui=null;
    game.persist();this.reset();this.keepSelectedPlayers();this.draw();
  }
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
    if(this.boardReadyMenuOpen&&!this.boardReadyNode)this.renderBoardReadyMenu();
    if(this.boardReadyMenuOpen)this.syncBoardReadyMenu();
    this.positionPanels();
    const count=players.filter(p=>p.ready).length;
    this.root.querySelector('#party-status').textContent=players.length?`${count} / ${players.length} ready · Walk to an object to interact`:'Press Enter or a controller button to join';
  }
  positionPanels(){
    if(!this.panels)return;
    const players=this.getGame().players,open=players.filter(p=>this.nodes.has(p.id));
    const bounds=this.panels.getBoundingClientRect();
    if(!bounds.width||!bounds.height)return;
    const canvasBounds=this.canvas.getBoundingClientRect(),view=lobbyCamera(canvasBounds.width,canvasBounds.height);
    const viewportKey=[bounds.width,bounds.height,canvasBounds.left-bounds.left,canvasBounds.top-bounds.top,canvasBounds.width,canvasBounds.height].join('|');
    const resized=viewportKey!==this.panelViewportKey;
    const key=[viewportKey,players.length,...open.map(p=>`${p.id}:${this.state.members.get(p.id)?.panel}`)].join('|');
    if(key===this.panelLayoutKey)return;
    this.panelViewportKey=viewportKey;
    const layout=planPlayerPanels(players,open,bounds.width,bounds.height,{
      width:p=>this.state.members.get(p.id)?.panel==='environment'?440:this.state.members.get(p.id)?.panel==='board'?300:['choose','confirm-delete'].includes(this.state.members.get(p.id)?.panel)?340:this.state.members.get(p.id)?.panel==='create'?540:280,
      height:p=>this.state.members.get(p.id)?.panel==='dice-count'?280:this.state.members.get(p.id)?.panel==='environment'?780:this.state.members.get(p.id)?.panel==='board'?310:this.state.members.get(p.id)?.panel==='create'?560:this.state.members.get(p.id)?.panel==='choose'&&!this.available(p).length?410:['choose','confirm-delete'].includes(this.state.members.get(p.id)?.panel)?520:390,
    });
    for(const p of open){
      const box=layout.get(p.id),panel=this.nodes.get(p.id);
      const chooser=['choose','confirm-delete'].includes(this.state.members.get(p.id)?.panel);
      const cardHeight=panel.classList.contains('empty-chooser')?410:520;
      // Compact the card in small windows without letting its text become tiny.
      const scale=chooser?Math.max(.8,Math.min(1,bounds.width/960,bounds.height/640,box.width/340,box.height/cardHeight)):1;
      if(chooser){
        const width=Math.min(box.width,340*scale),height=Math.min(box.height,cardHeight*scale);
        if(box.side==='right')box.x+=box.width-width;
        if([2,3].includes(players.indexOf(p)%4))box.y+=box.height-height;
        box.width=width;box.height=height;
      }
      if(players.length===1&&open.length===1&&['choose','confirm-delete'].includes(this.state.members.get(p.id)?.panel)){
        box.x=(bounds.width-box.width)/2;box.y=(bounds.height-box.height)/2;
      }
      if(this.state.members.get(p.id)?.panel==='environment'){box.width=Math.min(box.width,box.height*.57);box.height=box.width/.57;if(players.length===1){box.x=(bounds.width-box.width)/2;box.y=(bounds.height-box.height)/2;}}
      if(['difficulty','dice-count'].includes(this.state.members.get(p.id)?.panel)){
        panel.style.transition='none';
        const menu=this.state.members.get(p.id)?.panel;
        const totem=LOBBY_OBJECTS.find(o=>o.id===menu);
        const x=canvasBounds.left-bounds.left+canvasBounds.width/2+(totem.x-view.x)*view.zoom;
        const y=canvasBounds.top-bounds.top+canvasBounds.height/2+(totem.y-view.y)*view.zoom;
        Object.assign(box,anchoredPopupBox(bounds.width,bounds.height,box.width,box.height,x,y));
        if(menu==='dice-count'){
          box.x=Math.max(8,Math.min(bounds.width-box.width-8,x-box.width/2));
          box.y=Math.max(8,Math.min(bounds.height-box.height-8,y-box.height-35*view.zoom));
        }
      }
      panel.style.position='absolute';panel.style.boxSizing='border-box';
      // A viewport resize must be immediate; party joins may still animate docks.
      if(resized)panel.style.transition='none';else panel.style.removeProperty('transition');
      panel.style.zoom=String(scale);
      panel.style.left=box.x/scale+'px';panel.style.top=box.y/scale+'px';
      panel.style.width=box.width/scale+'px';panel.style.height=box.height/scale+'px';panel.style.maxHeight=box.height/scale+'px';
    }
    this.panelLayoutKey=key;
  }
  open(p,panel){
    const s=this.state.members.get(p.id);if(!s?.spawned||p.ui)return;
    if(panel==='board'){this.openBoardReadyMenu(p);return;}
    if(panel==='target-lever'){this.practice.toggleTargets();this.sound?.('ui');return;}
    if(panel==='television'){
      if(!canUseLobbyTV(s,this.practice.players.find(a=>a.id===p.id)||s,this.television.controllers))return;
      const requestedSlot=s.x<785?0:1;
      if(this.television.join(p.id,requestedSlot)){const slot=this.television.players.get(p.id).slot;Object.assign(s,{x:785+(slot?62:-62),y:234,faceX:0,faceY:-1});const actor=this.practice.players.find(a=>a.id===p.id);if(actor)Object.assign(actor,{x:s.x,y:s.y,faceX:0,faceY:-1,jumpHeight:0,groundHeight:0,jumpVelocity:0,wingHover:false,dashTime:0,slideX:0,slideY:0,attack:0,charge:0,queuedAttack:null,bowAiming:false,blocking:false});this.sound?.('ui');}return;
    }
    if(panel==='character-station'){this.openCharacterStation(p);return;}
    if(panel==='starter-chest'){
      this.getGame().openInventory(p,'starter');
      s.inventoryRelease=true;this.state.invalidate(this.getGame().players);return;
    }
    if(panel==='environment')delete s.expeditionDraft;
    s.panel=panel;s.focus=0;this.renderPanel(p);
  }
  openCharacterStation(p){
    const s=this.state.members.get(p.id);if(!s||p.ui)return;
    const heroes=this.available(p),index=heroes.findIndex(h=>h.id===p.profileId);
    s.panel='choose';s.focus=0;s.choice=index>=0?index:0;s.characterHold=0;
    p.ready=false;this.state.countdown=null;this.renderPanel(p);this.sound?.('ui');
  }
  close(p){const s=this.state.members.get(p.id);delete s.expeditionDraft;s.panel=null;s.panelInputRelease=true;s.practiceClosing=true;this.nodes.get(p.id)?.remove();this.nodes.delete(p.id);this.panelLayoutKey=null;this.positionPanels();}
  isPlayingTelevision(device){const player=this.getGame().players.find(p=>p.device===device);return !!player&&!!this.television?.players.has(player.id);}
  openBoardReadyMenu(player){
    if(player)player.ready=false;
    this.state.countdown=null;this.boardReadyMenuOpen=true;
    if(!this.boardReadyNode)this.renderBoardReadyMenu();
    this.syncBoardReadyMenu();
  }
  closeBoardReadyMenu(){
    // Closing ready/back owns this press until release, just like player panels.
    for(const s of this.state.members.values())s.practiceClosing=true;
    this.boardReadyMenuOpen=false;this.state.countdown=null;
    this.boardReadyNode?.remove();this.boardReadyNode=null;
    this.sync();
  }
  toggleBoardPlayerReady(player){
    if(!this.boardReadyMenuOpen||!player||!player.profileId||player.lobbyDisconnected)return;
    player.ready=!player.ready;this.sound?.(player.ready?'ready':'ui');
    this.syncBoardReadyMenu();
    const players=this.getGame().players;
    if(players.length&&players.every(p=>p.ready&&p.profileId&&this.state.members.get(p.id)?.spawned&&!p.lobbyDisconnected))this.closeBoardReadyMenu();
  }
  renderBoardReadyMenu(){
    this.boardReadyNode?.remove();this.boardReadyNode=null;
    const game=this.getGame(),panel=document.createElement('section');
    panel.className='lobby-player-panel board-menu board-ready-menu';
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Shared board setup and ready check');
    const heading=document.createElement('h2');heading.textContent='Ready to begin?';panel.append(heading);
    const levelSelect=document.getElementById('environment'),difficultySelect=document.getElementById('difficulty'),modeSelect=document.getElementById('map-mode'),diceSelect=document.getElementById('dice-count');
    const settings=document.createElement('div');settings.className='board-ready-settings';
    const addSetting=(kind,label,value,detail,drawIcon)=>{
      const card=document.createElement('div');card.className='board-ready-setting board-ready-'+kind;
      const icon=document.createElement('canvas');icon.width=icon.height=56;icon.className='board-ready-setting-icon';
      drawIcon?.(icon.getContext('2d'));
      const copy=document.createElement('span');copy.className='board-ready-setting-copy';
      const eyebrow=document.createElement('small');eyebrow.textContent=label;
      const name=document.createElement('strong');name.textContent=value;
      const description=document.createElement('span');description.textContent=detail;
      copy.append(eyebrow,name,description);card.append(icon,copy);settings.append(card);
    };
    const difficulty=difficultySelect?.value||game.difficulty||'adventure';
    addSetting('difficulty','DIFFICULTY',difficultySelect?.selectedOptions?.[0]?.text||'Adventure',DIFFICULTY_DETAILS[difficulty]||DIFFICULTY_DETAILS.adventure,c=>this.drawDifficulty(c,difficulty,0,0,56));
    const wildbound=!!game.houseWorldsEnabled,level=wildbound?'Wildbound worlds':levelSelect?.selectedOptions?.[0]?.text||'Forest';
    const levelKey=wildbound?'house':levelSelect?.value||'forest';
    addSetting('level','LEVEL',level,wildbound?'Travel from home to nine worlds.':MAP_DETAILS[levelKey]||'Explore this destination.',c=>this.drawMapIcon(c,levelKey,0,0,56));
    const badges=document.createElement('div');badges.className='board-ready-badges';
    for(const [label,value,cls] of [
      ['MAP MODE',modeSelect?.value==='boundless'?'Boundless':'Bounded','map-mode'],
      ['DICE',diceSelect?.selectedOptions?.[0]?.text||'Two dice','dice-count'],
    ]){const badge=document.createElement('span');badge.className='board-ready-badge '+cls;badge.append(document.createElement('small'),document.createElement('strong'));badge.firstChild.textContent=label;badge.lastChild.textContent=value;badges.append(badge);}
    panel.append(settings,badges);
    const roster=document.createElement('div');roster.className='board-ready-roster';roster.setAttribute('aria-live','polite');panel.append(roster);
    const actions=document.createElement('div');actions.className='board-ready-actions';
    const keyboard=game.players.find(p=>p.device==='keyboard'),pad=game.players.find(p=>p.device?.startsWith('pad:'));
    const family=pad?.controllerFamily==='switch'?'switch':'xbox';
    const keyHint=(direction,label)=>{
      const hint=document.createDocumentFragment();
      if(keyboard){const key=document.createElement('span');key.className='board-ready-keyboard-key';key.textContent=label;hint.append(key);}
      if(pad||!keyboard){if(keyboard)hint.append(document.createTextNode(' / '));hint.append(controllerGlyph(document.createElement('canvas'),family,'face',direction));}
      return hint;
    };
    const ready=panel.ownerDocument.createElement('button');
    ready.className='board-ready-confirm';ready.onclick=()=>this.toggleBoardPlayerReady(keyboard||game.players.find(p=>!p.ready)||game.players[0]);
    ready.append(keyHint('down','Enter'),document.createTextNode(' · '));const readyText=document.createElement('span');readyText.className='board-ready-action-label';ready.append(readyText);
    const back=panel.ownerDocument.createElement('button');back.className='board-ready-back';back.onclick=()=>this.closeBoardReadyMenu();
    back.append(keyHint('right','Esc'),document.createTextNode(' · '));const backText=document.createElement('span');backText.className='board-ready-action-label';back.append(backText);
    actions.append(ready,back);panel.append(actions);
    const help=document.createElement('p');help.className='board-ready-help';
    const readyCount=document.createElement('span');readyCount.className='board-ready-count';help.append(readyCount);
    if(keyboard)help.append('Enter to ready · Esc to back out. ');
    if(pad||!keyboard)help.append('Controllers: ',controllerGlyph(document.createElement('canvas'),family,'face','down'),' ready · ',controllerGlyph(document.createElement('canvas'),family,'face','right'),' back out.');
    panel.append(help);
    this.boardReadyNode=panel;this.panels.append(panel);
    const dismissInvalidIcons=()=>{if(this.boardReadyMenuOpen&&this.boardReadyNode===panel)this.renderBoardReadyMenu();};
    if(!this.difficultyArt.complete)this.difficultyArt.addEventListener('load',dismissInvalidIcons,{once:true});
    if(!this.mapArt.complete)this.mapArt.addEventListener('load',dismissInvalidIcons,{once:true});
  }
  syncBoardReadyMenu(){
    const panel=this.boardReadyNode;if(!panel)return;
    const game=this.getGame(),roster=panel.querySelector('.board-ready-roster');
    roster.replaceChildren();
    for(const [i,p] of game.players.entries()){
      const row=document.createElement('div');row.className='board-ready-player';row.classList.toggle('is-ready',!!p.ready);row.style.setProperty('--player-color',p.color||'#8fcdb3');
      const marker=document.createElement('i');marker.setAttribute('aria-hidden','true');
      const copy=document.createElement('span'),name=document.createElement('strong'),device=document.createElement('small');
      name.textContent=p.name||'Player '+(i+1);device.textContent=p.device==='keyboard'?'Keyboard':`Player ${i+1} controller`;
      copy.append(name,device);const status=document.createElement('b');status.textContent=p.ready?'READY':'WAITING';row.append(marker,copy,status);roster.append(row);
    }
    const keyboard=game.players.find(p=>p.device==='keyboard'),ready=panel.querySelector('.board-ready-confirm');
    ready.setAttribute('aria-label',`${keyboard?'Enter':'Bottom face button'}${keyboard&&pad?' or bottom face button':''} · ${keyboard?.ready?'Cancel ready':'Confirm ready'}`);
    ready.querySelector('.board-ready-action-label').textContent=keyboard?.ready?'Cancel ready':'Confirm ready';
    ready.disabled=!game.players.some(p=>p.profileId&&!p.lobbyDisconnected);
    const back=panel.querySelector('.board-ready-back');
    back.setAttribute('aria-label',`${keyboard?'Escape':'Right face button'}${keyboard&&pad?' or right face button':''} · Back to lobby`);
    back.querySelector('.board-ready-action-label').textContent='Back to lobby';
    const help=panel.querySelector('.board-ready-help');
    help.querySelector('.board-ready-count').textContent=game.players.length?`${game.players.filter(p=>p.ready).length} of ${game.players.length} players ready · `:'Join with a controller or press Enter. ';
  }
  setWildboundMode(enabled){
    const g=this.getGame();g.houseWorldsEnabled=enabled;localStorage.setItem('wildbound-mode',enabled?'on':'off');
    if(enabled){const mode=document.getElementById('map-mode');mode.value='bounded';mode.dispatchEvent(new Event('change'));}
    this.state.invalidate(g.players);
  }
  refreshMapMenus(){for(const p of this.getGame().players)if(this.state.members.get(p.id)?.panel==='environment')this.renderPanel(p);}
  available(p){return this.profiles.data.heroes.filter(h=>!this.getGame().players.some(q=>q!==p&&q.profileId===h.id));}
  renderPanel(p){
    const s=this.state.members.get(p.id),previousPanel=this.nodes.get(p.id);
    const panel=document.createElement('section');panel.className='lobby-player-panel';panel.classList.toggle('board-menu',s.panel==='board');panel.classList.toggle('character-select',s.panel==='choose');panel.classList.toggle('delete-confirmation',s.panel==='confirm-delete');panel.dataset.ownerDevice=p.device;panel.style.setProperty('--player-color',p.color);panel.setAttribute('aria-label',p.name+' lobby controls');
    panel.classList.toggle('map-menu',s.panel==='environment');
    const tag=document.createElement('small');tag.textContent='PLAYER '+(this.getGame().players.indexOf(p)+1);panel.append(tag);
    const heading=document.createElement('h2');panel.append(heading);
    const button=(label,fn,parent=panel)=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{fn();this.sync();};parent.append(b);return b;};
    const error=document.createElement('p');error.className='lobby-error';error.setAttribute('role','alert');
    if(s.panel==='choose'){
      heading.textContent='Choose your explorer';
      const heroes=this.available(p);s.choice=((s.choice%Math.max(1,heroes.length))+heroes.length)%Math.max(1,heroes.length);
      const h=heroes[s.choice];
      panel.classList.toggle('empty-chooser',!h);
      const stage=document.createElement('div');stage.className='lobby-character-stage';
      const preview=document.createElement('canvas');preview.width=260;preview.height=208;stage.append(preview);panel.append(stage);
      panel._idlePreview={canvas:preview,hero:h||blankExplorerPreview()};this.paintIdlePreview(panel,this.practice.time);
      const choice=h?button('‹  '+h.name+'  ›',()=>{s.choice++;this.renderPanel(p);}):null;if(choice)choice.dataset.cycle='character';
      if(h){const level=document.createElement('span');level.className='lobby-level';level.textContent='LEVEL '+(h.level||1);choice.append(level);}
      if(h)button('Choose',()=>{
        if(!this.available(p).some(q=>q.id===h.id)){this.renderPanel(p);return;}
        this.profiles.assign(p,h);s.spawned=true;this.state.invalidate(this.getGame().players);this.close(p);this.refreshChoosers();
      });
      if(h)button('Delete',()=>{s.panel='confirm-delete';s.deleteHeroId=h.id;s.focus=0;this.renderPanel(p);});
      button('+ New character',()=>{s.panel='create';s.focus=0;this.renderPanel(p);}).classList.add('choice-new');
      button('Close',()=>this.close(p)).classList.add('choice-close');
      if(h)button('Drop from game',()=>{const g=this.getGame();g.players=g.players.filter(q=>q.id!==p.id);this.state.members.delete(p.id);panel.remove();this.nodes.delete(p.id);this.state.invalidate(g.players);this.refreshChoosers();});
    }else if(s.panel==='confirm-delete'){
      const hero=this.profiles.data.heroes.find(h=>h.id===s.deleteHeroId);
      if(!hero||!this.available(p).some(h=>h.id===hero.id)){s.panel='choose';s.focus=0;this.renderPanel(p);return;}
      heading.textContent='Delete '+hero.name+'?';
      const warning=document.createElement('p');warning.textContent='This permanently removes the character, their gear and personal storage. Shared storage stays.';panel.append(warning);
      button('Cancel',()=>{s.panel='choose';s.focus=0;this.renderPanel(p);});
      const confirm=button('Delete character',async()=>{
        if(s.deletePending)return;s.deletePending=true;
        for(const b of panel.querySelectorAll('button'))b.disabled=true;
        try{
          if(!this.available(p).some(h=>h.id===hero.id))throw Error('Another player is using this character.');
          await this.profiles.remove(hero.id);
          if(p.profileId===hero.id){this.profiles.assign(p,freshCharacter(null,'Scout'));s.spawned=false;}
          this.state.invalidate(this.getGame().players);s.panel='choose';s.choice=0;s.focus=0;this.renderPanel(p);this.refreshChoosers();
        }catch(e){error.textContent=e.message;for(const b of panel.querySelectorAll('button'))b.disabled=false;s.focus=0;this.highlight(p);}
        finally{s.deletePending=false;}
      });confirm.classList.add('danger');
    }else if(s.panel==='create'){
      heading.textContent='New explorer';
      buildCreationMenu({panel,state:s,profiles:this.profiles,presets:LOOK_PRESETS,player:p,
        onCreate:(name,look)=>{this.profiles.assign(p,this.profiles.create(name,look));s.creationName=null;s.spawned=true;this.state.invalidate(this.getGame().players);this.close(p);this.refreshChoosers();},
        onBack:()=>{s.panel='choose';s.focus=0;this.renderPanel(p);}});
    }else if(s.panel==='board'){
      heading.textContent='Ready to begin?';
      const info=document.createElement('div');info.className='board-menu-summary';
    for(const id of ['map-mode','environment','difficulty','dice-count']){const e=document.getElementById(id),setting=document.createElement('span');setting.className='board-setting';setting.textContent=id==='environment'&&this.getGame().houseWorldsEnabled?'Wildbound · Home and nine worlds':e.selectedOptions[0].text;info.append(setting);}
      panel.append(info);
      button(p.ready?'Cancel readiness':'Ready',()=>{p.ready=!p.ready;this.close(p);});
      button('Not yet',()=>this.close(p));
    }else if(s.panel==='environment'){
      buildExpeditionMenu({panel,member:s,game:this.getGame(),select:document.getElementById('environment'),mode:document.getElementById('map-mode'),details:MAP_DETAILS,tooltip:b=>this.mapTooltip(panel,b),drawIcon:(...args)=>this.drawMapIcon(...args),highlight:()=>{if(panel.isConnected)this.highlight(p);},close:()=>this.close(p),accept:draft=>{
        this.setWildboundMode(draft.wild);
        const env=document.getElementById('environment'),mode=document.getElementById('map-mode');env.value=draft.map;mode.value=draft.boundless&&!draft.wild?'boundless':'bounded';
        for(const input of [env,mode])input.dispatchEvent(new Event('change'));
        this.close(p);this.refreshMapMenus();this.sync();
      }});
    }else{
      const o=LOBBY_OBJECTS.find(o=>o.id===s.panel);heading.textContent=o.name;
      const select=document.getElementById(s.panel);
      let mapChoices;
      if(s.panel==='environment'){
        const mode=document.getElementById('map-mode');
        const wild=!!this.getGame().houseWorldsEnabled,wildChoice=button('',()=>{this.setWildboundMode(true);this.refreshMapMenus();});
        wildChoice.classList.add('map-choice','wildbound-mode-choice');wildChoice.setAttribute('aria-pressed',String(wild));
        wildChoice.setAttribute('aria-label','Wildbound mode. Start at home and travel between worlds on a five or eight.');
        const wildIcon=document.createElement('canvas');wildIcon.width=wildIcon.height=40;wildIcon.className='map-choice-icon';this.drawMapIcon(wildIcon.getContext('2d'),'house',0,0,40);
        const wildCopy=document.createElement('span');wildCopy.className='difficulty-choice-copy';
        const wildName=document.createElement('strong');wildName.textContent=(wild?'✓ ':'')+'Wildbound mode';
        const wildHint=document.createElement('small');wildHint.textContent='Begin at home. Roll 5 or 8 to enter another world — then roll 5 or 8 to return.';
        wildCopy.append(wildName,wildHint);wildChoice.append(wildIcon,wildCopy);
        if(!['bounded','boundless'].includes(mode.value))mode.value='bounded';
        const enabled=mode.value==='boundless',toggle=button('',()=>{
          this.setWildboundMode(false);
          mode.value=mode.value==='boundless'?'bounded':'boundless';mode.dispatchEvent(new Event('change'));this.refreshMapMenus();
        });toggle.classList.add('map-mode-toggle');toggle.setAttribute('aria-pressed',String(enabled));
        const name=document.createElement('strong');name.textContent='Boundless';
        const hint=document.createElement('small');hint.textContent=enabled?'Explore beyond the board into streamed regions.':'Bounded expedition · clear edges and a finale.';
        const mark=document.createElement('i');mark.setAttribute('aria-hidden','true');
        toggle.append(name,mark,hint);toggle.setAttribute('role','switch');toggle.setAttribute('aria-checked',String(enabled));toggle.setAttribute('aria-label','Boundless '+(enabled?'on':'off'));toggle.title=MAP_MODE_DETAILS[mode.value];
        mapChoices=document.createElement('div');mapChoices.className='map-choices';panel.append(mapChoices);
      }
      for(const option of select.options){const b=button('',()=>{
        if(s.panel==='environment')this.setWildboundMode(false);
        select.value=option.value;select.dispatchEvent(new Event('change'));
        if(select.id==='environment')this.refreshMapMenus();else this.close(p);
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
        b.classList.toggle('map-choice-all',option.value==='random');
        b.setAttribute('aria-pressed',String(!this.getGame().houseWorldsEnabled&&select.value===option.value));
        b.title=MAP_DETAILS[option.value];
        if(option.value==='random')panel.insertBefore(b,mapChoices);else mapChoices.append(b);
        b.setAttribute('aria-label',`${option.text}. ${MAP_DETAILS[option.value]}`);
        const icon=document.createElement('canvas');icon.width=64;icon.height=64;icon.className='map-choice-icon';this.drawMapIcon(icon.getContext('2d'),option.value,0,0,64);
        const copy=document.createElement('span');copy.className='difficulty-choice-copy';
        const name=document.createElement('strong');name.textContent=(!this.getGame().houseWorldsEnabled&&select.value===option.value?'✓ ':'')+option.text;
        const detail=document.createElement('small');detail.textContent=MAP_DETAILS[option.value];
        copy.append(name,detail);b.append(icon,copy);
        b.dataset.mapDetail=MAP_DETAILS[option.value];b.removeAttribute('title');
        b.addEventListener('pointerenter',()=>this.mapTooltip(panel,b));
        b.addEventListener('pointerleave',()=>this.mapTooltip(panel,null));
        b.addEventListener('focus',()=>this.mapTooltip(panel,b));
      }else b.textContent=(select.value===option.value?'✓ ':'')+option.text;}
      button('Close',()=>this.close(p)).classList.toggle('map-menu-close',s.panel==='environment');
    }
    panel.append(error);
    if(previousPanel?.isConnected)previousPanel.replaceWith(panel);
    else this.panels.append(panel);
    this.nodes.set(p.id,panel);this.panelLayoutKey=null;this.positionPanels();this.highlight(p);
  }
  refreshChoosers(){for(const p of this.getGame().players)if(this.state.members.get(p.id)?.panel==='choose')this.renderPanel(p);}
  mapTooltip(panel,button){
    let tip=panel.querySelector('.map-choice-tooltip');
    if(!button?.dataset.mapDetail){if(tip?.matches(':popover-open'))tip.hidePopover();return;}
    if(!tip){tip=document.createElement('div');tip.className='map-choice-tooltip';tip.setAttribute('popover','manual');tip.setAttribute('role','tooltip');tip.id='map-tooltip-'+panel.dataset.ownerDevice;panel.append(tip);}
    tip.textContent=button.dataset.mapDetail;button.setAttribute('aria-describedby',tip.id);
    if(!tip.matches(':popover-open'))tip.showPopover();
    const r=button.getBoundingClientRect(),box=tip.getBoundingClientRect();
    tip.style.left=Math.max(8,Math.min(innerWidth-box.width-8,r.left))+'px';
    tip.style.top=Math.max(8,r.bottom+box.height+8<innerHeight?r.bottom+6:r.top-box.height-6)+'px';
  }
  highlight(p){
    const s=this.state.members.get(p.id),panel=this.nodes.get(p.id),buttons=[...panel?.querySelectorAll('button')||[]];
    s.focus=Math.max(0,Math.min(s.focus,buttons.length-1));buttons.forEach((b,i)=>b.classList.toggle('lobby-focus',i===s.focus));
    // Reveal the owner's current choice without scrolling or moving another
    // player's panel. Native scrollbar chrome is hidden throughout the UI.
    const selected=buttons[s.focus];
    if(s.panel==='environment')this.mapTooltip(panel,selected);
    const scroller=selected?.closest('.map-choices')||panel;
    if(selected&&scroller.scrollHeight>scroller.clientHeight){
      const box=scroller.getBoundingClientRect(),choice=selected.getBoundingClientRect();
      const scale=scroller.offsetHeight?box.height/scroller.offsetHeight:1;
      const top=box.top+(scroller.clientTop+4)*scale,bottom=box.top+(scroller.clientTop+scroller.clientHeight-4)*scale;
      if(choice.bottom>bottom)scroller.scrollTop+=(choice.bottom-bottom)/scale;
      else if(choice.top<top)scroller.scrollTop-=(top-choice.top)/scale;
    }
  }
  navigate(p,{x=0,y=0,accept=false,back=false,adjust=false,rotate=0},device=p.device){
    const s=this.state.members.get(p.id),panel=this.nodes.get(p.id);if(!panel)return;
    if(device!==p.device||panel.dataset.ownerDevice!==device)return;
    if(panel.expeditionNavigate){panel.expeditionNavigate({x,y,accept,back});return;}
    if(panel.creationNavigate){panel.creationNavigate({x,y,accept,back,adjust,rotate});return;}
    if(back){if(s.panel==='confirm-delete'||s.panel==='create'){s.panel='choose';s.focus=0;this.renderPanel(p);}else this.close(p);return;}
    const buttons=[...panel.querySelectorAll('button')];
    if(x&&s.panel==='choose'&&buttons[s.focus]?.dataset.cycle){s.choice+=x;this.renderPanel(p);return;}
    if(x||y){
      if(s.panel==='environment'){
        const next=spatialMenuNeighbor(buttons,buttons[s.focus],x,y);
        s.focus=Math.max(0,buttons.indexOf(next));
      }else s.focus=(s.focus+(y||x)+buttons.length)%buttons.length;
      this.highlight(p);
    }
    if(accept)buttons[s.focus]?.click();
  }
  key(e){
    const owner=e.target.closest?.('[data-owner-device]')?.dataset.ownerDevice;
    if(owner&&owner!=='keyboard'){e.preventDefault();return true;}
    const p=this.getGame().players.find(p=>p.device==='keyboard');if(!p)return false;
    const s=this.state.members.get(p.id);if(!s)return false;
    if(this.boardReadyMenuOpen){
      if(e.key==='Enter'){e.preventDefault();this.toggleBoardPlayerReady(p);}
      else if(e.key==='Escape'){e.preventDefault();this.closeBoardReadyMenu();}
      else e.preventDefault();
      return true;
    }
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
    if(e.key==='Enter'){e.preventDefault();if(!s.spawned){s.panel='choose';s.focus=0;this.renderPanel(p);}return true;}
    if(e.key==='Escape'){e.preventDefault();p.ready=false;this.state.countdown=null;return true;}
    return false;
  }
  controller(pad,previous){
    const p=this.getGame().players.find(p=>p.device==='pad:'+pad.index);if(!p)return;
    const s=this.state.members.get(p.id);if(!s)return;
    if(this.boardReadyMenuOpen){
      if(pad.buttons[0]?.pressed&&!previous[0])this.toggleBoardPlayerReady(p);
      else if(pad.buttons[1]?.pressed&&!previous[1])this.closeBoardReadyMenu();
      return;
    }
    if(!s.panel&&!s.spawned&&pad.buttons[0]?.pressed&&!previous[0]){s.panel='choose';s.focus=0;this.renderPanel(p);return;}
    this.nodes.get(p.id)?.updateControllerFamily?.(controllerFamily(pad));
    if(s.panel)s.held.lobbyInteract=!!pad.buttons[3]?.pressed;
    const x=Math.abs(pad.axes[0]||0)>.6?Math.sign(pad.axes[0]):0,y=Math.abs(pad.axes[1]||0)>.6?Math.sign(pad.axes[1]):0;
    const repeat=s.panel==='create'&&performance.now()>(s.nextCreationMove||0);
    const dx=pad.buttons[14]?.pressed?-1:pad.buttons[15]?.pressed?1:x,dy=pad.buttons[12]?.pressed?-1:pad.buttons[13]?.pressed?1:y;
    if(s.panel==='create'){
      if(dx||dy){if(repeat||dx!==s.creationDX||dy!==s.creationDY){this.navigate(p,{x:dx,y:dy});s.nextCreationMove=performance.now()+(dx!==s.creationDX||dy!==s.creationDY?300:65);}}
      this.navigate(p,{accept:pad.buttons[0]?.pressed&&!previous[0],back:pad.buttons[1]?.pressed&&!previous[1],adjust:pad.buttons[2]?.pressed&&!previous[2],rotate:pad.buttons[4]?.pressed&&!previous[4]?-1:pad.buttons[5]?.pressed&&!previous[5]?1:0});
      s.creationDX=dx;s.creationDY=dy;
    }else if(s.panel)this.navigate(p,{x:pad.buttons[14]?.pressed&&!previous[14]?-1:pad.buttons[15]?.pressed&&!previous[15]?1:x!==s.axisX?x:0,y:pad.buttons[12]?.pressed&&!previous[12]?-1:pad.buttons[13]?.pressed&&!previous[13]?1:y!==s.axisY?y:0,accept:pad.buttons[0]?.pressed&&!previous[0],back:pad.buttons[1]?.pressed&&!previous[1]});
    s.axisX=x;s.axisY=y;
  }
  update(dt,inputs,blocked=false){
    this.sync();blocked=blocked||this.boardReadyMenuOpen;const players=this.getGame().players;
    if(this.tvWildbound){
      const game=this.getGame();
      // Runtime link is deliberately non-enumerable: never save the TV simulation.
      if(game.tvWorld!==this.tvWildbound)Object.defineProperty(game,'tvWorld',{value:this.tvWildbound,writable:true,configurable:true});
      const commands={};
      for(const [id] of this.tvWildbound.players){
        const hero=players.find(p=>p.id===id);if(!hero)continue;
        const s=this.state.members.get(id),input=playerInput(players,hero,inputs),edge=key=>!!input[key]&&!s.held[key];
        if(!blocked&&!hero.lobbyDisconnected){
          if(edge('inventory')){if(hero.ui)hero.ui=null;else game.openInventory(hero);s.inventoryRelease=true;}
          if(hero.ui){
            for(const action of ['next','prev','up','down','panel','use','offhand','sockets','store','pick','close','drop','dropOne'])if(edge(action))game.inventoryAction(hero,action);
            const direction=['next','prev','up','down'].find(key=>input[key]);s.menuRepeat=direction?(s.menuRepeat||0)+dt:0;
            if(direction&&s.menuRepeat>.35){game.inventoryAction(hero,direction);s.menuRepeat=.24;}
            s.inventoryRelease=true;
          }
          tickSalvage(game,hero,!!hero.ui&&(!!input.salvage||!!hero.ui.salvagePointer),dt);
        }
        if(!hero.ui&&!['inventory','use','close','interact','lobbyInteract','attack','tvA','tvX','block','salvage'].some(key=>input[key]))s.inventoryRelease=false;
        // TV jump and attack are distinct. The normal game's bottom-face attack
        // binding must not leak into the TV's bottom-face jump binding.
        commands[id]={left:!!input.tvLeft,right:!!input.tvRight,jump:!!input.tvA,dash:!!input.dodge,attack:!!input.tvX||(hero.device==='keyboard'&&!!input.attack),run:!!input.block,loot:!!input.interact,paused:blocked||!!hero.ui||!!s.inventoryRelease||!!hero.lobbyDisconnected};
        if(!blocked&&!hero.lobbyDisconnected&&this.tvWildbound.won&&!hero.ui&&!s.inventoryRelease&&(edge('lobbyInteract')||edge('interact'))){
          if(this.tvWildbound.victoryRewards.some(Boolean))game.openInventory(hero,'tv-victory');
          else {this.returnFromTv();return;}
        }
        s.held={...input};
      }
      if(this.tvWildbound.requestLobbyReturn&&!this.tvWildbound.victoryRewards.some(Boolean)){this.returnFromTv();return;}
      if(!blocked)this.tvWildbound.step(dt,commands);
      this.draw();return;
    }
    if(!blocked){
      // The TV minigame owns directional input while a hero is playing. Keep
      // their mapped lobby portal/bait actions from firing through the shared
      // storage simulation while still letting TV-specific controls through.
      const storageInputs={...inputs};
      for(const p of players)if(this.television?.players.has(p.id)){
        storageInputs[p.device]={...(inputs[p.device]||{}),portal:false,bait:false};
      }
      tickLobbyStorage(this.getGame(),this.practice,this.state,storageInputs,dt);
    }
    const joinedTv=new Set();
    for(const p of players){
      const s=this.state.members.get(p.id),input=playerInput(players,p,inputs);
      const hadUI=!!p.ui;
      if(this.television?.players.has(p.id)&&(Math.hypot(input.walkX||0,input.walkY||0)>.15||s.panel||blocked||!s.spawned||p.lobbyDisconnected||Math.hypot(s.x-785,s.y-165)>103||p.ui))this.television.leave(p.id,s);
      if(!blocked&&s.spawned&&!s.panel&&!p.lobbyDisconnected){
        const game=this.getGame(),edge=key=>input[key]&&!s.held[key];
        if(p.ui)s.inventoryRelease=true;
        if(edge('inventory')){if(p.ui){p.ui=null;s.practiceClosing=true;}else{game.openInventory(p);this.state.invalidate(players);}}
        if(p.ui){
          s.inventoryRelease=true;
          if(!s.storageUiOpened)for(const action of ['next','prev','up','down','panel','use','offhand','sockets','store','pick','close'])if(edge(action))game.inventoryAction(p,action);
          const direction=['next','prev','up','down'].find(key=>input[key]);
          s.menuRepeat=direction?(s.menuRepeat||0)+dt:0;
          if(direction&&s.menuRepeat>.35){game.inventoryAction(p,direction);s.menuRepeat=.24;}
        }else if(!p.room&&!s.inventoryRelease){
          const o=this.state.nearest(p,this.television?.controllers);
          if(o?.id==='character-station'&&edge('lobbyInteract'))this.openCharacterStation(p);
          if(this.television?.players.has(p.id)){
            if(edge('interact'))this.television.leave(p.id,s);
          }else if(o?.id==='television'){
            if(edge('lobbyInteract')&&!input.jump&&!input.tvA){this.open(p,'television');if(this.television.players.has(p.id))joinedTv.add(p.id);}
          }
          else if(edge('lobbyInteract')&&o?.id!=='character-station'){
            if(o?.id==='target-lever'){this.practice.toggleTargets();this.sound?.('ui');}
            else if(o)this.open(p,o.id);
          }
          if(o&&input.lobbyInteract)s.stationPress=true;
          if(!input.lobbyInteract)s.stationPress=false;
        }
      }else s.moving=false;
      if(hadUI&&!p.ui)s.practiceClosing=true;
      p.salvageFinish=Math.max(0,(p.salvageFinish||0)-dt);
      tickSalvage(this.getGame(),p,!blocked&&s.spawned&&!s.panel&&!p.lobbyDisconnected&&!!p.ui&&(!!input.salvage||!!p.ui.salvagePointer),dt);
      if(!p.ui&&!['inventory','use','close','interact','lobbyInteract','attack','jump','dodge','block','trap','potion','bait','offhand','panel','portal'].some(key=>input[key]))s.inventoryRelease=false;
      s.held={...input};
      delete s.storageUiOpened;
    }
    const practiceInputs={...inputs},tvCommands={};
    // A lobby panel owns controller input. Without this guard, the same
    // button used to select/back out of a panel could also make the explorer
    // jump in the practice scene underneath it.
    for(const p of players){
      const s=this.state.members.get(p.id);
      if(s?.panel||this.boardReadyMenuOpen)s.panelInputRelease=true;
      const input=inputs[p.device]||{};
      if(s?.panelInputRelease&&!s.panel&&!['jump','tvA','attack','dodge','close','use','lobbyInteract','interact','block'].some(key=>input[key]))s.panelInputRelease=false;
      practiceInputs[p.device]=lobbyPracticeInput(s,input,this.boardReadyMenuOpen||!!s.panel||!!p.ui);
    }
    for(const p of players){const s=this.state.members.get(p.id);if(s?.stationPress&&!s.panel&&!p.ui)practiceInputs[p.device]={...practiceInputs[p.device],attack:false};}
    for(const p of players)if(this.television?.players.has(p.id)){
      const input=inputs[p.device]||{};
      tvCommands[p.id]={left:!!input.tvLeft,right:!!input.tvRight,jump:!!input.tvA&&!joinedTv.has(p.id),joinHeld:joinedTv.has(p.id),run:!!input.tvX,dash:!!input.dodge,down:!!input.tvDown,up:!!input.tvUp};
      practiceInputs[p.device]={x:input.walkX||0,y:input.walkY||0};
    }
    this.practice.stepPractice(dt,players,this.state.members,practiceInputs,blocked);
    // The real hero owns the inventory hold while the practice actor is paused
    // behind the inventory UI. Mirror salvage timing so its world sprite can
    // play the same hand/tool animation during the hold and brief finish burst.
    for(const p of players){
      const actor=this.practice.players?.find(a=>a.id===p.id);if(!actor)continue;
      actor.salvageHold=p.salvageHold&&!p.salvageHold.latched
        ?{elapsed:p.salvageHold.elapsed||0,latched:false}
        :undefined;
      actor.salvageFinish=p.salvageFinish||0;
    }
    for(const p of players)if(this.television?.players.has(p.id)){
      const s=this.state.members.get(p.id);if(Math.hypot(s.x-785,s.y-165)>103)this.television.leave(p.id,s);
    }
    if(!blocked)this.television?.step(dt,tvCommands);
    if(this.television?.completed){
      const party=players.filter(p=>this.television.players.has(p.id));
      restockStarterChests(this.getGame());
      // Keep each trip reproducible, but don't replay the same scene order on
      // every visit to the TV. The TV seed stays the base for this lobby.
      this.tvWorldRun=(this.tvWorldRun||0)+1;
      const worldSeed=(this.television.seed+Math.imul(this.tvWorldRun,0x9e3779b9))>>>0;
      this.tvWildbound=new TvWildbound(party,worldSeed);
      this.tvWildbound.onLoot=()=>this.getGame().persist();
      this.panels?.replaceChildren();
      const help=this.root?.querySelector('.party-help');if(help)help.textContent='TV WORLD · D-pad / arrows: move · bottom face / Z: double jump · R / Dodge / Space / RMB: directional dash (cooldown) · Down: crouch / marked pipes enter coin room · left face / F or X: attack / flower fireball · I / Back: inventory · E / top face: collect items; after 48 spaces interact at center to call WILDBOUND (far gate is optional) · strike the board to roll';
    }
    this.petHudClock=(this.petHudClock||0)+dt;
    if(this.petHudClock>.25&&this.area&&typeof document!=='undefined'){
      this.petHudClock=0;let hud=this.area.querySelector('.lobby-pets');
      if(!hud){hud=document.createElement('div');hud.className='lobby-pets';this.area.append(hud);}
      if(!hud.contains(document.activeElement)){hud.replaceChildren();for(const a of this.practice.players){const card=petCard(this.practice,a);if(card){const owner=document.createElement('small');owner.textContent=a.name+"’s companion";card.prepend(owner);hud.append(card);}}}
    }
    if(!this.tvWildbound&&!blocked&&this.state.tick(dt,players))this.start();
    this.draw();
    this.area.querySelector('.lobby-countdown').textContent=this.state.countdown!==null?`The board opens in ${Math.max(1,Math.ceil(this.state.countdown))}…`:'';
  }
  drawPracticeGround(c){
    c.save();
    for(const t of this.practice.traps){c.strokeStyle='#dbbd76';c.lineWidth=3;c.beginPath();c.ellipse(t.x,t.y,15,8,0,0,Math.PI*2);c.stroke();}
    for(const b of this.practice.baits){c.fillStyle='#dc9880';c.fillRect(b.x-4,b.y-3,8,6);}
    for(const a of this.practice.loot){if(a.embedded&&ARROW_TYPES.includes(a.type))drawEmbeddedArrow(c,a,this.practice.time,this.showLootDetails?.());else{drawItem(c,a.type,a.x,a.y-(a.z||0),26);if(a.qty>1){c.fillStyle='#fff2c4';c.font='bold 10px system-ui';c.textAlign='right';c.fillText(String(a.qty),a.x+14,a.y+13);}}}
    c.restore();
  }
  drawPractice(c){
    for(const b of this.practice.boomerangs||[])drawBoomerang(c,b,this.practice.time);
    c.save();
    for(const a of groupLodgedArrows(this.practice.arrows)){drawArrowTrail(c,a,this.practice.time);if(a.stuck){drawEmbeddedArrow(c,a,this.practice.time,this.showLootDetails?.());continue;}c.save();c.translate(a.x,a.y-(a.z||0));c.rotate(arrowVisualAngle(a));drawFlyingArrow(c,a,this.practice.time);c.restore();}
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
    if(REALM_COLORS[value]){const image=this.realmMapArt?.[value];if(image?.complete&&image.naturalWidth){c.save();c.imageSmoothingEnabled=false;c.drawImage(image,0,0,image.naturalWidth,image.naturalHeight,x,y,size,size);c.restore();return;}image?.addEventListener('load',()=>this.drawMapIcon(c,value,x,y,size),{once:true});c.fillStyle=Object.values(REALM_COLORS[value])[0];c.fillRect(x,y,size,size);drawRealmSprite(c,{swamp:'mangrove',caverns:'cave_crystal',shadow:'wither_tree'}[value],x+size/2,y+size*.94,size*.95);return;}
    if(value==='graveyard'){
      if(this.cemeteryArt?.complete&&this.cemeteryArt.naturalWidth){c.drawImage(this.cemeteryArt,0,0,this.cemeteryArt.naturalWidth,this.cemeteryArt.naturalHeight,x,y,size,size);return;}
      // Menu icons are painted once, so repaint if the player opens the menu before loading finishes.
      this.cemeteryArt?.addEventListener('load',()=>this.drawMapIcon(c,value,x,y,size),{once:true});
      c.fillStyle='#172226';c.fillRect(x,y,size,size);c.fillStyle='#354247';c.fillRect(x+size*.1,y+size*.67,size*.8,size*.23);
      c.fillStyle='#7d9091';c.fillRect(x+size*.24,y+size*.27,size*.32,size*.44);c.fillRect(x+size*.3,y+size*.2,size*.2,size*.08);
      c.fillStyle='#344146';c.fillRect(x+size*.37,y+size*.31,size*.06,size*.28);c.fillRect(x+size*.29,y+size*.39,size*.22,size*.06);
      c.fillStyle='#bdbba0';c.fillRect(x+size*.77,y+size*.16,size*.1,size*.12);return;
    }
    if(value==='beach'){if(this.beachArt.complete&&this.beachArt.naturalWidth)c.drawImage(this.beachArt,0,0,this.beachArt.naturalWidth,this.beachArt.naturalHeight,x,y,size,size);return;}
    if(!this.mapArt.complete||!this.mapArt.naturalWidth)return;
    const index={random:0,forest:1,desert:2,ice:3,house:4,temple:5}[value]??0,w=this.mapArt.naturalWidth/6;
    c.drawImage(this.mapArt,index*w,0,w,this.mapArt.naturalHeight,x,y,size,size);
  }
  drawBackdrop(c){
    drawLobbyBackdrop(c,{warm:true,pack:false});
  }
  paintIdlePreview(panel,time){
    const view=panel._idlePreview;if(!view)return;
    const {canvas,hero}=view,c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;
    drawLobbyCastShadow(c,130,175,48,13);c.save();c.translate(130,174);c.scale(3.5,3.5);
    drawPlayer(c,{...hero,faceX:0,faceY:1,bowVisualAngle:undefined,animationAction:'idle',moving:false,playerFrame:undefined},time);c.restore();
  }
  draw(){
    for(const panel of this.nodes.values())this.paintIdlePreview(panel,this.practice.time);
    this.animator.lighting=characterLightingFrame(this.practice);
    this.root?.classList.toggle('lobby-exploring',this.getGame().players.some(p=>this.state.members.get(p.id)?.spawned));
    const c=this.canvas.getContext('2d'),{w,h,scale}=resizeGameSurface(this.canvas,c);
    if(this.tvWildbound){this.tvWildbound.draw(c,w,h,this.animator);return;}
    // Fit the room, totem card, and lower captions. Joining never crops stations.
    this.view=lobbyCamera(w*2,h*2);
    const view=this.view;this.labels=[];
    c.fillStyle='#20292d';c.fillRect(0,0,w,h);
    c.translate(w/2,h/2);c.scale(view.zoom/2,view.zoom/2);c.translate(-view.x,-view.y);
    this.drawBackdrop(c);
    drawLobbyCeilingWash(c,LOBBY_FLOOR);
    drawTracks(c,this.practice);
    drawBansheeSteps(c,this.practice,{spacing:20});drawDeathSteps(c,this.practice,{spacing:20});
    c.textAlign='center';
    for(const t of this.practice.targets){
      c.save();c.translate(t.homeX,t.homeY-18);c.rotate(t.angle);
      const travel=(t.x-t.homeX)*Math.cos(t.angle)+(t.y-t.homeY)*Math.sin(t.angle);
      c.fillStyle='#3b3832';c.fillRect(-65,-22,130,5);c.fillStyle='#96958b';c.fillRect(-61,-21,122,1);
      c.fillStyle='#74604a';c.fillRect(travel-3,-18,6,19);
      for(const [radius,color] of [[23,'#8d744a'],[20,'#dbca99'],[16,'#e5e1ca'],[12,'#36464c'],[9,'#598ea6'],[6,'#bf5948'],[3,'#e8bf52']]){c.fillStyle=t.flash>0&&radius===23?'#fff5b2':color;c.beginPath();c.arc(travel,0,radius,0,Math.PI*2);c.fill();}
      c.restore();const alpha=targetReportAlpha(t);if(alpha)this.label(t.hits+' hits · '+Math.round(t.score)+' damage',t.x+(t.angle<-1?54:0),t.y+(t.angle<-1?14:30),12,'#f4efdc',500,alpha);
    }
    this.drawPracticeGround(c);
    const actors=this.getGame().players.filter(p=>this.state.members.get(p.id)?.spawned&&!p.room).map(p=>this.practice.players.find(a=>a.id===p.id)||{...p,...this.state.members.get(p.id)});
    const scene=[...LOBBY_OBJECTS.map(o=>({depth:lobbyPropDepth(o),object:o})),...actors.map(a=>({depth:lobbyActorDepth(a,this.practice.house.furniture,LOBBY_OBJECTS),actor:a}))].sort((a,b)=>a.depth-b.depth);
    for(const entry of scene){
      if(entry.actor){
        const actor=entry.actor,slot=this.television.players.get(actor.id)?.slot;
        drawLobbyActorShadow(c,actor,this.practice.time,LOBBY_PLAYER_SIZE);
        if(slot!==undefined)drawSeatedLobbyPlayer(c,actor,slot);
        else {this.animator.draw(c,{...actor,kind:'player'},this.practice.time,LOBBY_PLAYER_SIZE);drawBowAim(c,actor,LOBBY_PLAYER_SIZE/48,this.practice.time);}
        continue;
      }
      const o=entry.object;
      if(['board','starter-chest'].includes(o.id))drawLobbyCastShadow(c,o.x,o.y+12,112,22);
      if(o.id==='environment'){
        drawLobbyMapTable(c,o,document.getElementById('environment').value);
      }else if(o.id==='difficulty'){
        drawLobbyDifficultyTotem(c,o,document.getElementById('difficulty').value);
      }else if(o.id==='dice-count'){
        drawLobbyDiceTray(c,o,document.getElementById('dice-count').value);
      }else if(o.id==='starter-chest'){
        const art=this.starterChestArt||={lid:0,last:this.practice.time},open=this.getGame().players.some(p=>p.ui?.storage==='starter');
        art.lid+=(Number(open)-art.lid)*(1-Math.exp(-10*Math.max(0,this.practice.time-art.last)));art.last=this.practice.time;
        drawStarterChest(c,o,art.lid);
      }else if(o.id==='target-lever'){
        drawLobbyTargetLever(c,o,this.practice.targetsMoving);
      }else if(o.id==='television'){
        drawLobbyTelevision(c,this.television,o);drawLobbyControllers(c,this.television,actors);
      }else if(o.id==='character-station'){
        drawLobbyExplorerStation(c,o);
      }else{
        drawLobbyBoard(c,this.practice.time);
      }
      if(lobbyObjectNearby(o,this.getGame().players,this.state.members,this.television.controllers)){
        const y=lobbyLabelY(o);this.label(o.name,o.x,y,15,'#f4efdc',650);
      }
    }
    for(const a of this.practice.players)if(a.hunterPet&&!this.getGame().players.find(p=>p.id===a.id)?.room)drawHunterPet(c,a.hunterPet,a,this.practice.time,48);
    this.drawPractice(c);
    for(const door of this.getGame().portals.filter(d=>d.lobby))drawPortal(c,door,this.practice.time,this.getGame().players.some(p=>{const s=this.state.members.get(p.id);return s?.spawned&&Math.hypot(s.x-door.x,s.y-door.y)<100;})?'STORAGE · WALK IN':'');
    for(const t of this.practice.targets)for(const f of [...t.combatText].reverse()){
      c.save();c.globalAlpha=Math.min(1,f.life/.12);c.translate(t.x,t.y-42-f.age*34-f.offset);
      const scale=1+Math.sin(Math.min(1,f.age/.12)*Math.PI)*.25;c.scale(scale,scale);
      c.font='bold 18px system-ui';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#142021';c.fillStyle=DAMAGE_COLORS[f.type]||DAMAGE_COLORS.physical;this.label(String(Math.round(f.amount)),t.x,t.y-42-f.age*34-f.offset,18,DAMAGE_COLORS[f.type]||DAMAGE_COLORS.physical,700);c.restore();
    }
    for(const p of this.getGame().players){
      const s=this.state.members.get(p.id);if(!s.spawned||p.room||s.panel||p.ui)continue;
      const o=this.state.nearest(p,this.television.controllers);if(!o)continue;
      const names=controllerButtonNames(p.controllerFamily||'generic'),interact=p.device==='keyboard'?'E':names[3];
      this.label(this.television.players.has(p.id)?'Walk away · leave':interact+' · interact',o.x,lobbyLabelY(o)-18,12,p.color,650);
    }
    applyCelShading(c);
    // Typography is drawn at display resolution after scene shading, never pixel-scaled.
    c.setTransform(scale/2,0,0,scale/2,0,0);c.textAlign='center';c.textBaseline='middle';
    for(const label of this.labels){
      const x=Math.round(w+(label.x-view.x)*view.zoom),y=Math.round(h+(label.y-view.y)*view.zoom);
      c.globalAlpha=label.alpha??1;c.font=`${label.weight||500} ${label.size}px system-ui`;c.lineWidth=3;c.strokeStyle='#10231fe8';
      c.strokeText(label.text,x,y);c.fillStyle=label.color;c.fillText(label.text,x,y);
    }
    c.globalAlpha=1;
  }
  label(text,x,y,size=14,color='#f4efdc',weight=500,alpha=1){this.labels.push({text,x,y,size,color,weight,alpha});}
}
