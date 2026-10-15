const fs=require('node:fs'),path=require('node:path'),net=require('node:net'),{spawn}=require('node:child_process');
(async()=>{
  const root=path.resolve(__dirname,'..'),version=require('../package.json').version;
  const build=path.join(root,'dist',version,'Wildbound-win32-x64'),runtime=path.join(build,'forest-server-runtime');
  const out=path.join(root,'test-output','persistent-forest'),folder=fs.mkdtempSync(path.join(out,'portable-'));
  const {loadRealmConfig}=await import('../realm-server.mjs');
  const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));
  const port=probe.address().port;await new Promise(r=>probe.close(r));
  const config=loadRealmConfig(folder,{port,host:'127.0.0.1'});
  let matched=0;
  function compare(relative){
    for(const entry of fs.readdirSync(path.join(root,relative),{withFileTypes:true})){
      const file=path.join(relative,entry.name);
      if(entry.isDirectory())compare(file);else{if(!fs.readFileSync(path.join(root,file)).equals(fs.readFileSync(path.join(runtime,file))))throw Error('Stale external runtime: '+file);matched++;}
    }
  }
  compare('src');if(!fs.readFileSync(path.join(root,'realm-server.mjs')).equals(fs.readFileSync(path.join(runtime,'realm-server.mjs'))))throw Error('Stale external server.');
  const child=spawn(path.join(build,'Wildbound.exe'),[path.join(runtime,'realm-server.mjs'),'--save-dir',folder],{
    env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},windowsHide:true,cwd:build,stdio:['ignore','pipe','pipe']});
  let diagnostic='';child.stdout.on('data',()=>{});child.stderr.on('data',data=>diagnostic+=data);let childError;child.on('error',e=>childError=e);
  let online=false;
  try{
    for(let i=0;i<60;i++){
      if(childError)throw childError;
      if(child.exitCode!==null)throw Error('Packaged server exited: '+diagnostic);
      await new Promise(r=>setTimeout(r,100));
      try{const response=await fetch(`http://127.0.0.1:${port}/status`,{signal:AbortSignal.timeout(300)});const s=await response.json();if(s.id==='forest-test'){online=true;break;}}catch{}
    }
    if(!online)throw Error('Packaged executable server did not become available: '+diagnostic);
    const result={version,packagedExecutableNodeMode:true,externalRuntimeMatchedFiles:matched+1,saveCreated:fs.existsSync(path.join(folder,'forest.json'))};
    fs.writeFileSync(path.join(out,'portable-qa.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  }finally{
    if(online)await fetch(`http://127.0.0.1:${port}/stop`,{method:'POST',headers:{'x-creator-key':config.creatorKey}});
    else if(child.exitCode===null)child.kill();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
