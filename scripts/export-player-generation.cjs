// Native, reproducible rig exports. Never writes into the previous generation.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const generation=Number(process.env.WILDBOUND_ART_GENERATION||3);
const out = path.join(root, 'art/player/detail-native-v'+generation);
fs.mkdirSync(path.join(root, 'test-output'), { recursive:true });
app.setPath('userData', fs.mkdtempSync(path.join(root, 'test-output/generation-')));
app.disableHardwareAcceleration();

async function exportInBrowser(url, model) {
  const {drawPlayer,directionVector} = await import(url+'player-motion.mjs');
  const {DEFAULT_APPEARANCE,HAIR_STYLES} = await import(url+'appearance.mjs');
  const {ITEMS,SAFARI_HUNTER_SET} = await import(url+'items.mjs');
  const {drawItem} = await import(url+'item-art.mjs');
  const directions=['S','SW','W','NW','N','NE','E','SE'];
  const generation=model.artGeneration||2;
  const appearance={...DEFAULT_APPEARANCE,shirt:generation===3?'#66744e':'#bb8c35',pants:generation===3?'#79634a':'#655039'};
  const variants=Object.keys(HAIR_STYLES).map(hair=>({id:hair==='crop'?'base':'hair-'+hair,appearance:{...appearance,hair},equipment:{}}));
  variants.push(
    {id:'sword-shield',equipment:{hand1:'iron_sword',hand2:'moon_shield',feet:'moon_steps',shoulders:'moon_shoulders'}},
    {id:'archer',equipment:{hand1:'moon_bow',chest:'armor',feet:'boots',gloves:'gloves'}},
    {id:'safari',equipment:{...SAFARI_HUNTER_SET,hand1:'rifle'}},
    {id:'mage',equipment:{head:'moon_circlet',hand1:'storm_wand',cape:'night_cape'}}
  );
  const animations=Object.entries(model.clips).map(([action,clip])=>({action,frames:clip.length,fps:clip.fps||12,loop:clip.loop!==false}));
  const canvas=(width,height)=>{const el=document.createElement('canvas');el.width=width;el.height=height;return el;};
  const png=el=>el.toDataURL('image/png').split(',')[1];
  const background=(c,w,h,title)=>{
    c.fillStyle='#182b2a';c.fillRect(0,0,w,h);c.fillStyle='#f0dba1';c.font='bold 22px sans-serif';c.fillText(title,24,34);
    c.font='13px sans-serif';c.fillStyle='#becdc6';
  };
  function actor(variant,d,action,frame) {
    const [faceX,faceY]=directionVector(d);
    return {equipment:variant.equipment,appearance:variant.appearance||appearance,inventory:[],pickupItem:'moon_prism',faceX,faceY,animationAction:action,playerFrame:frame};
  }
  // Return one file at a time to keep Electron's IPC payload bounded.
  window.generation={variants,animations,directions,render(variantId,action){
    const variant=variants.find(v=>v.id===variantId),clip=model.clips[action];
    const cell=128,ax=64,ay=88;
    const native=canvas(cell*clip.length,cell*8),n=native.getContext('2d');
    for(let d=0;d<8;d++)for(let f=0;f<clip.length;f++){
      n.save();n.translate(f*cell+ax,d*cell+ay);
      drawPlayer(n,actor(variant,d,action,f),f/clip.fps,model);n.restore();
    }
    const sheet=canvas(1280,1340),c=sheet.getContext('2d');
    background(c,1280,1340,'WILDBOUND / '+variantId.toUpperCase()+' / '+action.toUpperCase());
    c.fillText('Generation '+generation+' | 8 directions | '+clip.length+' source frames | native sprites included',24,58);
    for(let d=0;d<8;d++){
      const y=105+d*150;c.fillStyle='#becdc6';c.fillText(directions[d],20,y+66);
      c.fillStyle='#304641';c.fillRect(65,y+140,1190,1);
      for(let sample=0;sample<8;sample++){
        const f=sample/7*(clip.length-1),x=128+sample*150;
        c.save();c.translate(x,y+130);c.scale(3,3);
        drawPlayer(c,actor(variant,d,action,f),f/clip.fps,model);c.restore();
      }
    }
    return {native:png(native),sheet:png(sheet)};
  },styles(){
    const sheet=canvas(1200,100+Object.keys(HAIR_STYLES).length*208),c=sheet.getContext('2d');
    background(c,sheet.width,sheet.height,'WILDBOUND / GENERATION '+generation+' / ALL HAIRSTYLES');
    for(let d=0;d<8;d++)c.fillText(directions[d],180+d*130,70);
    Object.keys(HAIR_STYLES).forEach((hair,row)=>{
      c.fillStyle='#becdc6';c.fillText(hair.toUpperCase(),24,155+row*208);
      for(let d=0;d<8;d++){
        c.save();c.translate(195+d*130,270+row*208);c.scale(4,4);
        drawPlayer(c,actor({appearance:{...appearance,hair},equipment:{}},d,'idle',0),0,model);c.restore();
      }
    });return png(sheet);
  },faces(){
    const sheet=canvas(1200,1960),c=sheet.getContext('2d');
    background(c,1200,1960,'WILDBOUND / FACES, SKIN TONES AND BUILDS');
    let row=0;
    for(const face of ['classic','freckles','scar','beard'])for(const skin of ['#f1c997','#b77b51','#684832']){
      c.fillStyle='#becdc6';c.fillText(face+' / '+skin,20,140+row*152);
      for(let d=0;d<8;d++){
        c.save();c.translate(260+d*125,210+row*152);c.scale(3,3);
        drawPlayer(c,actor({appearance:{...appearance,face,skin,build:['standard','broad','slender'][row%3]},equipment:{}},d,'idle',0),0,model);c.restore();
      }row++;
    }return png(sheet);
  },catalog(page){
    const ids=Object.keys(ITEMS).filter(id=>ITEMS[id].slot),chunk=ids.slice(page*28,(page+1)*28);
    const sheet=canvas(1120,850),c=sheet.getContext('2d');
    background(c,1120,850,'WILDBOUND / GEAR CATALOG '+(page+1)+' / GENERATION '+generation);
    chunk.forEach((id,i)=>{
      const x=16+i%7*157,y=64+Math.floor(i/7)*190,def=ITEMS[id];
      c.fillStyle='#243d38';c.fillRect(x,y,146,180);
      c.fillStyle='#ebd6a0';c.font='11px sans-serif';c.fillText(def.name,x+6,y+17,136);
      drawItem(c,id,x+30,y+55,40);
      for(const [j,d] of [0,6].entries()){
        c.save();c.translate(x+76+j*42,y+165);c.scale(2.7,2.7);
        drawPlayer(c,actor({equipment:{[def.slot]:id}},d,'idle',0),0,model);c.restore();
      }
    });return {data:png(sheet),ids};
  }};
  return {variants,animations,directions,catalogPages:Math.ceil(Object.values(ITEMS).filter(i=>i.slot).length/28),cell:{width:128,height:128,anchorX:64,anchorY:88}};
}

app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,webPreferences:{contextIsolation:true}});
  await win.loadFile(path.join(root,'index.html'));
  const model=JSON.parse(fs.readFileSync(path.join(root,'authored/rigs.json'),'utf8')).player;
  const url=pathToFileURL(path.join(root,'src')).href+'/';
  const manifest=await win.webContents.executeJavaScript(`(${exportInBrowser.toString()})(${JSON.stringify(url)},${JSON.stringify(model)})`);
  if(process.argv.includes('--study')){
    manifest.variants=manifest.variants.filter(v=>['base','sword-shield','safari'].includes(v.id));
    manifest.animations=manifest.animations.filter(a=>['idle','run','walk','death','get_up','sleep','draw','sword_combo','mine'].includes(a.action));
  }
  const write=(file,data)=>{const target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,Buffer.from(data,'base64'));};
  for(const variant of process.argv.includes('--appearance-only')?[]:manifest.variants){
    for(const {action} of manifest.animations){
      const result=await win.webContents.executeJavaScript(`generation.render(${JSON.stringify(variant.id)},${JSON.stringify(action)})`);
      write(`after/${variant.id}/player-${action}-8dir.png`,result.sheet);
      write(`native/${variant.id}/${action}.png`,result.native);
    }
    console.log('Exported '+variant.id+' / '+manifest.animations.length+' animations');
  }
  write('all-hairstyles.png',await win.webContents.executeJavaScript('generation.styles()'));
  write('face-variants.png',await win.webContents.executeJavaScript('generation.faces()'));
  for(let page=0;page<manifest.catalogPages;page++){
    const result=await win.webContents.executeJavaScript(`generation.catalog(${page})`);
    write(`gear-catalog-${page+1}.png`,result.data);
  }
  manifest.generation=generation;
  manifest.source='authored/rigs.json + src/player-motion.mjs';
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
  fs.writeFileSync(path.join(out,'rig-snapshot.json'),JSON.stringify(model,null,2));
  const template=fs.readFileSync(path.join(root,'scripts/player-generation-preview.html'),'utf8');
  fs.writeFileSync(path.join(out,'index.html'),template.replaceAll('Generation 2','Generation '+generation).replace('/* MANIFEST */',JSON.stringify(manifest)));
  console.log(JSON.stringify({output:out,variants:manifest.variants.length,animations:manifest.animations.length}));
  app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
