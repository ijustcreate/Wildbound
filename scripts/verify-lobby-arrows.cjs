const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'lobby-arrows-profile'));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1100,height:800});
  try{
    const base=process.argv.includes('--packaged')?path.join(root,'dist',require('../package.json').version,'Wildbound-win32-x64/resources/app.asar'):root;
    await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const {LobbyPractice}=await import('./src/lobby-practice.mjs'),{PlayableLobby}=await import('./src/playable-lobby.mjs');
      const practice=new LobbyPractice(),canvas=document.createElement('canvas');canvas.width=1024;canvas.height=620;
      const lobby=Object.create(PlayableLobby.prototype);Object.assign(lobby,{canvas,practice,getGame:()=>({players:[]}),difficultyArt:new Image(),mapArt:new Image()});
      const shot=(x,y,vx=300,vy=0)=>({x,y,vx,vy,z:18,vz:0,angle:Math.atan2(vy,vx),damage:12,embedDepth:9,owner:999});
      practice.arrows.push(shot(570,168),shot(720,168),shot(690,380),shot(880,165),shot(870,512),shot(560,535),shot(960,300),shot(280,165,0,-300),{...shot(350,450),z:1,vz:-10});
      for(let n=0;n<30;n++)practice.tickAdventure(.02,{});
      const c=canvas.getContext('2d');lobby.drawPractice(c);
      const marks=[...practice.loot,...practice.arrows];
      if(marks.length!==9)throw Error('Expected nine persistent impacts');
      for(const a of marks){
        const x=Math.max(0,Math.floor(a.x-30)),y=Math.max(0,Math.floor(a.y-(a.z||0)-30));
        const pixels=c.getImageData(x,y,60,60).data;let painted=0;
        for(let i=3;i<pixels.length;i+=4)if(pixels[i])painted++;
        if(painted<10)throw Error('Invisible embedded arrow at '+a.x+','+a.y);
      }
      lobby.draw();return {png:canvas.toDataURL(),impacts:marks.length};
    })()`);
    fs.writeFileSync(path.join(out,'lobby-embedded-arrows.png'),Buffer.from(result.png.split(',')[1],'base64'));
    console.log('PASS: '+result.impacts+' arrow impacts persist and paint in the lobby.');app.exit(0);
  }catch(error){console.error(error);app.exit(1);}
});
