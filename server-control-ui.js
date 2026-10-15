const $=id=>document.getElementById(id);
let busy=false,lastStatus=null,lastWorld=null,wasOnline=null,lastNotice='',previousSave=null,sessionStart=Date.now();
const connections=new Map(),events=[];
function duration(seconds){if(!Number.isFinite(seconds))return '—';const s=Math.max(0,Math.floor(seconds));return s>=3600?`${Math.floor(s/3600)}h ${Math.floor(s%3600/60)}m`:`${Math.floor(s/60)}m ${s%60}s`;}
function event(text){const at=new Date();events.unshift({at:at.toISOString(),text});events.splice(50);$('activity').replaceChildren(...events.map(item=>{const li=document.createElement('li'),time=document.createElement('time'),label=document.createElement('span');time.textContent=new Date(item.at).toLocaleTimeString();label.textContent=item.text;li.append(time,label);return li;}));}
function controls(online){for(const id of ['save','stop','send','copy-join-key'])$(id).disabled=!online;}
function render(data){
 const now=Date.now(),healthy=data.localHealth!==false,publicHealthy=data.publicHealth===true;
 if(wasOnline!==true)event('Server connected.');
 if(lastWorld&&lastWorld!==data.instanceId){connections.clear();event('Different world instance detected.');}
 if(lastStatus&&Number(data.uptimeSeconds)<Number(lastStatus.uptimeSeconds)-5){connections.clear();event('Server restarted.');}
 if(lastStatus&&lastStatus.publicHealth!==data.publicHealth)event(publicHealthy?'Public connection verified.':'Public connection needs attention.');
 if(data.lastSave&&data.lastSave!==previousSave){previousSave=data.lastSave;$('save-detail').textContent='Automatic saves every 10 seconds';}
 const message=data.fault||data.saveError||data.tunnelError|| (publicHealthy?'The world is reachable through its public endpoint.':'Local server available; public access is not verified.');
 if((data.fault||data.saveError||data.tunnelError)&&lastNotice!==message)event('Server reports an issue. Export a support report for details.');
 lastNotice=message;$('notice').textContent=message;
 $('state').textContent=!healthy?'Needs attention':publicHealthy?'Online · public':'Online · local';$('state').dataset.online='true';$('state').dataset.warning=String(!healthy||!publicHealthy);controls(true);
 $('local-health').textContent=healthy?'Healthy':'Paused';$('public-health').textContent=publicHealthy?'Reachable':'Not verified';
 $('authority-count').textContent=data.authorityCount??'—';$('tunnel-count').textContent=data.tunnelCount??'—';$('seed').textContent=data.worldSeed??'—';
 $('uptime').textContent=duration(data.uptimeSeconds);$('players').textContent=data.playerCount??data.players?.length??0;$('roster').textContent=`${data.rosterCount??'—'} explorers saved in this world`;
 $('saved').textContent=data.lastSave?new Date(data.lastSave).toLocaleTimeString():'Not saved';if(data.saveError)$('save-detail').textContent='Save needs attention';
 $('tick').textContent=Number.isFinite(data.tick)?data.tick.toLocaleString():'—';$('simulation').textContent=!healthy?'Paused after an error':data.playerCount?'World simulation active':'Waiting for explorers';
 $('public-address').value=data.publicAddress||data.localAddress||'';$('copy-address').disabled=!$('public-address').value;
 const players=Array.isArray(data.players)?data.players:[],ids=new Set();$('player-list').replaceChildren();
 for(const [index,p] of players.entries()){
   const id=String(p.id??index),name=typeof p==='string'?p:p.name||'Explorer';ids.add(id);
   if(!connections.has(id)){connections.set(id,now);event(`${name} connected.`);}
   const row=document.createElement('tr');
   for(const value of [name,'Connected',p.location||'World expedition',duration((now-connections.get(id))/1000)]){const td=document.createElement('td');td.textContent=value;row.append(td);}
   row.children[1].className='connection-status';const badge=document.createElement('span');badge.className='connection-badge';badge.textContent='Connected';row.children[1].replaceChildren(badge);$('player-list').append(row);
 }
 for(const id of connections.keys())if(!ids.has(id)){const previous=lastStatus?.players?.find(p=>String(p.id)===id);event(`${previous?.name||'Explorer'} disconnected.`);connections.delete(id);}
 if(!players.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=4;cell.className='empty';cell.textContent='No explorers connected. The world is ready when they are.';row.append(cell);$('player-list').append(row);}
 wasOnline=true;lastStatus=data;lastWorld=data.instanceId;$('checked').textContent=`Updated ${new Date().toLocaleTimeString()} · refreshes every 5 seconds`;
}
function offline(error){if(wasOnline!==false)event('Connection to the server lost.');wasOnline=false;$('state').textContent='Offline';$('state').dataset.online='false';$('state').dataset.warning='true';controls(false);$('notice').textContent=/ECONNREFUSED/.test(error)?'The dedicated server is not running. Start it with Server Control.':error||'Server unavailable.';for(const id of ['local-health','public-health','authority-count','tunnel-count','seed','uptime','players','saved','tick'])$(id).textContent='—';$('roster').textContent='Status unavailable';$('save-detail').textContent='Status unavailable';$('simulation').textContent='Status unavailable';$('public-address').value='';$('copy-address').disabled=true;const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=4;cell.className='empty';cell.textContent='Connection unavailable. Retrying automatically.';row.append(cell);$('player-list').replaceChildren(row);$('checked').textContent=`Last attempt ${new Date().toLocaleTimeString()}`;}
async function refresh(){if(busy)return;busy=true;$('refresh').disabled=true;try{render(await window.serverControl.request('status',$('token').value));}catch(error){offline(error.message);}finally{busy=false;$('refresh').disabled=false;}}
async function action(name,payload){try{const result=await window.serverControl.request(name,$('token').value,payload);event(name==='announce'?'Announcement sent.':name==='save'?'World saved manually.':'Safe server stop requested.');if(name==='announce')$('announcement').value='';await refresh();$('notice').textContent=result.message||'Command completed.';}catch(error){$('notice').textContent=error.message;event('Operator command failed.');}}
$('refresh').onclick=refresh;$('save').onclick=()=>action('save');$('send').onclick=()=>action('announce',{message:$('announcement').value});$('stop').onclick=()=>{if(confirm('Save the world and stop the persistent server? Connected explorers will be disconnected.'))action('stop');};
$('copy-join-key').onclick=async()=>{try{$('notice').textContent=(await window.serverControl.request('copyJoinKey','')).message;}catch(e){$('notice').textContent=e.message;}};
$('copy-address').onclick=async()=>{try{await navigator.clipboard.writeText($('public-address').value);$('notice').textContent='Connection address copied.';}catch{$('public-address').select();$('notice').textContent='Select the address and copy it manually.';}};
$('export').onclick=async()=>{try{$('notice').textContent=(await window.serverControl.request('exportReport','')).message;}catch(e){$('notice').textContent=e.message;}};
window.serverDashboard={render,offline,inspect:()=>({connected:wasOnline,players:connections.size,events:events.length,sessionStart})};
setInterval(refresh,5000);refresh();
