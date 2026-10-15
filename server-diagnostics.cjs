const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {execFileSync}=require('node:child_process');

function createDiagnostics(directory,{root,secrets=[]}={}){
  const file=path.join(directory,'dashboard-history.jsonl');
  const redact=value=>{let text=String(value??'').slice(0,2000);for(const secret of secrets)if(secret)text=text.split(secret).join('[redacted]');return text.replace(/\b[a-f0-9]{64}\b/gi,'[redacted]').replace(/[A-Z]:[\\/]Users[\\/][^\\/\s]+/gi,'%USERPROFILE%').replace(/(?:https?|wss?):\/\/[^\s]+/gi,'[address omitted]').replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g,'[address omitted]');};
  let previous=null,lastRecord=0;
  function append(record){
    fs.mkdirSync(directory,{recursive:true});
    if(fs.existsSync(file)&&fs.statSync(file).size>512*1024){fs.copyFileSync(file,file+'.previous');fs.writeFileSync(file,'');}
    fs.appendFileSync(file,JSON.stringify({at:new Date().toISOString(),...record})+'\n');
  }
  function status(data){
    const safe={type:'status',instanceId:String(data.instanceId??'').slice(0,80),localHealth:data.localHealth===true,publicHealth:data.publicHealth===true};
    for(const key of ['playerCount','rosterCount','uptimeSeconds','tick','worldSeed','authorityCount','tunnelCount'])if(Number.isFinite(data[key]))safe[key]=data[key];
    safe.lastSave=typeof data.lastSave==='string'?data.lastSave.slice(0,40):null;
    // IDs only: no explorer names, credentials, addresses or world contents.
    safe.playerIds=Array.isArray(data.players)?data.players.map(p=>p.id).filter(Number.isFinite).slice(0,6):[];
    for(const key of ['fault','saveError','tunnelError'])if(data[key])safe[key]=redact(data[key]);
    const signature=JSON.stringify([safe.instanceId,safe.localHealth,safe.publicHealth,safe.playerIds,safe.fault,safe.saveError,safe.tunnelError]);
    if(signature!==previous||Date.now()-lastRecord>=30000){append(safe);previous=signature;lastRecord=Date.now();}
  }
  function event(type,message){append({type:String(type).slice(0,40),message:redact(message)});}
  function report(){
    const history=[];
    for(const source of [file+'.previous',file])if(fs.existsSync(source))for(const line of fs.readFileSync(source,'utf8').split('\n')){try{if(line)history.push(JSON.parse(line));}catch{}}
    let source={available:false};
    try{const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',timeout:3000,windowsHide:true,stdio:['ignore','pipe','ignore']}).trim();source={commit:git('rev-parse','HEAD'),branch:git('branch','--show-current'),modified:!!git('status','--porcelain','--untracked-files=no')};}catch{}
    let build=null;try{const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;build=JSON.parse(fs.readFileSync(path.join(root,'dist',version,'Wildbound-win32-x64','wildbound-build.json'),'utf8'));}catch{}
    return {format:1,createdAt:new Date().toISOString(),scope:'Host dashboard observations only; not game telemetry or a world backup.',privacy:'Excludes credentials, player names, network addresses, computer usernames and save contents.',environment:{platform:process.platform,osRelease:os.release(),arch:process.arch,node:process.versions.node,electron:process.versions.electron},source,build,history:history.slice(-300)};
  }
  return {status,event,report};
}
module.exports={createDiagnostics};
