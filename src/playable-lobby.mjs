import {LobbyPractice,lobbyDiceOffsets} from './lobby-practice.mjs';
import { drawPlayer } from './player-motion.mjs';
import { characterNameError, suggestCharacterName } from './profiles.mjs';
import { openControllerKeyboard } from './controller-keyboard.mjs';
import { controllerButtonNames } from './controls.mjs';

export const LOBBY_OBJECTS = [
  {id:'environment',name:'Map table',x:230,y:190},
  {id:'difficulty',name:'Difficulty totem',x:800,y:190},
  {id:'dice-count',name:'Dice tray',x:800,y:440},
  {id:'board',name:'Closed board',x:510,y:280},
];
const LOOK_PRESETS = [
  { skin:'#d9ab76', shirt:'#39745b', pants:'#665b87', shoes:'#49372d', hair:'crop', hairColor:'#593923' },
  { skin:'#865437', shirt:'#d3b562', pants:'#49372d', shoes:'#272c35', hair:'curls', hairColor:'#272c35' },
  { skin:'#f2d6b3', shirt:'#46799e', pants:'#272c35', shoes:'#593923', hair:'ponytail', hairColor:'#a94955' },
  { skin:'#b97850', shirt:'#a94955', pants:'#3f5e58', shoes:'#49372d', hair:'bob', hairColor:'#d3b562' },
  { skin:'#54372c', shirt:'#d49c3d', pants:'#272c35', shoes:'#593923', hair:'long', hairColor:'#d9d4ba' },
  { skin:'#d9ab76', shirt:'#9a638c', pants:'#49372d', shoes:'#272c35', hair:'mohawk', hairColor:'#d9d4ba' },
];
const BASIC_COLORS = ['#f2d6b3','#d9ab76','#865437','#54372c','#e8c547','#d49c3d','#d45b5b','#9a638c','#46799e','#39745b','#3f5e58','#272c35'];
const LOOK_LABELS={skin:'Skin',shirt:'Shirt',pants:'Pants',shoes:'Shoes',hairColor:'Hair color'};
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
  nearest(p){const s=this.members.get(p.id);return s?.spawned?LOBBY_OBJECTS.find(o=>Math.hypot(s.x-o.x,s.y-o.y)<100):null;}
  tick(dt,players){
    const ready=players.length>0&&players.every(p=>p.ready&&p.profileId&&this.members.get(p.id)?.spawned&&!this.members.get(p.id)?.panel&&!p.lobbyDisconnected);
    if(!ready){this.countdown=null;return false;}
    if(this.started)return false;
    this.countdown=(this.countdown??3)-dt;
    if(this.countdown<=0){this.started=true;return true;}
    return false;
  }
}

export class PlayableLobby {
  constructor({root,game,profiles,start,sound}){
    Object.assign(this,{root,getGame:game,profiles,start,sound});this.state=new LobbyState();this.nodes=new Map();this.practice=new LobbyPractice();this.practice.onSound=sound;
    this.difficultyArt=new Image();this.difficultyArt.src=new URL('../assets/difficulty-icons.png',import.meta.url).href;
    this.mapArt=new Image();this.mapArt.src=new URL('../assets/map-icons.png',import.meta.url).href;
    root.classList.add('playable-lobby');
    const area=document.createElement('div');area.className='lobby-world';
    area.innerHTML='<canvas width="1024" height="620" aria-label="Playable lobby: move with WASD or left stick. E or Y interacts with nearby objects."></canvas><div class="lobby-panels"></div><div class="lobby-countdown" aria-live="polite"></div>';
    root.querySelector('#player-slots').before(area);this.area=area;this.canvas=area.querySelector('canvas');this.panels=area.querySelector('.lobby-panels');
    root.querySelector('.party-heading h1').textContent='Gather around the board';
    root.querySelector('.party-help').textContent='Enter / A: join · WASD / left stick: move · E / Y: interact · F / A: attack · J / B: jump · Space / RT: dodge · C / LT: block · Esc: cancel ready';
    this.canvas.onclick=e=>{
      const p=this.getGame().players.find(p=>p.device==='keyboard');if(!p)return;
      const r=this.canvas.getBoundingClientRect(),x=(e.clientX-r.left)*1024/r.width,y=(e.clientY-r.top)*620/r.height;
      const o=LOBBY_OBJECTS.find(o=>Math.hypot(o.x-x,o.y-y)<65);
      if(o&&this.state.nearest(p)===o)this.open(p,o.id);
    };
    for(const o of LOBBY_OBJECTS.filter(o=>o.id!=='board'))document.getElementById(o.id).addEventListener('change',()=>this.state.invalidate(this.getGame().players));
  }
  reset(){this.practice=new LobbyPractice();this.practice.onSound=this.sound;this.state=new LobbyState();this.nodes.clear();this.panels.replaceChildren();}
  sync(){
    const players=this.getGame().players;this.state.sync(players);
    for(const [id,node] of this.nodes)if(!players.some(p=>p.id===id)){node.remove();this.nodes.delete(id);}
    for(const p of players){const s=this.state.members.get(p.id);if(s.panel&&!this.nodes.has(p.id))this.renderPanel(p);}
    const count=players.filter(p=>p.ready).length;
    this.root.querySelector('#party-status').textContent=players.length?`${count} / ${players.length} ready · Walk to an object to interact`:'Press Enter or a controller button to join';
  }
  open(p,panel){const s=this.state.members.get(p.id);if(!s?.spawned)return;s.panel=panel;s.focus=0;this.renderPanel(p);}
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
      if(h){const c=preview.getContext('2d');c.imageSmoothingEnabled=false;c.translate(110,108);c.scale(2.7,2.7);drawPlayer(c,{...h,faceX:0,faceY:1,animationAction:'idle'},0);}
      button(h?'‹  '+h.name+'  ›':'No saved explorers',()=>{s.choice++;this.renderPanel(p);}).dataset.cycle='character';
      if(h)button('Choose',()=>{
        if(!this.available(p).some(q=>q.id===h.id)){this.renderPanel(p);return;}
        this.profiles.assign(p,h);s.spawned=true;this.state.invalidate(this.getGame().players);this.close(p);this.refreshChoosers();
      });
      button('+ New character',()=>{s.panel='create';s.focus=0;this.renderPanel(p);});
      button('Leave lobby',()=>{this.getGame().players=this.getGame().players.filter(q=>q!==p);this.sync();this.refreshChoosers();});
    }else if(s.panel==='create'){
      heading.textContent='New explorer';
      const input=document.createElement('input');input.maxLength=20;input.setAttribute('aria-label','Character name');input.placeholder='Character name';
      input.value=suggestCharacterName(this.profiles.data.heroes);panel.append(input);
      button('Edit name',()=>openControllerKeyboard(input));
      button('Suggest name',()=>{input.value=suggestCharacterName(this.profiles.data.heroes);});
      const look=s.creationLook||(s.creationLook=structuredClone(LOOK_PRESETS[0]));
      const custom=!!s.customLook;
      const rememberColor=(color)=>{s.recentColors=[color,...s.recentColors.filter((v)=>v!==color)].slice(0,4);};
      const chooseColor=(color)=>{look[s.creationColorKey]=color;rememberColor(color);this.renderPanel(p);};
      button('Random look',()=>{Object.assign(look,LOOK_PRESETS[Math.floor(Math.random()*LOOK_PRESETS.length)]);preview();});
      button(custom?'Hide custom options':'Custom look · colors',()=>{s.customLook=!s.customLook;this.renderPanel(p);});
      if(custom){
        const customBox=document.createElement('div');customBox.className='lobby-custom-look';
        for(const key of ['skin','shirt','pants','shoes','hairColor']){
          const option=button(`${LOOK_LABELS[key]} · ${look[key]}`,()=>{
            s.creationColorKey=key;this.renderPanel(p);
          },customBox);
          option.style.borderLeft=`6px solid ${look[key]}`;
          option.classList.add('lobby-color-option');
        }
        const styles=['crop','bob','long','ponytail','mohawk','curls','none'];
        const hair=button(`Hair style · ${look.hair}`,()=>{
          look.hair=styles[(styles.indexOf(look.hair)+1)%styles.length];this.renderPanel(p);
        },customBox);
        hair.classList.add('lobby-color-option');
        panel.append(customBox);
        if(s.creationColorKey){
          const key=s.creationColorKey, pickerBox=document.createElement('div');
          pickerBox.className='lobby-color-picker';
          const title=document.createElement('strong');title.textContent=`Choose ${LOOK_LABELS[key]}`;pickerBox.append(title);
          const swatches=document.createElement('div');swatches.className='lobby-color-swatches';
          for(const color of BASIC_COLORS){const swatch=button(color,()=>chooseColor(color),swatches);swatch.className='lobby-swatch';swatch.style.background=color;swatch.setAttribute('aria-label',`Choose color ${color}`);}
          pickerBox.append(swatches);
          const recentTitle=document.createElement('small');recentTitle.textContent='Recent colors';pickerBox.append(recentTitle);
          const recents=document.createElement('div');recents.className='lobby-color-swatches lobby-recent-swatches';
          for(const color of s.recentColors){const swatch=button(color,()=>chooseColor(color),recents);swatch.className='lobby-swatch';swatch.style.background=color;swatch.setAttribute('aria-label',`Choose recent color ${color}`);}
          if(!s.recentColors.length){const empty=document.createElement('small');empty.textContent='Your last four colors appear here.';recents.append(empty);}
          pickerBox.append(recents);
          const picker=document.createElement('input');picker.type='color';picker.value=look[key];picker.setAttribute('aria-label',`Custom ${LOOK_LABELS[key]} color`);picker.oninput=()=>chooseColor(picker.value);
          const openPicker=button(`Custom color · ${look[key]}`,()=>picker.click(),pickerBox);
          openPicker.classList.add('lobby-open-picker');
          openPicker.style.borderLeft=`8px solid ${look[key]}`;
          pickerBox.append(picker);
          const close=button('Done',()=>{s.creationColorKey=null;this.renderPanel(p);},pickerBox);close.classList.add('lobby-color-done');
          panel.append(pickerBox);
        }
      }
      const art=document.createElement('canvas');art.width=220;art.height=110;panel.append(art);
      const preview=()=>{const c=art.getContext('2d');c.clearRect(0,0,220,110);c.save();c.translate(110,90);c.scale(2.4,2.4);drawPlayer(c,{appearance:look,equipment:{},faceX:0,faceY:1,animationAction:'idle'},0);c.restore();};preview();
      button('Create & join',()=>{
        const problem=characterNameError(input.value,this.profiles.data.heroes);if(problem){error.textContent=problem;return;}
        this.profiles.assign(p,this.profiles.create(input.value,look));s.spawned=true;this.state.invalidate(this.getGame().players);this.close(p);this.refreshChoosers();
      });
      button('Back',()=>{s.panel='choose';s.focus=0;this.renderPanel(p);});
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
  navigate(p,{x=0,y=0,accept=false,back=false}){
    const s=this.state.members.get(p.id),panel=this.nodes.get(p.id);if(!panel)return;
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
    if(s.panel){
      if(owner==='keyboard'&&e.target.matches('input')&&!['Escape','Enter'].includes(e.key))return true;
      const action={x:e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0,y:e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0,accept:e.key==='Enter',back:e.key==='Escape'};
      e.preventDefault();
      if(action.x||action.y||action.accept||action.back){if(!e.repeat)this.navigate(p,action);}return true;
    }
    if(e.key==='Enter'){e.preventDefault();return true;}
    if(e.key==='Escape'){e.preventDefault();p.ready=false;this.state.countdown=null;return true;}
    return false;
  }
  controller(pad,previous){
    const p=this.getGame().players.find(p=>p.device==='pad:'+pad.index);if(!p)return;
    const s=this.state.members.get(p.id);if(!s)return;
    const x=Math.abs(pad.axes[0]||0)>.6?Math.sign(pad.axes[0]):0,y=Math.abs(pad.axes[1]||0)>.6?Math.sign(pad.axes[1]):0;
    if(s.panel)this.navigate(p,{x:pad.buttons[14]?.pressed&&!previous[14]?-1:pad.buttons[15]?.pressed&&!previous[15]?1:x!==s.axisX?x:0,y:pad.buttons[12]?.pressed&&!previous[12]?-1:pad.buttons[13]?.pressed&&!previous[13]?1:y!==s.axisY?y:0,accept:pad.buttons[0]?.pressed&&!previous[0],back:pad.buttons[1]?.pressed&&!previous[1]});
    s.axisX=x;s.axisY=y;
  }
  update(dt,inputs,blocked=false){
    this.sync();const players=this.getGame().players;
    for(const p of players){
      const s=this.state.members.get(p.id),input=players.find(q=>q.device===p.device)===p?(inputs[p.device]||{}):{};
      if(!blocked&&s.spawned&&!s.panel&&!p.lobbyDisconnected){
        if(input.interact&&!s.held.interact){const o=this.state.nearest(p);if(o)this.open(p,o.id);}
      }else s.moving=false;
      s.held={...input};
    }
    this.practice.stepPractice(dt,players,this.state.members,inputs,blocked);
    if(!blocked&&this.state.tick(dt,players))this.start();
    this.draw();
    this.area.querySelector('.lobby-countdown').textContent=this.state.countdown!==null?`The board opens in ${Math.max(1,Math.ceil(this.state.countdown))}…`:'';
  }
  drawPractice(c){
    c.save();
    for(const t of this.practice.traps){c.strokeStyle='#dbbd76';c.lineWidth=3;c.beginPath();c.ellipse(t.x,t.y,15,8,0,0,Math.PI*2);c.stroke();}
    for(const b of this.practice.baits){c.fillStyle='#dc9880';c.fillRect(b.x-4,b.y-3,8,6);}
    for(const a of this.practice.arrows){c.save();c.translate(a.x,a.y-(a.z||0));c.rotate(a.angle??Math.atan2(a.vy,a.vx));c.fillStyle='#ba9763';c.fillRect(-10,-1,20,2);c.fillStyle='#f0e7cd';c.fillRect(8,-3,5,6);c.restore();}
    for(const b of this.practice.spells){c.fillStyle=b.color||'#ace3ff';c.beginPath();c.arc(b.x,b.y-16,b.size||6,0,Math.PI*2);c.fill();}
    for(const f of this.practice.effects){if(!f.text)continue;c.fillStyle=f.color||'#fff';c.font='12px system-ui';c.fillText(f.text,f.x,f.y);}
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
  draw(){
    const c=this.canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#50565a';c.fillRect(0,0,1024,620);
    for(let y=65;y<590;y+=42)for(let x=30;x<1000;x+=42){c.fillStyle=((x-30)/42+(y-65)/42)%2?'#686d70':'#62676a';c.fillRect(x,y,40,40);}
    c.fillStyle='#343a3e';c.fillRect(20,55,984,10);c.fillRect(20,590,984,12);
    c.textAlign='center';
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
      }else{
        c.fillStyle='#523c2b';c.fillRect(o.x-60,o.y-37,120,57);c.fillStyle='#9b7041';c.fillRect(o.x-56,o.y-40,112,48);c.strokeStyle='#d6b569';c.lineWidth=2;c.strokeRect(o.x-49,o.y-34,98,36);c.fillStyle='#2f3d2b';c.font='bold 15px Georgia';c.fillText('WILDBOUND',o.x,o.y-11);c.fillStyle='#e2bf6c';c.fillRect(o.x-6,o.y+6,12,8);
      }
      c.fillStyle='#f2efdf';c.font='15px system-ui';c.fillText(o.name,o.x,o.y+44);
      if(o.id!=='board'){c.font='12px system-ui';c.fillStyle='#d1d5d4';c.fillText(document.getElementById(o.id).selectedOptions[0].text,o.x,o.y+61);}
    }
    this.drawPractice(c);
    for(const p of [...this.getGame().players].sort((a,b)=>this.state.members.get(a.id).y-this.state.members.get(b.id).y)){
      const s=this.state.members.get(p.id);if(!s.spawned)continue;
      c.fillStyle='#41474b';c.beginPath();c.ellipse(s.x,s.y+4,20,7,0,0,Math.PI*2);c.fill();
      const actor=this.practice.players.find(a=>a.id===p.id)||{...p,...s};
      c.save();c.translate(s.x,s.y-(actor.jumpHeight||0));c.scale(2,2);drawPlayer(c,actor,this.practice.time);c.restore();
      c.font='13px system-ui';c.fillStyle=p.ready?'#a8f4c9':p.color;c.fillText((p.ready?'✓ ':'')+p.name+(p.lobbyDisconnected?' · disconnected':''),s.x,s.y+27);
      const o=this.state.nearest(p);if(o&&!s.panel){const interact=p.device==='keyboard'?'E':controllerButtonNames(p.controllerFamily||'generic')[3];c.fillStyle='#182326';c.fillRect(s.x-69,s.y-95,138,24);c.fillStyle='#fff';c.font='12px system-ui';c.fillText(interact+' · '+o.name,s.x,s.y-79);}
    }
  }
}
