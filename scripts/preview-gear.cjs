// Complete gear contact sheets and native-canvas animation coverage, no game profile.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),output=path.join(root,'test-output');
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(output,'gear-preview-')));
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,webPreferences:{contextIsolation:true}});
  await win.loadFile(path.join(root,'index.html'));
  const base=pathToFileURL(root+path.sep).href;
  const rig=JSON.parse(fs.readFileSync(path.join(root,'authored/rigs.json'),'utf8')).player;
  const results=await win.webContents.executeJavaScript(`(async()=>{
    const {drawPlayer,directionVector}=await import(${JSON.stringify(base)}+'src/player-motion.mjs');
    const {ITEMS,SAFARI_HUNTER_SET}=await import(${JSON.stringify(base)}+'src/items.mjs');
    const {paintItem}=await import(${JSON.stringify(base)}+'src/item-art.mjs');
    const model=${JSON.stringify(rig)};
    const appearance={skin:'#d9ab76',shirt:'#bb8c35',pants:'#655039',shoes:'#49372d',hair:'crop',hairColor:'#593923'};
    const catalog=Object.entries(ITEMS).filter(([id,def])=>def.slot||def.relic);
    const images=[];
    function canvas(h,title) {
      const v=document.createElement('canvas');v.width=1120;v.height=h;
      const c=v.getContext('2d');c.imageSmoothingEnabled=false;
      c.fillStyle='#152b29';c.fillRect(0,0,v.width,h);c.fillStyle='#ead8a8';c.font='bold 22px sans-serif';c.fillText(title,24,34);
      return [v,c];
    }
    function hero(c,x,y,equipment,inventory,d,action='idle',frame=0) {
      const [faceX,faceY]=directionVector(d);
      c.save();c.translate(x,y);c.scale(3,3);
      drawPlayer(c,{faceX,faceY,equipment,inventory,appearance,animationAction:action,playerFrame:frame},.16,model);
      c.restore();
    }
    for(let page=0;page<Math.ceil(catalog.length/28);page++) {
      const entries=catalog.slice(page*28,page*28+28);
      const [v,c]=canvas(850,'WILDBOUND / GEAR CATALOG '+(page+1));
      entries.forEach(([id,def],i)=>{
        const x=16+(i%7)*158,y=64+Math.floor(i/7)*192;
        c.fillStyle='#203b36';c.fillRect(x,y,148,180);
        c.fillStyle='#e5d7ae';c.font='11px sans-serif';c.fillText(def.name,x+6,y+17,137);
        c.save();c.translate(x+8,y+28);c.scale(2,2);paintItem(c,id);c.restore();
        const gear=def.slot?{[def.slot]:id}:{},inventory=def.relic?[{type:id,qty:1}]:[];
        hero(c,x+78,y+157,gear,inventory,0);hero(c,x+119,y+157,gear,inventory,6);
        c.fillStyle='#a6b7a0';c.font='10px sans-serif';c.fillText(def.style||def.relicStyle||def.base,x+6,y+174);
      });
      images.push({name:'gear-catalog-'+(page+1)+'.png',data:v.toDataURL().split(',')[1]});
    }
    const sets=[
      ['Scout',{head:'hat',shoulders:'shoulder_armor',chest:'armor',gloves:'gloves',pants:'pants',feet:'boots',hand1:'sword',hand2:'shield'}],
      ['Tracker',{head:'leather_hood',shoulders:'fern_pauldron',chest:'hunter_coat',gloves:'cloth_wraps',pants:'ranger_pants',feet:'ranger_boots',cape:'moss_cape',hand1:'hunter_bow'}],
      ['Moonsteel',{head:'moon_helm',shoulders:'moon_shoulders',chest:'sun_plate',gloves:'iron_gauntlets',pants:'scale_pants',feet:'moon_steps',hand1:'moon_blade',hand2:'moon_shield'}],
      ['Sunforged',{head:'sun_crown',shoulders:'sun_shoulders',chest:'sun_plate',gloves:'sun_grips',pants:'ash_greaves',feet:'volcano_boots',hand1:'sun_blade',hand2:'sun_shield'}],
      ['Ember mage',{head:'moon_circlet',chest:'ember_robe',cape:'night_cape',hand1:'fire_wand',hand2:'violet_wand',neck:'charm'}],
      ['Safari',{...SAFARI_HUNTER_SET,hand1:'rifle'}],
    ];
    const [v,c]=canvas(1150,'WILDBOUND / EQUIPMENT IN EIGHT DIRECTIONS');
    sets.forEach(([label,gear],row)=>{
      const y=64+row*180;c.fillStyle='#ead8a8';c.font='14px sans-serif';c.fillText(label,24,y);
      for(let d=0;d<8;d++) {
        const x=78+d*138;c.fillStyle='#203b36';c.fillRect(x-54,y+12,108,150);
        hero(c,x,y+148,gear,[],d);
      }
    });
    images.push({name:'gear-outfits.png',data:v.toDataURL().split(',')[1]});
    const boots=catalog.filter(([,def])=>def.slot==='feet');
    const [bootCanvas,bc]=canvas(boots.length*180+70,'BOOT ALIGNMENT / LEFT AND RIGHT / IDLE + RUN');
    boots.forEach(([id,def],row)=>{
      const y=64+row*180;bc.fillStyle='#ead8a8';bc.font='14px sans-serif';bc.fillText(def.name,24,y);
      for(let col=0;col<8;col++) {
        const x=78+col*138;bc.fillStyle='#203b36';bc.fillRect(x-54,y+12,108,150);
        hero(bc,x,y+148,{feet:id},[],col<4?2:6,col%4===0?'idle':'run',[0,2,4,6][col%4]);
      }
    });
    images.push({name:'boots-alignment.png',data:bootCanvas.toDataURL().split(',')[1]});
    const test=document.createElement('canvas');test.width=test.height=256;
    const ctx=test.getContext('2d');let renders=0;
    for(const [id,def] of catalog)for(let d=0;d<8;d++)for(const action of ['idle','run','slash','block','jump']) {
      ctx.clearRect(0,0,256,256);
      hero(ctx,128,200,def.slot?{[def.slot]:id}:{},def.relic?[{type:id,qty:1}]:[],d,action,2);
      if(!ctx.getImageData(0,0,256,256).data.some(Boolean))throw Error('Empty '+id);
      renders++;
    }
    return {images,renders,count:catalog.length};
  })()`);
  for(const image of results.images)fs.writeFileSync(path.join(output,image.name),Buffer.from(image.data,'base64'));
  console.log(JSON.stringify({gear:results.count,renders:results.renders,images:results.images.map(i=>i.name)}));
  app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
