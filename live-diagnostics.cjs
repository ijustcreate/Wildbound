const fs=require('node:fs/promises');
const path=require('node:path');

// One bounded, local snapshot. No commands, network listener, or raw keystrokes.
function createDiagnostics(directory,{pid=process.pid}={}){
  const file=path.join(directory,'live-diagnostics.json');
  let latest=null,writing=null,closed=false,events=[],lastSignature='';
  const string=(value,max=80)=>String(value??'').slice(0,max);
  const number=value=>Number.isFinite(value)?Math.round(value*100)/100:null;
  function sanitize(data){
    const players=(Array.isArray(data.players)?data.players:[]).slice(0,6).map(p=>({
      id:number(p.id),name:string(p.name,30),device:string(p.device,30),profileSelected:!!p.profileSelected,
      x:number(p.x),y:number(p.y),ready:!!p.ready,disconnected:!!p.disconnected,panel:string(p.panel,30)||null,
      input:{x:number(p.input?.x),y:number(p.input?.y),interact:!!p.input?.interact,attack:!!p.input?.attack},
    }));
    return {version:1,pid,updatedAt:new Date().toISOString(),screen:string(data.screen,20),phase:string(data.phase,20),paused:!!data.paused,
      focused:!!data.focused,focusedPanelOwner:string(data.focusedPanelOwner,30)||null,
      countdown:number(data.countdown),players,
      controllers:(Array.isArray(data.controllers)?data.controllers:[]).slice(0,8).map(p=>({index:number(p.index),id:string(p.id,100),claimed:!!p.claimed,axes:(p.axes||[]).slice(0,4).map(number),buttons:(p.buttons||[]).slice(0,24).map(number)})),
      settings:{map:string(data.settings?.map,20),difficulty:string(data.settings?.difficulty,20),dice:number(data.settings?.dice)},
      errors:(Array.isArray(data.errors)?data.errors:[]).slice(-8).map(e=>string(e,500))};
  }
  async function drain(){
    await fs.mkdir(directory,{recursive:true});
    while(latest){const snapshot=latest;latest=null;const temp=file+'.'+pid+'.tmp';await fs.writeFile(temp,JSON.stringify(snapshot,null,2));await fs.rename(temp,file);}
  }
  function publish(data){
    if(closed||!data||typeof data!=='object')return;
    const snapshot=sanitize(data);
    const signature=JSON.stringify([snapshot.screen,snapshot.players.map(p=>[p.id,p.device,p.ready,p.panel,p.disconnected]),snapshot.settings]);
    if(signature!==lastSignature){events.push({at:snapshot.updatedAt,screen:snapshot.screen,players:snapshot.players.map(({id,device,ready,panel})=>({id,device,ready,panel})),settings:snapshot.settings});events=events.slice(-12);lastSignature=signature;}
    snapshot.events=events;latest=snapshot;
    if(!writing)writing=drain().catch(e=>{console.warn('Live diagnostics:',e.message);}).finally(()=>{writing=null;if(latest&&!closed)publish(latest);});
    return writing;
  }
  return {file,publish,async flush(){while(writing)await writing;},close(){closed=true;}};
}
module.exports={createDiagnostics};
