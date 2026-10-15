import {Game} from './core.mjs';
import {restoreForestLandscape} from './forest-landscape.mjs';
import {getNpcQuestConfig,replaceNpcQuestConfig} from './npc-quest-data.mjs';

const node=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
export class RealmClient {
  constructor({rooms,getGame,setGame,enterPlay,returnToGame,pause,getPaused}){
    Object.assign(this,{rooms,getGame,setGame,enterPlay,returnToGame,pause,getPaused});
    this.settings={address:'',creatorKey:'',name:'Forest Explorer'};
    try{Object.assign(this.settings,JSON.parse(localStorage.getItem('wildbound-forest-connection')||'{}'));}catch{}
    this.characterId=localStorage.getItem('wildbound-forest-character')||crypto.randomUUID().replaceAll('-','');
    localStorage.setItem('wildbound-forest-character',this.characterId);
    this.active=false;this.connected=false;this.pending=new Map();this.nextRequest=1;this.lastInput=0;
    window.desktop?.onRealm(data=>this.onEvent(data));
    this.bar=node('div');this.bar.className='realm-toolbar';this.bar.hidden=true;
    this.label=node('span','Persistent Forest');this.bar.append(this.label);
    const setup=node('button','Servers / Creator');setup.onclick=()=>this.openServers?.();
    const exit=node('button','Return Home');exit.onclick=()=>this.leave();
    this.bar.append(setup,exit);document.getElementById('play').append(this.bar);
  }
  saveSettings(){localStorage.setItem('wildbound-forest-connection',JSON.stringify(this.settings));}
  async local(){if(!window.desktop?.realmLocal)throw Error('Persistent worlds require the desktop game.');const info=await window.desktop.realmLocal();Object.assign(this.settings,info);this.saveSettings();return info;}
  async start(){const info=await window.desktop.realmStart();Object.assign(this.settings,info);this.saveSettings();return info;}
  async status(command='status'){
    if(!this.settings.address)await this.local();
    return window.desktop.realmRequest({...this.settings,command});
  }
  async join(creator=false){
    if(!window.desktop?.realmConnect)throw Error('Persistent worlds require the desktop game.');
    if(this.active){
      if(this.creatorRequested!==creator||!this.connected){this.creatorRequested=creator;this.connected=false;await this.reconnect();}
      return;
    }
    if(!this.settings.address)await this.local();
    if(creator&&!this.settings.creatorKey)throw Error('Enter the server’s creator key, or start the local forest.');
    this.saveSettings();this.saved={game:this.getGame(),paused:this.getPaused()};
    this.npcConfig=structuredClone(getNpcQuestConfig());this.creatorRequested=creator;
    await window.desktop.stopRoom();this.rooms.role='client';this.rooms.realm=this;
    this.active=true;this.connected=false;this.setGame(new Game(Math.random,{deferWorld:true}));
    this.bar.hidden=false;this.label.textContent='Connecting to Persistent Forest…';
    try{await this.reconnect();}catch(error){await this.leave();throw error;}
  }
  async reconnect(){
    this.rooms.role='client';this.rooms.realm=this;
    await window.desktop.realmConnect({...this.settings,creatorKey:this.creatorRequested?this.settings.creatorKey:'',characterId:this.characterId});
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.joinWait=null;reject(Error('Forest did not send its world.'));},10000);
      this.joinWait={resolve:()=>{clearTimeout(timer);this.joinWait=null;resolve();},reject:e=>{clearTimeout(timer);this.joinWait=null;reject(e);}};
      if(this.connected){clearTimeout(timer);this.joinWait=null;resolve();}
    });
  }
  send(data){if(this.active&&this.connected)window.desktop.realmSend(data);}
  input(inputs){
    if(performance.now()-this.lastInput<45)return;
    this.lastInput=performance.now();
    const selected=Object.entries(inputs).find(([k,v])=>k.startsWith('pad:')&&Object.values(v||{}).some(Boolean));
    this.send({type:'input',input:this.getPaused()||document.querySelector('dialog[open]')?{}:selected?.[1]||inputs.keyboard||{}});
  }
  async command(type,edit){
    if(!this.connected||!this.creator)throw Error('Enter the forest as creator first.');
    const requestId=this.nextRequest++;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.pending.delete(requestId);reject(Error('Creator command timed out. Reconnect and check the realm.'));},5000);
      this.pending.set(requestId,{resolve,reject,timer});this.send({type,edit,requestId});
    });
  }
  onEvent(data){
    if(!this.active)return;
    if(data.type==='welcome'){
      this.rooms.playerId=data.playerId;this.creator=!!data.creator;
    }else if(data.type==='state'){
      const g=this.getGame();Object.assign(g,data.state);
      g.realmViewerId=this.rooms.playerId;
      g.explored=new Set(data.state.explored||[]);restoreForestLandscape(g,data.state.forestLandscapeVersion);
      for(const p of g.players){
        p.device=p.id===this.rooms.playerId?'keyboard':'net:'+p.id;
        if(p.ui)p.ui.ownerDevice=p.device;
      }
      if(g.realm?.npcConfig&&this.appliedNpcConfig!==JSON.stringify(g.realm.npcConfig)){
        this.appliedNpcConfig=JSON.stringify(g.realm.npcConfig);replaceNpcQuestConfig(g.realm.npcConfig);
      }
      for(const action of ['usePotion','openInventory','leaveRoom','inventoryAction'])g[action]=(p,arg)=>{
        if(p.id===this.rooms.playerId)this.send({type:'action',action,arg});
      };
      g.portal=()=>{};g.persist=()=>{};
      if(!this.connected){this.connected=true;this.enterPlay(g);this.joinWait?.resolve();}
      this.label.textContent=`Persistent Forest · ${g.players.length} online · ${this.creator?'Creator':'Explorer'} · saved edits ${g.realm.revision}`;
      this.onChange?.();
    }else if(data.type==='disconnected'){
      this.connected=false;this.label.textContent='Forest disconnected · open Servers to reconnect or Return Home';
      this.joinWait?.reject(Error('Forest connection lost.'));
      for(const pending of this.pending.values()){clearTimeout(pending.timer);pending.reject(Error('Forest connection lost.'));}this.pending.clear();
      this.pause('Forest connection lost. Open Servers to reconnect, or Return Home.');
    }else if(data.type==='result'||data.type==='error'){
      const pending=this.pending.get(data.requestId);
      if(pending){clearTimeout(pending.timer);this.pending.delete(data.requestId);data.type==='error'?pending.reject(Error(data.message)):pending.resolve(data);}
      else if(data.type==='error')this.joinWait?.reject(Error(data.message));
    }
  }
  async leave(){
    if(!this.active)return;
    this.active=false;this.connected=false;this.rooms.realm=null;this.rooms.role=null;this.rooms.playerId=null;
    await window.desktop.realmDisconnect();
    for(const pending of this.pending.values()){clearTimeout(pending.timer);pending.reject(Error('Left the forest.'));}this.pending.clear();
    if(this.npcConfig)replaceNpcQuestConfig(this.npcConfig);this.appliedNpcConfig=null;
    this.bar.hidden=true;const saved=this.saved;this.saved=null;
    if(saved)this.returnToGame(saved.game,saved.paused);
  }
  mount(root){
    root.className='realm-panel';root.append(node('h2','Persistent Forest · Server Setup'));
    root.append(node('p','Start a forest on this computer, or paste the Optima server address. The server stays running when the game closes. Test explorers have their own saved progress.'));
    const fields=node('div');fields.className='realm-fields';
    for(const [key,label,type]of [['address','Server address','text'],['creatorKey','Creator key (editing only)','password'],['name','Test explorer name','text']]){
      const row=node('label',label),input=node('input');input.type=type;input.value=this.settings[key];input.dataset.realmField=key;
      input.placeholder=key==='address'?'192.168.1.10:47831/access-code':'';
      input.oninput=()=>{this.settings[key]=input.value.trim();this.saveSettings();};row.append(input);fields.append(row);
    }
    root.append(fields);const status=node('p','Check the server, or start a local forest.');status.className='realm-status';status.setAttribute('role','status');root.append(status);
    const actions=node('div');actions.className='realm-actions';root.append(actions);
    const report=s=>{status.textContent=`${s.name} · ${s.players}/6 explorers · ${s.sleeping?'Sleeping until someone joins':'Running'} · revision ${s.revision} · last save ${s.lastSave||'pending'}${s.saveError?' · SAVE ERROR: '+s.saveError:''}`;};
    const add=(label,fn)=>{const b=node('button',label);b.type='button';b.onclick=async()=>{b.disabled=true;try{await fn();}catch(e){status.textContent=e.message;}finally{b.disabled=false;}};actions.append(b);return b;};
    const updateFields=()=>{for(const input of fields.querySelectorAll('input'))input.value=this.settings[input.dataset.realmField]||'';};
    add('Start Local Forest',async()=>{status.textContent='Starting independent forest server…';const info=await this.start();updateFields();report(info.status);});
    add('Use Local Server',async()=>{await this.local();updateFields();status.textContent='Local server selected. Start it, or check its status.';});
    add('Test Connection',async()=>report(await this.status()));
    add('Enter Forest',async()=>{await this.join(false);root.closest('dialog').close();});
    add('Enter as Creator',async()=>{await this.join(true);root.closest('dialog').close();});
    add('Reconnect',async()=>{if(!this.active)throw Error('Enter the forest first.');await this.reconnect();root.closest('dialog').close();});
    add('Save Now',async()=>{const r=await this.status('save');status.textContent='Forest saved: '+r.savedAt;});
    add('Create Backup',async()=>{const r=await this.status('backup');status.textContent='Backup created in the server save folder: '+r.backup;});
    add('Stop Server',async()=>{await this.status('stop');status.textContent='Server is stopping after saving the forest.';});
    const share=node('details'),summary=node('summary','Mini PC setup and sharing');share.append(summary,
      node('p','On the Optima, open this desktop build → Servers → Start Local Forest. For other computers, replace 127.0.0.1 in the player address with the Optima’s LAN address. Share the complete address with players; share the creator key only with editors. This first test supports private home-network play.'),
      node('p','Saves and access keys: '+(this.settings.folder||'the desktop game profile / forest-server')+'. Start automatically by placing a shortcut to Start Wildbound Forest Server.cmd in Windows Startup. To restore a backup: stop the server, keep the current forest.json, and copy the chosen backup as forest.json in the same folder.'));
    root.append(share);
    const creator=node('section');creator.className='realm-creator';creator.append(node('h3','Live creator edits'));
    creator.append(node('p','Enter as Creator, then reopen this tab. Coordinates are world units. Changes apply to everyone and save immediately. The resident uses the existing Keeper dialogue and quests.'));
    const grid=node('div');grid.className='realm-fields';const inputs={};
    for(const [key,label,type,value]of [['name','Landmark / territory name','text','My forest landmark'],['x','World X','number','1200'],['y','World Y','number','1000']]){
      const row=node('label',label),input=node('input');input.type=type;input.value=value;row.append(input);grid.append(row);inputs[key]=input;
    }
    const type=node('select');for(const k of ['panther','tiger','lion','spider','boar'])type.append(new Option(k,k));const row=node('label','Creature');row.append(type);grid.append(row);creator.append(grid);
    const creatorActions=node('div');creatorActions.className='realm-actions';creator.append(creatorActions);
    const edit=async kind=>{const result=await this.command('edit',{type:kind,name:inputs.name.value,x:Number(inputs.x.value),y:Number(inputs.y.value),kind:type.value});status.textContent=result.message;};
    for(const [label,fn]of [['Use My Position',()=>{const p=this.getGame().players.find(p=>p.id===this.rooms.playerId);if(!p)throw Error('Enter the forest first.');inputs.x.value=Math.round(p.x+65);inputs.y.value=Math.round(p.y);}],['Place Landmark',()=>edit('landmark')],['Move Keeper Here',()=>edit('npc')],['Create Enemy Territory',()=>edit('territory')],['Spawn Enemy Now',()=>edit('spawn')],['Undo Last Edit',async()=>{status.textContent=(await this.command('undo')).message;}]]){
      const b=node('button',label);b.type='button';b.onclick=async()=>{b.disabled=true;try{await fn();}catch(e){status.textContent=e.message;}finally{b.disabled=false;}};creatorActions.append(b);
    }
    const list=node('div');list.className='realm-landmarks';creator.append(list);root.append(creator);
    const refresh=()=>{
      if(!root.isConnected)return;
      const realm=this.getGame().realm;
      const signature=JSON.stringify(realm?.landmarks||[])+':'+this.creator;
      if(signature===list.dataset.signature)return;list.dataset.signature=signature;list.replaceChildren();
      for(const l of realm?.landmarks||[]){
        const item=node('p',`${l.name} · ${Math.round(l.x)}, ${Math.round(l.y)} `);
        if(this.creator&&l.id!=='arrival'){
          const move=node('button','Move / Rename');move.onclick=async()=>{try{status.textContent=(await this.command('edit',{type:'landmark',id:l.id,name:inputs.name.value,x:Number(inputs.x.value),y:Number(inputs.y.value)})).message;}catch(e){status.textContent=e.message;}};item.append(move);
        }list.append(item);
      }
    };this.onChange=refresh;refresh();
  }
}
