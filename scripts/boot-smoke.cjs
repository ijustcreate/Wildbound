const fs=require('node:fs/promises'),path=require('node:path');
module.exports=async({window,testOutput,app})=>{
  const errors=[];
  window.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message);});
  try{
    await window.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Boot timed out')),30000))])`);
    const state=await window.webContents.executeJavaScript(`({title:document.title,bootError:window.wildboundBoot.error,game:window.wildboundWorldsTest?.inspect(),worlds:!!document.getElementById('worlds-button'),audioMutedTest:window.desktop.testMode})`);
    const failed=state.bootError||!state.game?.ready||state.game?.errors.length||!state.worlds||errors.length?1:0;
    const report={failed,exe:app.getPath('exe'),appPath:app.getAppPath(),version:app.getVersion(),state,errors};
    await fs.mkdir(testOutput,{recursive:true});
    await fs.writeFile(path.join(testOutput,'boot-smoke.json'),JSON.stringify(report,null,2));
    await fs.writeFile(path.join(testOutput,'boot-smoke.png'),(await window.webContents.capturePage()).toPNG());
    console.log(JSON.stringify(report));app.exit(failed);
  }catch(error){await fs.mkdir(testOutput,{recursive:true});await fs.writeFile(path.join(testOutput,'boot-smoke.json'),JSON.stringify({failed:1,error:error.stack,errors},null,2));console.error(error);app.exit(1);}
};
