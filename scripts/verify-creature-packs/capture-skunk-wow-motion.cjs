const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/skunk-wow-motion-transfer');
fs.mkdirSync(output, { recursive: true });
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-skunk-motion-')));

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show:false, width:1600, height:1150, webPreferences:{offscreen:true,backgroundThrottling:false} });
  win.webContents.setAudioMuted(true);
  const errors=[];
  win.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message);});
  try {
    await win.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
    await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const {CREATURE_PACK}=await import('./src/creature-packs/wildlife.mjs');
      const subject=CREATURE_PACK.subjects.skunk,after=subject.defaults(),before=subject.defaults();
      const dirs=['S','SW','W','NW','N','NE','E','SE'], phases=[0,.25,.5,.75];
      const generic=(action)=>{
        const frames=action==='idle'?8:action==='attack'?6:8,loop=action!=='attack',names=Object.keys(before.joints);
        return {fps:loop?10:16,length:frames,loop,keys:Array.from({length:frames},(_,frame)=>{
          const t=frame/Math.max(1,frames-1),phase=t*Math.PI*2,joints=Object.fromEntries(names.map(name=>[name,[0,0,0]])),wave=Math.sin(phase),pulse=Math.sin(t*Math.PI);
          if(['walk','run'].includes(action)){
            const stride=action==='run'?6:4;
            for(const [side,sign] of [['L',1],['R',-1]]){
              joints['frontPaw'+side]=[0,wave*stride*sign,Math.max(0,wave*sign)*2.4];
              joints['rearPaw'+side]=[0,-wave*stride*sign,Math.max(0,-wave*sign)*2.4];
            }
            joints.pelvis=[0,0,Math.abs(wave)*.8];joints.head=[0,0,-Math.abs(wave)*.25];
            for(const tail of ['tailMid','tailTip'])joints[tail]=[Math.sin(phase-.6)*2,0,Math.sin(phase-.9)*1.5];
          }
          if(action==='attack'){joints.chest=[0,pulse*4,pulse*2];joints.head=[0,pulse*8,pulse*2];for(const name of ['frontPawL','frontPawR'])joints[name]=[0,pulse*7,pulse*5];}
          return {frame,joints};
        })};
      };
      // Reconstruct the pack's former generic idle/walk/run/attack tracks
      // from wildlife.mjs's pre-transfer clip formula for a like-for-like view.
      before.clips.idle=generic('idle');before.clips.amble=generic('walk');before.clips.run=generic('run');before.clips.attack=generic('attack');
      const canvas=document.createElement('canvas');canvas.width=1560;canvas.height=1050;
      const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);
      c.fillStyle='#f1e4c8';c.font='bold 19px system-ui';c.fillText('HIGHLANDS SKUNK · DONOR MOTION REVIEW · UNAPPROVED',18,27);
      c.fillStyle='#b4c8ba';c.font='12px system-ui';c.fillText('Muted Electron renderer · current editable pixels · 8 facings × four phases · left = reconstructed native, right = Wowhead donor tracks',18,49);
      const panels=[
        {name:'BEFORE · NATIVE',model:before,rows:[['idle','IDLE'],['amble','WALK'],['run','RUN'],['attack','ATTACK']]},
        {name:'AFTER · DONOR',model:after,rows:[['freeze','STAND · ID 0'],['amble','WALK · ID 4'],['scurry','RUN · ID 5'],['attack','ATTACK · ID 16']]},
      ];
      for(let panel=0;panel<2;panel++){
        const {name,model,rows}=panels[panel],x0=panel*780;
        c.fillStyle='#dfcfaa';c.font='bold 14px system-ui';c.fillText(name,x0+16,80);
        for(let d=0;d<8;d++){c.fillStyle='#b9ccbd';c.font='bold 10px system-ui';c.textAlign='center';c.fillText(dirs[d],x0+100+d*83,101);}
        rows.forEach(([action,label],r)=>{
          const clip=model.clips[action],rowY=118+r*220;c.textAlign='left';c.fillStyle='#d9cba9';c.font='bold 10px system-ui';c.fillText(label,x0+12,rowY+17);
          phases.forEach((phaseIndex,p)=>{
            const y=rowY+31+p*45;c.fillStyle='#91b49f';c.font='9px system-ui';c.fillText(Math.round(phases[p]*100)+'%',x0+12,y+18);
            dirs.forEach((_,d)=>{
              const actor={id:'skunk-'+panel+'-'+action+'-'+p+'-'+d,kind:'skunk',sprite:'skunk',x:0,y:0,faceX:Math.sin(d*Math.PI/4),faceY:-Math.cos(d*Math.PI/4),state:action,animationAction:action,playerFrame:Math.round(phases[p]*Math.max(0,clip.length-1)),moving:action!=='idle'&&action!=='freeze',step:p*19,equipment:{}};
              c.save();c.translate(x0+100+d*83,y+25);c.scale(1.2,1.2);subject.draw(c,actor,0,model);c.restore();
            });
          });
          c.strokeStyle='#254438';c.beginPath();c.moveTo(x0+8,rowY+216);c.lineTo(x0+770,rowY+216);c.stroke();
        });
      }
      const preview=document.createElement('canvas');preview.width=1280;preview.height=500;
      const m=preview.getContext('2d');m.imageSmoothingEnabled=false;m.fillStyle='#10271f';m.fillRect(0,0,1280,500);
      m.fillStyle='#f1e4c8';m.font='bold 19px system-ui';m.fillText('MUTED ELECTRON · SKUNK DONOR MOTION · DRAFT',18,28);
      m.fillStyle='#b4c8ba';m.font='12px system-ui';m.fillText('Current pixel art · rows sample each clip at 0 / 25 / 50 / 75%; columns S / SW / W / NW / N / NE / E / SE.',18,50);
      for(let r=0;r<4;r++){
        const action=['freeze','amble','scurry','spray-warning'][r],clip=after.clips[action];
        m.fillStyle='#d9cba9';m.font='bold 12px system-ui';m.fillText(['STAND · SOURCE ID 0','WALK · SOURCE ID 4','RUN · SOURCE ID 5','NATIVE SPRAY WARNING'][r],15,95+r*98);
        for(let d=0;d<8;d++){
          m.fillStyle='#aabdae';m.textAlign='center';m.font='10px system-ui';m.fillText(dirs[d],100+d*155,76+r*98);
          const phase=.5,frame=Math.round(phase*Math.max(0,clip.length-1));
          const actor={id:'skunk-preview-'+action+'-'+d,kind:'skunk',sprite:'skunk',x:0,y:0,faceX:Math.sin(d*Math.PI/4),faceY:-Math.cos(d*Math.PI/4),state:action,animationAction:action,playerFrame:frame,moving:action==='amble'||action==='scurry',step:frame*14,equipment:{}};
          m.save();m.translate(100+d*155,132+r*98);m.scale(1.5,1.5);subject.draw(m,actor,0,after);m.restore();
        }
      }
      return {comparison:canvas.toDataURL('image/png').split(',')[1],preview:preview.toDataURL('image/png').split(',')[1],clipLengths:Object.fromEntries(Object.entries(after.clips).filter(([key])=>['freeze','amble','scurry','attack','spray-warning'].includes(key)).map(([key,value])=>[key,value.length]))};
    })()`);
    if(errors.length)throw Error(errors.join('\n'));
    fs.writeFileSync(path.join(output,'before-after-eight-facings.png'),Buffer.from(result.comparison,'base64'));
    fs.writeFileSync(path.join(output,'muted-electron-motion-preview.png'),Buffer.from(result.preview,'base64'));
    fs.writeFileSync(path.join(output,'capture.json'),JSON.stringify({sourceNpc:62907,fileDataId:125956,renderer:'muted Electron; wildlife pack subject.draw',audioMuted:true,facings:8,phases:[0,.25,.5,.75],clipLengths:result.clipLengths,errors},null,2));
    console.log(JSON.stringify({output,renderer:'muted Electron',audioMuted:true,facings:8,phases:[0,.25,.5,.75],errors:0}));
  }catch(error){console.error(error.stack||error);process.exitCode=1;}
  finally{win.destroy();app.quit();}
});
