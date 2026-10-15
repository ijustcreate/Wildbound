const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'menu-scrollbars-profile-')));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:800,webPreferences:{offscreen:true}}),errors=[];win.webContents.setAudioMuted(true);
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  if(base!==root)for(const file of ['src/ui-polish.css','src/playable-lobby.mjs'])if(!fs.readFileSync(path.join(root,file)).equals(fs.readFileSync(path.join(base,file))))throw Error('Stale packaged '+file);
  await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  await win.webContents.executeJavaScript(`(async()=>{
   const {Game}=await import('./src/core.mjs'),{freshCharacter}=await import('./src/items.mjs'),{PlayableLobby,LobbyState}=await import('./src/playable-lobby.mjs');
   const g=new Game(()=>.5),p=g.addPlayer('pad:0'),q=g.addPlayer('pad:1');
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:20px;z-index:99999;background:#142f28';
   const panels=document.createElement('div');panels.className='lobby-panels';host.append(panels);document.body.append(host);
   const profiles={data:{heroes:[freshCharacter('qa-first','Ember Fox'),freshCharacter('qa-second','Scout')]},assign(){}};
   const lobby=Object.create(PlayableLobby.prototype);Object.assign(lobby,{getGame:()=>g,state:new LobbyState(),nodes:new Map(),panels,root:document.querySelector('#lobby'),profiles,mapArt:new Image(),beachArt:new Image(),cemeteryArt:new Image()});
   lobby.state.sync(g.players);lobby.renderPanel(p);lobby.renderPanel(q);
   window.menuScrollbarQA={g,p,q,lobby,host,panels};
  })()`);
  const views=[];
  for(const [width,height]of [[1280,800],[780,500],[600,430]]){
   win.setContentSize(width,height);await new Promise(r=>setTimeout(r,100));
   const result=await win.webContents.executeJavaScript(`(()=>{
    const {lobby,p,q}=window.menuScrollbarQA,first=lobby.nodes.get(p.id),second=lobby.nodes.get(q.id),assert=(v,m)=>{if(!v)throw Error(m);};
    for(const [i,panel]of [first,second].entries())panel.style.cssText='position:absolute;left:'+ (i?innerWidth/2:10)+'px;top:10px;width:'+Math.min(280,innerWidth/2-45)+'px;height:180px;max-height:180px;';
    const rect=panel=>{const r=panel.getBoundingClientRect();return [r.x,r.y,r.width,r.height];},before=rect(second);
    first.scrollTop=second.scrollTop=0;lobby.state.members.get(p.id).focus=0;lobby.highlight(p);
    for(let n=0;n<3;n++)lobby.controller({index:0,axes:[0,0],buttons:Array.from({length:16},(_,i)=>({pressed:i===13}))},Array(16).fill(false));
    const selected=first.querySelector('.lobby-focus'),choice=selected.getBoundingClientRect(),box=first.getBoundingClientRect();
    assert(selected.textContent==='Leave lobby','Last controller option unreachable');assert(first.scrollTop>0&&choice.bottom<=box.top+first.clientTop+first.clientHeight+1,'Hidden last choice did not scroll into view');
    assert(second.scrollTop===0&&JSON.stringify(rect(second))===JSON.stringify(before),'Controller selection moved another owner');
    const elements=[document.documentElement,document.body,...document.body.querySelectorAll('*')];
    for(const e of elements){assert(getComputedStyle(e).scrollbarWidth==='none','Visible scrollbar on '+e.tagName+'.'+e.className);assert(getComputedStyle(e,'::-webkit-scrollbar').display==='none','Native scrollbar chrome remains');}
    first.scrollTop=0;const r=first.getBoundingClientRect();
    return {viewport:[innerWidth,innerHeight],checkedElements:elements.length,controllerLastOptionVisible:true,ownersIsolated:true,wheelPoint:[Math.round(r.x+r.width/2),Math.round(r.y+75)]};
   })()`);
   win.webContents.sendInputEvent({type:'mouseMove',x:result.wheelPoint[0],y:result.wheelPoint[1]});
   win.webContents.sendInputEvent({type:'mouseWheel',x:result.wheelPoint[0],y:result.wheelPoint[1],deltaX:0,deltaY:-140,canScroll:true});
   await new Promise(r=>setTimeout(r,200));
   const scrolled=await win.webContents.executeJavaScript('window.menuScrollbarQA.lobby.nodes.get(window.menuScrollbarQA.p.id).scrollTop');
   if(!(scrolled>0))throw Error('Mouse wheel cannot reach menu options');
   views.push({...result,wheelScrolling:true});
  }
  await win.webContents.executeJavaScript(`(async()=>{
   const {HeroUI}=await import('./src/hero-ui.mjs'),{Animator}=await import('./src/animation.mjs');const {g,p,host}=window.menuScrollbarQA;
   g.start();g.openingBoard=false;p.ui={panel:'gear',index:0};const root=document.createElement('div');root.style.cssText='position:fixed;inset:0;z-index:999999;background:#142f28';document.body.append(root);new HeroUI(root).draw(g,{animator:new Animator()});
   for(const e of root.querySelectorAll('*'))if(getComputedStyle(e).scrollbarWidth!=='none')throw Error('Inventory scrollbar remained');root.remove();
   const dialog=document.querySelector('#settings-dialog');dialog.showModal();for(const e of [dialog,...dialog.querySelectorAll('*')])if(getComputedStyle(e).scrollbarWidth!=='none')throw Error('Settings scrollbar remained');dialog.close();
   const {lobby}=window.menuScrollbarQA;for(const panel of lobby.nodes.values()){panel.style.height='360px';panel.style.maxHeight='360px';panel.scrollTop=0;}
  })()`);
  await new Promise(r=>setTimeout(r,250));fs.writeFileSync(path.join(out,'menus-no-scrollbars.png'),(await win.webContents.capturePage()).toPNG());
  const report={packaged:base!==root,views,inventory:true,settings:true,rendererErrors:errors};fs.writeFileSync(path.join(out,'menu-scrollbars-report.json'),JSON.stringify(report,null,2)+'\n');if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify(report));app.exit(0);
 }catch(e){console.error(e.stack);app.exit(1);}
});
