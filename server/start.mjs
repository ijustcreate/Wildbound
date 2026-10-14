import {loadConfig,defaultConfigPath} from './config.mjs';
import {createPersistentServer} from './runtime.mjs';

const args=process.argv.slice(2), index=args.indexOf('--config');
if(index>=0&&!args[index+1])throw Error('--config requires a path.');
const file=index>=0?args[index+1]:defaultConfigPath;
try {
  const config=await loadConfig(file,{initialize:args.includes('--init')});
  if(args.includes('--init'))console.log('Server configuration ready. Keep its tokens private:',file);
  if(!args.includes('--init-only')){
    const server=await createPersistentServer(config);
    console.log(`Wildbound persistent server ready: ${server.status().localAddress}`);
    console.log(`Admin listener: ${config.adminHost}:${server.adminPort}. Save: ${config.savePath}`);
    const stop=()=>server.close().catch(error=>{console.error('World could not be saved. Server retained:',error.message);process.exitCode=1;});
    process.on('SIGINT',stop);process.on('SIGTERM',stop);
  }
}catch(error){console.error(error.stack||error.message);process.exitCode=1;}
