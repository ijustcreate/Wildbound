const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'test-output/squirrel-wow-motion-transfer');
const stage = process.env.SQUIRREL_MOTION_STAGE || 'before';
const sourceImageNames = ['front-idle','side-idle','rear-idle','opposite-side-idle'];
const sourceImages = Object.fromEntries(sourceImageNames.map(label => [label,
  fs.readFileSync(path.join(root,'test-output/modelviewer-references',`61081-squirrel-${label}.png`)).toString('base64')]));
if (!['before', 'after'].includes(stage)) throw Error('Set SQUIRREL_MOTION_STAGE=before or after');
fs.mkdirSync(out, { recursive: true });
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-squirrel-motion-')));

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1560, height: 1080, webPreferences: { offscreen: true, backgroundThrottling: false } });
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  try {
    await win.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const before = stage === 'after' ? JSON.parse(fs.readFileSync(path.join(out, 'before.json'), 'utf8')) : null;
    const model = await win.webContents.executeJavaScript(`(async()=>{
      const { CREATURE_PACK }=await import('./src/creature-packs/wildlife.mjs');
      const subject=CREATURE_PACK.subjects.squirrel,model=subject.defaults();
      const dirs=['S','SW','W','NW','N','NE','E','SE'];
      const directions=dirs.map((label,i)=>({label,faceX:Math.sin(i*Math.PI/4),faceY:-Math.cos(i*Math.PI/4)}));
      const art=document.createElement('canvas');art.width=1040;art.height=340;const c=art.getContext('2d');c.imageSmoothingEnabled=false;
      c.fillStyle='#10271f';c.fillRect(0,0,art.width,art.height);c.fillStyle='#f2e4c4';c.font='bold 18px system-ui';c.fillText('SQUIRREL · '+${JSON.stringify(stage.toUpperCase())}+' · NATIVE GAME PIXEL ART',16,24);
      const cells=[];
      for(let i=0;i<8;i++){
        const d=directions[i],a={id:'squirrel-view-'+i,kind:'squirrel',sprite:'squirrel',x:0,y:0,faceX:d.faceX,faceY:d.faceY,state:'idle',animationAction:'idle',playerFrame:0,moving:false,hp:22,maxHp:22,equipment:{}};
        c.fillStyle='#b6c9bc';c.font='bold 12px system-ui';c.textAlign='center';c.fillText(d.label,64+i*128,50);
        c.save();c.translate(64+i*128,136);c.scale(1.8,1.8);subject.draw(c,a,0,model);c.restore();
        cells.push({direction:d.label,actor:a});
      }
      c.textAlign='left';c.fillStyle='#ddc99c';c.font='11px system-ui';c.fillText('NATIVE PIXELS · same actor scale',16,175);
      const actions=['freeze','walk','scamper','leap'];
      const sampleFractions=[0,.25,.5,.75];
      const motion=document.createElement('canvas');motion.width=1360;motion.height=390;const m=motion.getContext('2d');m.imageSmoothingEnabled=false;
      m.fillStyle='#10271f';m.fillRect(0,0,motion.width,motion.height);m.fillStyle='#f2e4c4';m.font='bold 18px system-ui';m.fillText('MUTED ELECTRON · SQUIRREL MOTION PREVIEW · '+${JSON.stringify(stage.toUpperCase())},16,24);
      const animationRows=[];
      for(let r=0;r<actions.length;r++){
        const action=actions[r],clip=model.clips[action];m.fillStyle='#e4d3af';m.font='bold 12px system-ui';m.fillText(({freeze:'STAND',walk:'WALK',scamper:'RUN',leap:'LEAP'})[action],14,58+r*84);
        const frameIndices=sampleFractions.map(q=>Math.round(q*Math.max(0,clip.length-1)));
        for(let f=0;f<4;f++){
          const frame=frameIndices[f],x=192+f*286;
          m.fillStyle='#9eb9aa';m.textAlign='center';m.font='10px system-ui';m.fillText('frame '+frame+' / '+(clip.length-1),x,58+r*84);
          for(let d=0;d<2;d++){
            const facing=d?2:0,a={id:'motion-'+action+'-'+frame+'-'+d,kind:'squirrel',sprite:'squirrel',x:0,y:0,faceX:Math.sin(facing*Math.PI/4),faceY:-Math.cos(facing*Math.PI/4),state:action,animationAction:action,playerFrame:frame,moving:action==='walk'||action==='scamper',step:frame*14,equipment:{}};
            m.save();m.translate(x+(d?34:-34),115+r*84);m.scale(1.45,1.45);subject.draw(m,a,0,model);m.restore();
          }
        }
        animationRows.push({action,frames:frameIndices});
      }
      m.textAlign='left';
      return { art:art.toDataURL('image/png').split(',')[1], motion:motion.toDataURL('image/png').split(',')[1], directions, animationRows, source:{npc:61081,fileDataId:1129448,referenceCaptures:['front-idle','side-idle','rear-idle','opposite-side-idle']} };
    })()`);
    if (errors.length) throw Error(errors.join('\n'));
    const jsonPath = path.join(out, `${stage}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(model, null, 2));
    fs.writeFileSync(path.join(out, `${stage}-views.png`), Buffer.from(model.art, 'base64'));
    fs.writeFileSync(path.join(out, `${stage}-motion.png`), Buffer.from(model.motion, 'base64'));
    if (stage === 'after') {
      const afterViews = await win.webContents.executeJavaScript(`(async()=>{
        const labels=${JSON.stringify(sourceImageNames)},sourceImages=${JSON.stringify(sourceImages)};
        const refs=[];for(const label of labels){const image=new Image();image.src='data:image/png;base64,'+sourceImages[label];await new Promise((r,j)=>{image.onload=r;image.onerror=j});refs.push(image);}
        const {CREATURE_PACK}=await import('./src/creature-packs/wildlife.mjs');
        const subject=CREATURE_PACK.subjects.squirrel;
        const after=subject.defaults();
        const nativeClip=(action)=>{
          const names=Object.keys(after.joints),frames=action==='scamper'?8:action==='walk'?8:8;
          return {fps:action==='scamper'?14:7,length:frames,loop:true,keys:Array.from({length:frames},(_,frame)=>{
            const phase=frame/frames*Math.PI*2,wave=Math.sin(phase),joints=Object.fromEntries(names.map(name=>[name,[0,0,0]]));
            if(action==='scamper'){
              const lift=Math.max(0,wave),gather=Math.max(0,-wave),reach=(1-wave)*.5;
              joints.pelvis=[0,0,2+lift*17-gather*4];joints.chest=[0,0,lift*6-gather*1.8];joints.neck=[0,0,lift*2];joints.head=[0,0,-lift*2.2];
              for(const [side,sign] of [['L',1],['R',-1]]){joints['hip'+side]=[0,-gather*2.5,0];joints['knee'+side]=[0,sign*(2+lift*3+reach*2),lift*3-gather*2];joints['rearPaw'+side]=[0,-sign*(2+lift*3),lift*5-gather*2];joints['shoulder'+side]=[0,sign*lift*1.3,0];joints['elbow'+side]=[0,-sign*(1+reach*4),lift*2.6];joints['frontPaw'+side]=[0,-sign*(3+reach*5),lift*4+reach*2];}
              joints.tailBase=[0,0,1+lift*3];joints.tailMid=[Math.sin(phase-.45)*8,0,lift*14-gather*4];joints.tailTip=[Math.sin(phase-.9)*13,0,lift*22-gather*5];
            } else if(action==='freeze'){
              const twitch=Math.sin(phase*2);joints.pelvis=[0,0,-2];joints.chest=[0,0,-1];joints.head=[0,0,1+twitch*.25];joints.earL=[0,0,Math.max(0,twitch)*.5];joints.earR=[0,0,Math.max(0,-twitch)*.5];
              for(const side of ['L','R']){joints['hip'+side]=[0,0,-1];joints['knee'+side]=[0,2,-1];joints['rearPaw'+side]=[0,-2,0];joints['shoulder'+side]=[0,-1,0];joints['elbow'+side]=[0,1,-1];joints['frontPaw'+side]=[0,2,-2];}joints.tailBase=[0,0,1];joints.tailMid=[twitch*.6,0,2+Math.max(0,twitch)*2];joints.tailTip=[twitch,0,3+Math.max(0,twitch)*3];
            } else {for(const [side,sign] of [['L',1],['R',-1]]){joints.frontPawL=[0,wave*4,Math.max(0,wave)*2.4];joints.frontPawR=[0,-wave*4,Math.max(0,-wave)*2.4];joints.rearPawL=[0,-wave*4,Math.max(0,-wave)*2.4];joints.rearPawR=[0,wave*4,Math.max(0,wave)*2.4];}}
            return {frame,joints};
          })};
        };
        const beforeModel={...after,clips:{...after.clips,freeze:nativeClip('freeze'),walk:nativeClip('walk'),scamper:nativeClip('scamper')}};
        const renderViews=(which)=>{const canvas=document.createElement('canvas');canvas.width=1040;canvas.height=340;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#f2e4c4';c.font='bold 18px system-ui';c.fillText('SQUIRREL · '+which+' · NATIVE GAME PIXEL ART',16,24);for(let i=0;i<8;i++){const label=['S','SW','W','NW','N','NE','E','SE'][i],a={id:'compare-'+which+'-'+i,kind:'squirrel',sprite:'squirrel',x:0,y:0,faceX:Math.sin(i*Math.PI/4),faceY:-Math.cos(i*Math.PI/4),state:'idle',animationAction:'freeze',playerFrame:0,moving:false,hp:22,maxHp:22,equipment:{}};c.fillStyle='#b6c9bc';c.font='bold 12px system-ui';c.textAlign='center';c.fillText(label,64+i*128,50);c.save();c.translate(64+i*128,136);c.scale(1.8,1.8);subject.draw(c,a,0,which==='BEFORE · AUTHORED' ? beforeModel : after);c.restore();}c.textAlign='left';c.fillStyle='#ddc99c';c.font='11px system-ui';c.fillText('SAME CURRENT ART + SAME SCALE · clip frame 0',16,175);return canvas;};
        const canvas=document.createElement('canvas');canvas.width=1860;canvas.height=760;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);
        c.fillStyle='#f2e4c4';c.font='bold 21px system-ui';c.fillText('SQUIRREL · DONOR MOTION TRANSFER · UNAPPROVED DRAFT',16,28);
        c.fillStyle='#afc4b7';c.font='12px system-ui';c.fillText('Wowhead NPC 61081 stand turnarounds shown as source references; native Wildbound pixels remain editable. Same scale and eight facings before/after.',16,50);
        for(let i=0;i<2;i++){const image=renderViews(i?'AFTER · DONOR':'BEFORE · AUTHORED');c.fillStyle='#e2c996';c.font='bold 12px system-ui';c.fillText(i?'AFTER · DONOR STAND TRACK':'BEFORE · NATIVE AUTHORED CLIP',16+i*920,75);c.drawImage(image,16+i*920,84,920,300);}
        c.fillStyle='#e2c996';c.font='bold 12px system-ui';c.fillText('WOWHEAD 3D MODEL · SOURCE STAND · NPC 61081',16,415);
        for(let i=0;i<4;i++){c.fillStyle='#18372e';c.fillRect(16+i*260,430,244,250);c.drawImage(refs[i],16+i*260,430,244,224);c.fillStyle='#e2c996';c.font='11px system-ui';c.fillText(labels[i].replace('-idle','').toUpperCase(),24+i*260,672);}
        return canvas.toDataURL('image/png').split(',')[1];
      })()`);
      fs.writeFileSync(path.join(out,'before-after-source.png'),Buffer.from(afterViews,'base64'));
      const motionBoard = await win.webContents.executeJavaScript(`(async()=>{
        const {CREATURE_PACK}=await import('./src/creature-packs/wildlife.mjs');const subject=CREATURE_PACK.subjects.squirrel,after=subject.defaults();
        const nativeClip=(action)=>{const names=Object.keys(after.joints),frames=8;return {fps:action==='scamper'?14:7,length:frames,loop:true,keys:Array.from({length:frames},(_,frame)=>{const phase=frame/frames*Math.PI*2,wave=Math.sin(phase),joints=Object.fromEntries(names.map(name=>[name,[0,0,0]]));if(action==='scamper'){const lift=Math.max(0,wave),gather=Math.max(0,-wave),reach=(1-wave)*.5;joints.pelvis=[0,0,2+lift*17-gather*4];joints.chest=[0,0,lift*6-gather*1.8];joints.neck=[0,0,lift*2];joints.head=[0,0,-lift*2.2];for(const[side,sign]of[['L',1],['R',-1]]){joints['hip'+side]=[0,-gather*2.5,0];joints['knee'+side]=[0,sign*(2+lift*3+reach*2),lift*3-gather*2];joints['rearPaw'+side]=[0,-sign*(2+lift*3),lift*5-gather*2];joints['shoulder'+side]=[0,sign*lift*1.3,0];joints['elbow'+side]=[0,-sign*(1+reach*4),lift*2.6];joints['frontPaw'+side]=[0,-sign*(3+reach*5),lift*4+reach*2];}joints.tailBase=[0,0,1+lift*3];joints.tailMid=[Math.sin(phase-.45)*8,0,lift*14-gather*4];joints.tailTip=[Math.sin(phase-.9)*13,0,lift*22-gather*5];}else if(action==='freeze'){const twitch=Math.sin(phase*2);joints.pelvis=[0,0,-2];joints.chest=[0,0,-1];joints.head=[0,0,1+twitch*.25];joints.earL=[0,0,Math.max(0,twitch)*.5];joints.earR=[0,0,Math.max(0,-twitch)*.5];for(const side of['L','R']){joints['hip'+side]=[0,0,-1];joints['knee'+side]=[0,2,-1];joints['rearPaw'+side]=[0,-2,0];joints['shoulder'+side]=[0,-1,0];joints['elbow'+side]=[0,1,-1];joints['frontPaw'+side]=[0,2,-2];}joints.tailBase=[0,0,1];joints.tailMid=[twitch*.6,0,2+Math.max(0,twitch)*2];joints.tailTip=[twitch,0,3+Math.max(0,twitch)*3];}else{for(const side of['L','R']){joints['frontPaw'+side]=[0,wave*4,Math.max(0,wave)*2.4];joints['rearPaw'+side]=[0,-wave*4,Math.max(0,-wave)*2.4];}}return{frame,joints};})};};
        const before={...after,clips:{...after.clips,freeze:nativeClip('freeze'),walk:nativeClip('walk'),scamper:nativeClip('scamper')}};
        const drawMotion=(rig)=>{const canvas=document.createElement('canvas');canvas.width=1360;canvas.height=430;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#f2e4c4';c.font='bold 18px system-ui';c.fillText('MUTED ELECTRON · SAME NATIVE SQUIRREL PIXELS · '+(rig===before?'AUTHORED':'DONOR'),16,24);for(let row=0;row<4;row++){const action=['freeze','walk','scamper','leap'][row],clip=rig.clips[action];c.fillStyle='#e4d3af';c.font='bold 12px system-ui';c.fillText(['STAND','WALK','RUN','LEAP'][row],14,58+row*84);for(let phase=0;phase<4;phase++){const frame=Math.round(phase*.25*Math.max(0,clip.length-1)),x=192+phase*286;c.fillStyle='#9eb9aa';c.textAlign='center';c.font='10px system-ui';c.fillText('frame '+frame+' / '+(clip.length-1),x,58+row*84);for(let d=0;d<2;d++){const facing=d?2:0,a={id:'same-art-'+action+'-'+frame+'-'+d,kind:'squirrel',sprite:'squirrel',x:0,y:0,faceX:Math.sin(facing*Math.PI/4),faceY:-Math.cos(facing*Math.PI/4),state:action,animationAction:action,playerFrame:frame,moving:action==='walk'||action==='scamper',step:frame*14,equipment:{}};c.save();c.translate(x+(d?34:-34),115+row*84);c.scale(1.45,1.45);subject.draw(c,a,0,rig);c.restore();}}}c.textAlign='left';return canvas;};
        const board=document.createElement('canvas');board.width=2800;board.height=990;const c=board.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,board.width,board.height);c.fillStyle='#f2e4c4';c.font='bold 21px system-ui';c.fillText('SQUIRREL MOTION · SAME CURRENT PIXELS / SCALE · BEFORE / AFTER · UNAPPROVED',18,28);for(let i=0;i<2;i++){const image=drawMotion(i?after:before);c.fillStyle='#e2c996';c.font='bold 14px system-ui';c.fillText(i?'AFTER · WOWHEAD STAND/WALK/RUN, CUSTOM LEAP':'BEFORE · AUTHORED WILDBOUND CLIPS',18+i*1400,56);c.drawImage(image,18+i*1400,70,1360,860);}return board.toDataURL('image/png').split(',')[1];
      })()`);
      fs.writeFileSync(path.join(out,'before-after-motion.png'),Buffer.from(motionBoard,'base64'));
    }
    console.log(JSON.stringify({stage,output:out,sourceNpc:61081,sourceModelFile:1129448,renderer:'muted Electron',directions:8,errors:0}));
  } catch(error) { console.error(error.stack||error); process.exitCode=1; }
  finally { win.destroy(); app.quit(); }
});
