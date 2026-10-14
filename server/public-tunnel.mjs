import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

// A Quick Tunnel is an explicitly selected, temporary playtest endpoint. It
// forwards only the game port; the admin listener never enters this process.
export async function startPublicTunnel(config, gamePort) {
  if(config.publicTunnel!=='quick')return null;
  const directory=path.dirname(config.savePath);
  const emptyConfig=path.join(directory,'quick-tunnel.yml');
  await fs.writeFile(emptyConfig,'{}\n',{mode:0o600});
  const child=spawn(config.tunnelExecutable||'cloudflared',['tunnel','--config',emptyConfig,'--no-autoupdate','--url',`http://127.0.0.1:${gamePort}`],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  const log=path.join(directory,'public-tunnel.log');
  let output='',settled=false;
  const ready=new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{if(!settled){settled=true;child.kill();reject(Error('Public tunnel did not return an address. Inspect server-data/public-tunnel.log.'));}},30000);
    const data=chunk=>{
      const text=chunk.toString();fs.appendFile(log,text).catch(()=>{});output=(output+text).slice(-32768);
      const match=output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if(match&&!settled){settled=true;clearTimeout(timeout);resolve('wss://'+new URL(match[0]).host+'/game');}
    };
    child.stdout.on('data',data);child.stderr.on('data',data);
    child.on('error',error=>{if(!settled){settled=true;clearTimeout(timeout);reject(Error('cloudflared could not start: '+error.message));}});
    child.on('exit',code=>{if(!settled){settled=true;clearTimeout(timeout);reject(Error('Public tunnel exited with code '+code+'. Inspect its log.'));}});
  });
  const address=await ready;
  return {address,get running(){return child.exitCode===null&&!child.killed;},close:()=>child.kill()};
}
