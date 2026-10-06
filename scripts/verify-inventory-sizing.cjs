const {app,BrowserWindow}=require('electron');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
app.disableHardwareAcceleration();
app.setPath('userData',path.join(root,'test-output/inventory-sizing-profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true}});
 try{
  await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));
  await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const {Game}=await import('./src/core.mjs');
   const {HeroUI}=await import('./src/hero-ui.mjs');
   const {ITEMS,RARITIES}=await import('./src/items.mjs');
   const root=document.createElement('div');root.style.cssText='position:fixed;inset:0;z-index:99999';document.body.append(root);
   const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();p.inventory=Array(24).fill(null);
   p.inventory[0]={type:'potion',qty:4};p.inventory[1]={type:'sword',qty:1};p.inventory[2]={type:'arrow',qty:20};
   const types=['bow','torch','pants','boots','trap','fruit','meat','stamina_potion'];
   types.forEach((type,i)=>{if(ITEMS[type])p.inventory[i+3]={type,qty:i%3+1};});
   for(const [type,def]of Object.entries(ITEMS))if(def.slot&&!p.equipment[def.slot])p.equipment[def.slot]=type;
   const ui=new HeroUI(root),results=[];
   const measure=()=>Object.fromEntries(['.paper-doll','.inventory-window .item-grid','.inventory-window .item-grid button'].map(s=>{
    const b=root.querySelector(s).getBoundingClientRect();return [s,[b.x,b.y,b.width,b.height]];
   }));
   for(const height of [850,600,420]){
    root.style.height=height+'px';let baseline;
    for(const [panel,index,notice]of [['pack',0,''],['pack',1,''],['pack',2,''],['pack',23,''],['gear',0,''],['pack',0,'Cannot equip this item.']]){
     p.ui={panel,index,notice};ui.draw(g,{});const bounds=measure();
     baseline||=bounds;
     if(root.querySelectorAll('.paper-doll button[data-slot]').length!==11||root.querySelectorAll('.inventory-window .item-grid button').length!==24)throw Error('Missing inventory slots');
     const selected=root.querySelector('.item-grid button.selected');
     if(selected?.showItemTooltip){selected.showItemTooltip();const a=selected.getBoundingClientRect(),b=root.querySelector('.item-tooltip').getBoundingClientRect();if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)throw Error('Tooltip covers selected slot at '+height);}
     if(JSON.stringify(bounds)!==JSON.stringify(baseline))throw Error('Selection changed geometry at '+height+': '+JSON.stringify({baseline,bounds,panel,index}));
    }
    results.push({height,stable:true});
   }
   root.style.height='850px';p.ui={panel:'pack',index:1};ui.draw(g,{});
   for(const rarity of Object.keys(RARITIES)){
    const type=Object.keys(ITEMS).find(type=>ITEMS[type].rarity===rarity);
    if(!type)continue;
    p.inventory[1]={type,qty:1};g.uiRevision=(g.uiRevision||0)+1;ui.draw(g,{});
    root.querySelector('.inventory-window button.selected').showItemTooltip();
    const name=root.querySelector('.item-tooltip .item-name');
    const expected=document.createElement('span');expected.style.color=RARITIES[rarity];
    if(name.style.color!==expected.style.color)throw Error('Wrong tooltip color for '+rarity);
   }
   p.inventory[1]={type:'sword',qty:1};g.uiRevision++;ui.draw(g,{});
   const facing=[p.faceX,p.faceY];
   root.querySelector('.preview-turn-right').click();
   if(p.ui.previewDirection!==1||JSON.stringify([p.faceX,p.faceY])!==JSON.stringify(facing))throw Error('Preview rotation changed world facing');
   root.querySelector('.preview-turn-left').click();
   if(p.ui.previewDirection!==0)throw Error('Preview reverse rotation failed');
   p.equipment.hand1='stick';p.equipment.hand2=null;g.uiRevision++;ui.draw(g,{});
   return results;
  })()`);
  await new Promise(resolve=>setTimeout(resolve,500));
  require('node:fs').writeFileSync(path.join(root,'test-output/inventory-layout.png'),(await w.webContents.capturePage()).toPNG());
  console.log(JSON.stringify(result));app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
