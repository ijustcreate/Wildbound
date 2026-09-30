const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
app.disableHardwareAcceleration();
app.setPath('userData',path.join(root,'test-output/inventory-redesign-profile'));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1440,height:940,webPreferences:{offscreen:true}});
  try {
    await win.loadFile(path.join(root,'index.html'));
    await win.webContents.executeJavaScript('window.wildboundBoot.ready');
    await win.webContents.executeJavaScript(`(async()=>{
      const {HeroUI}=await import('./src/hero-ui.mjs'),{Game}=await import('./src/core.mjs'),{give}=await import('./src/items.mjs');
      const root=document.createElement('div');root.style='position:fixed;inset:0;z-index:99999;background:#253331';document.body.append(root);
      const g=new Game(()=>.4);g.addPlayer('keyboard','Ember');g.start();g.phase='lobby';
      const p=g.players[0];p.inventory=[];
      for(const [type,qty] of [['armor_bag',1],['relic_bag',1],['crafting_bag',1],['armor',1],['potion',12],['relic_dust',18],['charm',1]])give(p.inventory,type,qty);
      g.openInventory(p);const ui=new HeroUI(root);ui.draw(g,{});
      window.review={g,p,ui,root,give};
    })()`);
    const result=await win.webContents.executeJavaScript(`(()=>{
      const {g,p,ui,root}=review,assert=(v,m)=>{if(!v)throw Error(m);},draw=()=>ui.draw(g,{});
      assert(root.querySelectorAll('[role=tab]').length===4,'four tabs');
      assert(!root.querySelector('.hero-vitals'),'no vitals');
      g.inventoryAction(p,'tab:other');draw();
      const potion=p.inventory.findIndex(i=>i?.type==='potion');g.inventoryAction(p,'select:'+potion);g.inventoryAction(p,'split');draw();
      assert(root.querySelector('.split-popover'),'split popup');
      g.inventoryAction(p,'up');g.inventoryAction(p,'use');draw();
      assert(p.inventory.filter(i=>i?.type==='potion').reduce((a,i)=>a+i.qty,0)===12,'split conserves items');
      assert(p.inventory.filter(i=>i?.type==='potion').length===2,'split creates second stack');
      root.querySelector('[data-mode=pack][data-index="0"]').click();draw();
      assert(root.querySelectorAll('.bag-grid button').length===10,'10 bag slots');
      root.querySelector('[data-action=bag-store]').click();draw();
      assert(p.inventory[0].contents[0].type==='armor','store in bag');
      root.querySelector('[data-action=bag-slot-0]').click();draw();
      assert(p.inventory.some(i=>i?.type==='armor'),'retrieve from bag');
      g.inventoryAction(p,'close');draw();assert(!root.querySelector('.bag-popover'),'controller close bag');
      assert(root.querySelector('.equipment-window').clientHeight>150,'doll visible');
      return {tabs:4,split:true,bagStore:true,bagRetrieve:true};
    })()`);
    for(const [width,height] of [[1440,940],[1000,700],[390,844]]) {
      win.setSize(width,height);await new Promise(r=>setTimeout(r,120));
      await win.webContents.executeJavaScript(`(()=>{review.ui.draw(review.g,{});const p=review.root.querySelector('.hero-panel');for(const e of p.querySelectorAll('.storage-layout,.item-grid,.inventory-window')){if(e.scrollHeight>e.clientHeight+2)throw Error('Clipped '+e.className+' '+e.scrollHeight+'/'+e.clientHeight);} })()`);
      await new Promise(r=>setTimeout(r,200));
      fs.writeFileSync(path.join(root,'test-output',`inventory-redesign-${width}.png`),(await win.webContents.capturePage()).toPNG());
    }
    console.log(JSON.stringify(result));app.exit(0);
  }catch(e){console.error(e);app.exit(1);}
});
