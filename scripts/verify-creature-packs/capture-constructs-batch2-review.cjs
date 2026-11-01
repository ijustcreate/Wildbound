const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/constructs-art-review-batch2');
const baseline = path.join(root, 'test-output/creature-roster-engine/constructs-before-art-pass.png');
const targets = ['enchanted_book', 'crystal_golem', 'mindflayer'];
const sourceFiles = {
  enchanted_book: '106553-breezy-book-front-idle.png',
  crystal_golem: '188885-crystalline-mini-monster-front-idle.png',
  mindflayer: '161954-kuddly-front-idle.png',
};
fs.mkdirSync(output, { recursive: true });
if (!fs.existsSync(baseline)) throw new Error(`Missing before-pass renderer capture: ${baseline}`);
const sources = Object.fromEntries(Object.entries(sourceFiles).map(([kind, file]) => {
  const fullPath = path.join(root, 'test-output/modelviewer-references', file);
  if (!fs.existsSync(fullPath)) throw new Error(`Missing source screenshot: ${fullPath}`);
  return [kind, fs.readFileSync(fullPath).toString('base64')];
}));

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-construct-batch2-')));
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show:false, width:1280, height:900, webPreferences:{offscreen:true,backgroundThrottling:false} });
  win.webContents.setAudioMuted(true);
  const errors=[];
  win.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message);});
  try {
    await win.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
    await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const data=await win.webContents.executeJavaScript(`(async (baselineData,targetKinds,sourceData) => {
      const {CREATURE_PACK}=await import('./src/creature-packs/constructs.mjs');
      const dirs=['S','SW','W','NW','N','NE','E','SE'];
      const order=['blaise','voodoo_doll','enchanted_book','gargoyle','crystal_golem','skeleton_deckhand','ogre','jimothy','mindflayer','succubus_2','mana_golem','enchanted_broom','forest_golem'];
      const oldImg=new Image();oldImg.src='data:image/png;base64,'+baselineData;await oldImg.decode();
      const labelW=214,cellW=112,cellH=122,top=76,scale=2.3,rows=[];
      const sources={};
      for(const [kind,data] of Object.entries(sourceData)){const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();sources[kind]=image;}
      for(const kind of targetKinds){
        const row=order.indexOf(kind);if(row<0)throw Error('No old renderer row for '+kind);
        const before=document.createElement('canvas');before.width=cellW*8;before.height=cellH;
        const b=before.getContext('2d');b.imageSmoothingEnabled=false;b.drawImage(oldImg,labelW,top+row*cellH,before.width,cellH,0,0,before.width,cellH);
        const after=document.createElement('canvas');after.width=before.width;after.height=before.height;
        const c=after.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle=row%2?'#17372e':'#153329';c.fillRect(0,0,after.width,after.height);
        const subject=CREATURE_PACK.subjects[kind],model=subject.defaults();
        for(let f=0;f<8;f++){const angle=f*Math.PI/4;c.save();c.translate(f*cellW+cellW/2,84);c.scale(scale,scale);subject.draw(c,{id:'construct-batch2-'+kind+'-'+f,kind,sprite:kind,skin:kind,x:0,y:0,faceX:Math.sin(angle),faceY:Math.cos(angle),state:'idle',animationAction:'idle',playerFrame:0,moving:false,aggro:false,hp:100,maxHp:100,equipment:{},inventory:[]},0,model);c.restore();}
        const native=document.createElement('canvas');native.width=cellW*8;native.height=cellH;
        const n=native.getContext('2d');n.imageSmoothingEnabled=false;n.fillStyle='#10271f';n.fillRect(0,0,native.width,native.height);
        for(let f=0;f<8;f++){const angle=f*Math.PI/4;n.save();n.translate(f*cellW+cellW/2,84);subject.draw(n,{id:'construct-batch2-native-'+kind+'-'+f,kind,sprite:kind,skin:kind,x:0,y:0,faceX:Math.sin(angle),faceY:Math.cos(angle),state:'idle',animationAction:'idle',playerFrame:0,moving:false,aggro:false,hp:100,maxHp:100,equipment:{},inventory:[]},0,model);n.restore();}
        rows.push({kind,before,after,native,source:sources[kind],name:subject.name});
      }
      const card=document.createElement('canvas');card.width=2070;card.height=70+rows.length*184;
      const cc=card.getContext('2d');cc.imageSmoothingEnabled=false;cc.fillStyle='#10271f';cc.fillRect(0,0,card.width,card.height);
      cc.fillStyle='#eadbb5';cc.font='bold 21px system-ui';cc.fillText('CONSTRUCTS · SOURCE / BEFORE / AFTER · UNAPPROVED DRAFT',18,30);
      cc.fillStyle='#b9cbbf';cc.font='12px system-ui';cc.fillText('Same idle pose and facing order at matched renderer scale (2.3× enlargement); left thumbnails are source modelviewer captures.',18,50);
      for(let i=0;i<rows.length;i++){
        const r=rows[i],y=70+i*184;cc.fillStyle=i%2?'#17372e':'#153329';cc.fillRect(0,y,card.width,180);
        cc.fillStyle='#eadbb5';cc.font='bold 14px system-ui';cc.fillText(r.name+' · 8 facings',18,y+18);
        cc.fillStyle='#c6d4c8';cc.font='11px system-ui';cc.fillText('SOURCE · idle',18,y+34);cc.fillText('BEFORE · 2.3×',260,y+34);cc.fillText('AFTER · 2.3×',1160,y+34);
        const src=r.source,fit=Math.min(220/src.width,135/src.height),sw=src.width*fit,sh=src.height*fit;
        cc.drawImage(src,0,0,src.width,src.height,18+(220-sw)/2,y+39+(135-sh)/2,sw,sh);
        cc.drawImage(r.before,0,0,r.before.width,r.before.height,260,y+39,r.before.width,r.before.height);
        cc.drawImage(r.after,0,0,r.after.width,r.after.height,1160,y+39,r.after.width,r.after.height);
        for(let f=0;f<8;f++){cc.fillStyle='#a4b7a7';cc.font='9px system-ui';cc.textAlign='center';cc.fillText(dirs[f],260+f*cellW+cellW/2,y+173);cc.fillText(dirs[f],1160+f*cellW+cellW/2,y+173);}cc.textAlign='left';
      }
      return {card:card.toDataURL('image/png').split(',')[1],outputs:rows.map(r=>({kind:r.kind,after:r.after.toDataURL('image/png').split(',')[1],native:r.native.toDataURL('image/png').split(',')[1]})),dirs,scale};
    })(${JSON.stringify(fs.readFileSync(baseline).toString('base64'))},${JSON.stringify(targets)},${JSON.stringify(sources)})`);
    if(errors.length)throw Error('Renderer errors: '+errors.join('\n'));
    fs.writeFileSync(path.join(output,'constructs-batch2-source-before-after.png'),Buffer.from(data.card,'base64'));
    for(const item of data.outputs){fs.writeFileSync(path.join(output,`${item.kind}-after-8-directions.png`),Buffer.from(item.after,'base64'));fs.writeFileSync(path.join(output,`${item.kind}-after-native-8-directions.png`),Buffer.from(item.native,'base64'));}
    const report={targets,directions:data.dirs,scale:data.scale,baseline,sources:sourceFiles,outputs:['constructs-batch2-source-before-after.png',...targets.flatMap(k=>[`${k}-after-8-directions.png`,`${k}-after-native-8-directions.png`])],audioMuted:win.webContents.isAudioMuted(),rendererErrors:errors.length};
    fs.writeFileSync(path.join(output,'capture-report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({output,report}));
  } catch(error){console.error(error.stack||error);process.exitCode=1;}
  finally{win.destroy();app.quit();}
});
