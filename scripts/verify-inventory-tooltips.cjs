const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,stage=process.env.TOOLTIP_STAGE||'source',out=path.join(root,'test-output/inventory-tooltips',stage);
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-tooltips-')));app.commandLine.appendSwitch('mute-audio');app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[],checks=[];
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const run=code=>w.webContents.executeJavaScript('(async()=>{'+code+'})()');
 try{
  await w.loadFile(path.join(base,'index.html'));await run(`await wildboundBoot.ready;window.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true,cancelable:true}));window.requestAnimationFrame=()=>0;`);
  await run(`const {Game}=await import('./src/core.mjs'),{HeroUI}=await import('./src/hero-ui.mjs'),{ITEMS}=await import('./src/items.mjs');
   const host=document.createElement('div');host.id='hero-overlays';host.style.cssText='position:fixed;inset:0;z-index:99999;background:#243b30';document.body.append(host);
   const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.phase='play';p.equipment={hand1:'bow',hand2:'occupied',head:'hat'};
   p.inventory=['sword','moon_blade','sun_plate','relic_bag','apple','shield','ice_wand','moon_shield','sun_blade','bow'].filter(type=>ITEMS[type]).map(type=>({type,qty:1}));g.openInventory(p);
   const ui=new HeroUI(host);ui.draw(g,{});window.tooltipQA={host,g,p,ui,ITEMS};`);
  for(const [width,height]of [[1280,850],[600,430]]){
   w.setContentSize(width,height);
   const result=await run(`const {host,g,p,ui,ITEMS}=tooltipQA;ui.draw(g,{});const panel=ui.panels.get(p.id),checks=[],ok=(v,name)=>{checks.push({name:name+' · '+innerWidth+'×'+innerHeight,passed:!!v});if(!v)throw Error(name);};
    const slots=()=>[...panel.querySelectorAll('.item-grid button[data-mode],.paper-doll button[data-mode]')];
    const visible=slot=>{const r=slot.getBoundingClientRect(),clip=slot.closest('.item-grid')?.getBoundingClientRect();return clip?{left:Math.max(r.left,clip.left),right:Math.min(r.right,clip.right),top:Math.max(r.top,clip.top),bottom:Math.min(r.bottom,clip.bottom)}:r;};
    const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
    const filled=slots().filter(b=>b.showItemTooltip);ok(filled.length>5,'native inventory exposes filled slots');const packGrid=panel.querySelector('.inventory-window .item-grid');ok([...packGrid.querySelectorAll('canvas.item-icon')].every(icon=>icon.getBoundingClientRect().height>=20),'item artwork stays legible in small panels');
    for(const b of filled){b.scrollIntoView({block:'nearest',inline:'nearest'});b.dispatchEvent(new PointerEvent('pointerenter'));const tip=panel.querySelector('.item-tooltip'),r=tip.getBoundingClientRect();
      ok(!tip.hidden&&tip.classList.contains('tooltip-docked'),'hover uses compact shelf');
      ok(slots().every(slot=>overlap(r,visible(slot))<1),'hover leaves every inventory slot uncovered');
      const pr=panel.getBoundingClientRect();ok(r.left>=pr.left-1&&r.right<=pr.right+1&&r.bottom<=pr.bottom+1,'shelf stays within player panel');b.dispatchEvent(new PointerEvent('pointerleave'));
    }
    const target=filled.find(b=>b.dataset.mode==='pack')||filled[0];target.scrollIntoView({block:'nearest',inline:'nearest'});target.dispatchEvent(new PointerEvent('pointerenter'));
    const tip=panel.querySelector('.item-tooltip'),stats=tip.querySelector('.item-tooltip-stats'),scale=document.querySelector('#ui-scale');
    const textSize=parseFloat(getComputedStyle(stats).fontSize),previousScale=scale.value;
    scale.value='1.3';scale.dispatchEvent(new Event('change'));
    ok(parseFloat(getComputedStyle(stats).fontSize)>textSize,'Couch scale enlarges item inspection stats');
    scale.value=previousScale;scale.dispatchEvent(new Event('change'));
    ok(panel.querySelector('[data-slot="hand1"] .equipment-slot-label').textContent.includes('Right hand')&&panel.querySelector('[data-slot="hand2"] .equipment-slot-label').textContent.includes('Left hand'),'Both hands have full visible label text');
    host.dispatchEvent(new KeyboardEvent('keydown',{key:'Alt',bubbles:true}));ok(tip.classList.contains('tooltip-expanded')&&!tip.classList.contains('tooltip-docked'),'Alt reveals full item details');
    host.dispatchEvent(new KeyboardEvent('keyup',{key:'Alt',bubbles:true}));ok(tip.classList.contains('tooltip-docked'),'releasing Alt restores the unobtrusive shelf');
    panel.querySelector('.inventory-details-toggle').click();ok(tip.classList.contains('tooltip-expanded'),'Details button opens full inspection');host.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));ok(tip.classList.contains('tooltip-docked')&&!!p.ui,'Escape compacts details before closing inventory');
    p.ui.notice='Test transaction feedback';target.showItemTooltip();ok(overlap(tip.getBoundingClientRect(),panel.querySelector('.storage-notice').getBoundingClientRect())<1,'transaction feedback remains visible');delete p.ui.notice;
    panel.tooltipExpanded=true;p.ui.carry={name:'Sword'};target.showItemTooltip();ok(tip.hidden&&!panel.tooltipExpanded,'moving an item dismisses inspection');delete p.ui.carry;
    p.inventory[3].contents=[{type:'charm',qty:1}];p.ui.bag={mode:'pack',index:3,selected:0};ui.draw(g,{});const bagItem=panel.querySelector('.bag-grid button');bagItem.dispatchEvent(new PointerEvent('pointerenter'));ui.draw(g,{});ok(!panel.querySelector('.item-tooltip').hidden&&panel.querySelector('.item-tooltip').textContent.includes(ITEMS.charm.name),'bag contents retain readable inspection during redraw');delete p.ui.bag;ui.draw(g,{});
    p.device='pad:0';p.ui.panel='gear';p.ui.index=0;ui.draw(g,{});const gear=panel.querySelector('[data-mode=gear][data-slot=head]');gear?.showItemTooltip?.();ok(!panel.querySelector('.item-tooltip').hidden,'controller equipment inspection remains available');p.device='keyboard';ui.draw(g,{});panel.querySelector('[data-mode=pack][data-index=\"1\"]')?.dispatchEvent(new PointerEvent('pointerenter'));
    return checks;`);checks.push(...result);
   await run('await new Promise(resolve=>setTimeout(resolve,600));');
   fs.writeFileSync(path.join(out,`inventory-${width}x${height}.png`),(await w.webContents.capturePage()).toPNG());
  }
  w.setContentSize(1200,780);
  checks.push(...await run(`const {host,g,p,ui}=tooltipQA;p.device='keyboard';const q=g.addPlayer('pad:1');q.inventory=[{type:'sword',qty:1}];g.openInventory(q);ui.draw(g,{});
   const a=ui.panels.get(p.id),b=ui.panels.get(q.id);a.querySelector('[data-mode=pack]')?.showItemTooltip?.();b.querySelector('[data-mode=pack]')?.showItemTooltip?.();
   const r=a.getBoundingClientRect(),s=b.getBoundingClientRect();return [{name:'two-player inventory panels remain separate',passed:r.right<=s.left+1||s.right<=r.left+1||r.bottom<=s.top+1||s.bottom<=r.top+1}];`));
  await run('await new Promise(resolve=>setTimeout(resolve,600));');
  fs.writeFileSync(path.join(out,'two-player.png'),(await w.webContents.capturePage()).toPNG());
  const report={stage,appPath:base,checks,errors,failed:errors.length+checks.filter(c=>!c.passed).length};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({stage,checks:checks.length,failed:report.failed,errors,out}));w.destroy();app.exit(report.failed?1:0);
 }catch(error){fs.writeFileSync(path.join(out,'failure.png'),(await w.webContents.capturePage()).toPNG());fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({error:String(error),stack:error.stack,checks,errors},null,2));console.error(error);w.destroy();app.exit(1);}
});
