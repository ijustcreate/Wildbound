const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {once} = require('node:events');

module.exports = async function verifyQaRemediation({window,testOutput,app}) {
 const output=path.join(testOutput,'qa-remediation');
 await fs.mkdir(output,{recursive:true});
 const checks=[],errors=[];
 const run=source=>window.webContents.executeJavaScript('(async()=>{'+source+'})()');
 const check=(name,condition)=>{checks.push({name,pass:!!condition});assert.ok(condition,name);};
 const wait=(condition,timeout=35000)=>run('const deadline=Date.now()+'+timeout+';while(!('+condition+')){if(Date.now()>deadline)throw Error('+JSON.stringify('Timed out: '+condition)+');await new Promise(r=>setTimeout(r,100));}');
 const capture=async name=>{
  await run('await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));');
  await new Promise(resolve=>setTimeout(resolve,350));
  await fs.writeFile(path.join(output,name+'.png'),(await window.webContents.capturePage()).toPNG());
 };
 window.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 window.webContents.on('render-process-gone',(_event,detail)=>errors.push(detail.reason));
 const report={version:app.getVersion(),exe:app.getPath('exe'),appPath:app.getAppPath(),muted:window.webContents.isAudioMuted(),checks,errors};
 try{
  await run('await wildboundBoot.ready;if(wildboundBoot.error)throw Error(wildboundBoot.error);');
  check('Muted isolated Electron',report.muted&&!!(await run('return window.desktop.testMode;')));
  await run(String.raw`
   window.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true,cancelable:true}));
   const qa=window.previewCharacterSelect();
   const api=wildboundPolishTest;
   api.profiles.assign(qa.first,qa.hero);
   api.profiles.create('Pine Courier');
   api.profiles.create('Bayou Ranger');
   qa.lobby.keepSelectedPlayers();
   document.querySelector('.lobby-landing').hidden=true;
   window.fixQa=qa;
   qa.lobby.openCharacterStation(qa.first);
  `);
  check('Explorer picker has two arrows, a visible count and a named portrait strip',await run("const pane=fixQa.lobby.nodes.get(fixQa.first.id);return !!pane.querySelector('[aria-label=\"Previous explorer\"]')&&!!pane.querySelector('[aria-label=\"Next explorer\"]')&&pane.textContent.includes('1 of 3')&&pane.querySelectorAll('.lobby-explorer-strip button').length===3;"));
  const previous=await run("const {lobby,first}=fixQa;lobby.nodes.get(first.id).querySelector('[aria-label=\"Previous explorer\"]').click();return lobby.nodes.get(first.id).querySelector('.lobby-explorer-identity strong').textContent;");
  check('Previous explorer wraps to the final character',previous==='Bayou Ranger');
  await capture('explorer-picker');
  await run(String.raw`
   const {lobby,first}=fixQa;
   const {Game}=await import('./src/core.mjs');
   const {saveSession}=await import('./src/session.mjs');
   const classic=new Game(()=>.5,{deferWorld:true}),p=classic.addPlayer('keyboard','Ordinary checkpoint');
   p.coins=121;classic.phase='play';
   await window.desktop.saveSession(saveSession(classic));
   lobby.close(first);lobby.open(first,'environment');
   const menu=lobby.nodes.get(first.id);menu.querySelector('.expedition-wilds').click();menu.querySelector('.expedition-accept').click();
  `);
  await wait('wildboundPolishTest.game.trainTest?.persistent');
  check('Public Expedition entry launches a persistent Wilds world',await run("return wildboundPolishTest.screen==='play'&&wildboundPolishTest.game.trainTest.design.wildLands;"));
  await wait('!wildboundPolishTest.game.trainTest.preparing&&wildboundPolishTest.game.trainTest.time>0',95000);
  check('Wilds simulation begins after terrain startup',true);
  await capture('wilds-loaded');
  await run(String.raw`
   const api=wildboundPolishTest;
   api.pause();
   const game=api.game,p=game.players[0],train=game.trainTest;
   Object.assign(p,{x:6100,y:3430,coins:77,xp:17,inventory:[{type:'iron_sword',qty:1}]});
   Object.assign(train,{distance:8200,speed:0,engine:false});
   train.wildExploration.opened.add('fern-glade');
   await document.querySelector('#progress-save-now').onclick();
  `);
  const saveFile=path.join(app.getPath('userData'),'wilds-expedition-v1.json');
  const saved=JSON.parse(await fs.readFile(saveFile,'utf8'));
  const classic=JSON.parse(await fs.readFile(path.join(app.getPath('userData'),'expedition-v1.json'),'utf8'));
  check('Wilds and ordinary expeditions write different checkpoint files',saved.wilds?.progress.distance===8200&&classic.state.players[0].coins===121&&!classic.wilds);
  check('Wilds checkpoint contains gear, currency, XP, and claimed sites',saved.state.players[0].coins===77&&saved.state.players[0].xp===17&&saved.state.players[0].inventory[0].type==='iron_sword'&&saved.wilds.sites.opened.includes('fern-glade'));
  await run("await document.querySelector('#quit-button').onclick();");
  check('Save and return takes the party to the lobby',await run("return wildboundPolishTest.screen==='lobby';"));
  const ready=once(window.webContents,'did-finish-load');
  window.reload();
  await ready;
  await run("await wildboundBoot.ready;await document.querySelector('#continue-wilds').onclick();");
  await wait('wildboundPolishTest.game.trainTest?.persistent');
  check('Continue The Wilds restores the actual disk save after a renderer reload',await run(String.raw`
   const {game}=wildboundPolishTest,p=game.players[0],t=game.trainTest;
   return p.coins===77&&p.xp===17&&p.inventory[0].type==='iron_sword'&&p.x===6100&&t.distance===8200&&t.wildExploration.opened.has('fern-glade');
  `));
  await run(String.raw`
   const {Game}=await import('./src/core.mjs');
   const {createLocalWorld,saveLocalWorld}=await import('./src/world-instances.mjs');
   const {BUILTIN_PACKS}=await import('./src/world-simulation.mjs');
   const api=wildboundPolishTest,p=api.game.players[0];
   for(const [i,time] of [Date.now()-86400000,Date.now()].entries()){
    const options={id:'world-qa-'+i,name:'Twin Groves',pack:BUILTIN_PACKS[i],seed:50+i,party:[p],now:time};
    await window.desktop.saveWorld(saveLocalWorld(createLocalWorld(options),time));
   }
   await window.wildboundWorldsTest.open();
  `);
  check('Living Worlds shows distinct biomes and recency with management collapsed',await run(String.raw`
   const rows=[...document.querySelectorAll('[data-world-list] article')];
   return rows.length===2&&rows[0].textContent.includes('Cemetery')&&rows[0].textContent.includes('Seed 51')&&rows[1].textContent.includes('Heartwood')&&rows.every(row=>row.textContent.includes('Last saved')&&row.querySelector('button').textContent==='Continue')&&!document.querySelector('.worlds-manage').open;
  `));
  await capture('living-worlds');
  await run(String.raw`
   document.querySelector('[data-world-close]').click();
   const api=wildboundPolishTest;
   const {Game}=await import('./src/core.mjs');
   const {Renderer}=await import('./src/render.mjs');
   const {openMerchant}=await import('./src/traveling-merchant.mjs');
   const game=new Game(()=>.5),p=game.addPlayer('keyboard','QA Trade');game.start();
   api.game=game;api.show('play');api.renderer=new Renderer(document.querySelector('#game-canvas'),api.assets);
   game.merchant={name:'Marlow Moss',x:p.x,y:p.y,stock:[{item:{type:'potion',qty:1},price:15},{item:{type:'sword',qty:1},price:30}],revision:0};
   openMerchant(game,p);api.heroUI.draw(game,api.renderer);
   window.merchantFixQa={game,p,api};
  `);
  report.merchant=await run(String.raw`
   const {game,p,api}=merchantFixQa;
   const heights=()=>[...document.querySelectorAll('.merchant-row')].map(row=>row.getBoundingClientRect().height);
   const before=heights();
   document.querySelectorAll('.merchant-row')[1].click();api.heroUI.draw(game,api.renderer);
   const detail=document.querySelector('.merchant-detail h3');
   const {ITEMS}=await import('./src/items.mjs');
   return {before,after:heights(),detail:detail?.textContent,expected:ITEMS.sword.name};
  `);
  check('Merchant rows keep their heights while the appraisal updates',report.merchant.before.length===2&&report.merchant.before.every((height,index)=>height===report.merchant.after[index])&&report.merchant.detail===report.merchant.expected);
  await capture('merchant-ledger');
  await run(String.raw`
   const {game,p}=merchantFixQa;
   p.ui=null;
   game.event={name:'QA encounter',tip:'Hold the path until the opening.'};
   game.eventDuration=game.eventTime=1;
   game.eventOnBoard=false;
  `);
  await wait("!document.querySelector('#pause-last-encounter').hidden");
  check('One-second encounter reaches full opacity',await run("return document.querySelector('#event-card').style.opacity==='1';"));
  await run('merchantFixQa.game.eventTime=0;');
  await wait("document.querySelector('#event-card').classList.contains('hidden')");
  check('A controller can recover the tactic after the encounter card closes',await run(String.raw`
   const {p,api}=merchantFixQa, entry=document.querySelector('#pause-last-encounter'),summary=entry.querySelector('summary');
   const pad={index:0,id:'Xbox Wireless Controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
   const press=index=>{pad.buttons[index]={pressed:true,value:1};api.inputFrame();pad.buttons[index]={pressed:false,value:0};api.inputFrame();};
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});
   p.device='pad:0';
   try{
    api.pause(undefined,p.device);api.inputFrame();
    for(let i=0;i<18&&document.activeElement!==summary;i++)press(13);
    if(document.activeElement!==summary)return false;
    press(0);
    return entry.open&&entry.querySelector('p').textContent==='Hold the path until the opening.';
   }finally{
    api.resume();p.device='keyboard';delete navigator.getGamepads;
   }
  `));
  await run(String.raw`
   const {game,p,api}=merchantFixQa;p.ui=null;game.phase='lost';api.resume();
  `);
  await wait("document.querySelector('#defeat-dialog').open");
  check('Defeat offers an explicit restart confirmation and safe cancel',await run(String.raw`
   const button=document.querySelector('#defeat-restart');
   const copy=button.textContent;
   button.click();
   const confirming=!document.querySelector('#defeat-confirm').hidden&&document.activeElement.id==='defeat-keep-going';
   document.querySelector('#defeat-keep-going').click();
   return confirming&&document.querySelector('#defeat-confirm').hidden&&copy.includes('Reset board and encounter progress')&&wildboundPolishTest.game.phase==='lost';
  `));
  await capture('defeat-choices');
  check('No renderer errors',errors.length===0);
 }catch(error){report.error=error.stack||String(error);}
 report.failed=Number(!!report.error)+errors.length;
 await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({output,checks:checks.length,failed:report.failed,error:report.error,errors}));
 app.exit(report.failed?1:0);
};
