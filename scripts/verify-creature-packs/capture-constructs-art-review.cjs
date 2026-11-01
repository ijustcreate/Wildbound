const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/constructs-art-review');
const baseline = path.join(root, 'test-output/creature-roster-engine/constructs.png');
const targets = ['voodoo_doll', 'jimothy', 'mana_golem'];
fs.mkdirSync(output, { recursive: true });
if (!fs.existsSync(baseline)) throw new Error(`Missing pre-pass engine baseline: ${baseline}`);
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-construct-art-')));
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show:false,width:1280,height:900,webPreferences:{offscreen:true,backgroundThrottling:false} });
  window.webContents.setAudioMuted(true);
  const errors=[];
  window.webContents.on('console-message',(_event,level,message)=>{ if(level>=3) errors.push(message); });
  try {
    await window.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
    await window.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const data=await window.webContents.executeJavaScript(`(async (baselineData, targetKinds) => {
      const { CREATURE_PACK } = await import('./src/creature-packs/constructs.mjs');
      const directions=['S','SW','W','NW','N','NE','E','SE'];
      const labelW=214,cellW=112,cellH=122,top=76,scale=2.3;
      const oldImage=new Image(); oldImage.src='data:image/png;base64,'+baselineData; await oldImage.decode();
      const order=['blaise','voodoo_doll','enchanted_book','gargoyle','crystal_golem','skeleton_deckhand','ogre','jimothy','mindflayer','succubus_2','mana_golem','enchanted_broom','forest_golem'];
      const rowCanvases=[];
      for(const kind of targetKinds){
        const beforeRow=order.indexOf(kind); if(beforeRow<0) throw Error('Baseline row missing '+kind);
        const before=document.createElement('canvas'); before.width=cellW*8; before.height=cellH;
        const bctx=before.getContext('2d'); bctx.imageSmoothingEnabled=false;
        bctx.drawImage(oldImage,labelW,top+beforeRow*cellH,cellW*8,cellH,0,0,cellW*8,cellH);
        const after=document.createElement('canvas'); after.width=cellW*8; after.height=cellH;
        const ctx=after.getContext('2d'); ctx.imageSmoothingEnabled=false; ctx.fillStyle=beforeRow%2?'#17372e':'#153329'; ctx.fillRect(0,0,after.width,after.height);
        for(let d=0;d<8;d++){
          const angle=d*Math.PI/4; ctx.save();ctx.translate(d*cellW+cellW/2,84);ctx.scale(scale,scale);
          CREATURE_PACK.subjects[kind].draw(ctx,{id:'review-'+kind+'-'+d,kind,sprite:kind,skin:kind,x:0,y:0,faceX:Math.sin(angle),faceY:Math.cos(angle),state:'idle',animationAction:'idle',playerFrame:0,moving:false,aggro:false,hp:100,maxHp:100,equipment:{},inventory:[]},0,CREATURE_PACK.subjects[kind].defaults());ctx.restore();
        }
        rowCanvases.push({kind,before,after});
      }
      const card=document.createElement('canvas');card.width=1890;card.height=60+targetKinds.length*170;
      const c=card.getContext('2d'); c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,card.width,card.height);
      c.fillStyle='#eadbb5';c.font='bold 21px system-ui';c.fillText('CONSTRUCTS · SAME-SCALE BEFORE / AFTER · UNAPPROVED ART DRAFT',18,30);
      for(let i=0;i<rowCanvases.length;i++){
        const {kind,before,after}=rowCanvases[i],y=60+i*170;
        c.fillStyle=i%2?'#17372e':'#153329';c.fillRect(0,y,card.width,164);
        c.fillStyle='#eadbb5';c.font='bold 15px system-ui';c.fillText(CREATURE_PACK.subjects[kind].name+'  ·  8 facings',18,y+18);
        c.fillStyle='#c6d4c8';c.font='12px system-ui';c.fillText('BEFORE',18,y+41);c.fillText('AFTER',958,y+41);
        c.drawImage(before,0,0,before.width,before.height,18,y+45,before.width,before.height);
        c.drawImage(after,0,0,after.width,after.height,958,y+45,after.width,after.height);
        for(let d=0;d<8;d++) { c.fillStyle='#a4b7a7';c.font='10px system-ui';c.textAlign='center';c.fillText(directions[d],18+d*cellW+cellW/2,y+161);c.fillText(directions[d],958+d*cellW+cellW/2,y+161); }
        c.textAlign='left';
      }
      return {card:card.toDataURL('image/png').split(',')[1],after:rowCanvases.map(({kind,after})=>({kind,png:after.toDataURL('image/png').split(',')[1]})),directions,scale};
    })(${JSON.stringify(fs.readFileSync(baseline).toString('base64'))},${JSON.stringify(targets)})`);
    if(errors.length) throw Error('Renderer errors: '+errors.join('\n'));
    fs.writeFileSync(path.join(output,'constructs-focus-before-after.png'),Buffer.from(data.card,'base64'));
    for(const subject of data.after) fs.writeFileSync(path.join(output,`${subject.kind}-after-8-directions.png`),Buffer.from(subject.png,'base64'));
    const report={targets,directions:data.directions,scale:data.scale,baseline,outputs:['constructs-focus-before-after.png',...targets.map(k=>`${k}-after-8-directions.png`)],audioMuted:window.webContents.isAudioMuted(),rendererErrors:errors.length};
    fs.writeFileSync(path.join(output,'capture-report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({output,report}));
  } catch(error) { console.error(error.stack||error); process.exitCode=1; }
  finally { window.destroy(); app.quit(); }
});
