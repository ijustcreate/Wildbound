// Isolated packaged-copy tests only; never opens the normal player save profile.
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),version=require('../package.json').version;
const base=path.resolve(process.argv[2]||path.join(root,'dist',version,'Wildbound-win32-x64','resources','app.asar'));
const electron=path.join(root,'test-output','electron-41.10.7','electron.exe');
if(!fs.existsSync(base)||!fs.existsSync(electron))throw Error('Packaged app or QA Electron runtime missing');
const jobs=[
 ['verify-inventory-refresh'],['verify-warlock-robot-companions'],['verify-starter-chest'],
 ['verify-lobby-settings-controller'],['verify-character-creator'],['verify-anaconda'],
 ['verify-wildlife-storage'],['verify-insects-desert-magic'],['verify-creature-additions'],
 ['verify-succubus'],['verify-healing'],['verify-loot-tooltips'],['verify-ui-coast-spiders'],
 ['verify-adaptive-audio','--reuse-audit'],['verify-arrow-supplies'],
 ['verify-lobby-prop-art'],['verify-event-variety','--app-path',base],
 ['verify-quicksand-surface'],['verify-well'],['verify-storage-portals'],['verify-robot-intro'],['verify-storage-jump'],
 ['verify-banshee-queen'],['verify-beach-wild-fauna'],['verify-biome-boards-house-events'],['verify-seal-vortex'],['verify-house-finale'],
];
const selfLaunching=new Set(['verify-lobby-prop-art','verify-event-variety','verify-quicksand-surface','verify-well']);
const out=path.join(root,'test-output');fs.mkdirSync(out,{recursive:true});const results=[];
let index=0;
async function worker(){while(index<jobs.length){const [name,...args]=jobs[index++],script=path.join(root,name==='verify-well'?'tests/native':'scripts',name+'.cjs');
 if(!fs.existsSync(script)){results.push({name,exit:1,error:'QA script missing'});continue;}
 await new Promise(resolve=>{const env={...process.env,WILDBOUND_VERIFY_APP:base};delete env.ELECTRON_RUN_AS_NODE;
  const binary=selfLaunching.has(name)?process.execPath:electron,started=Date.now();
  const child=cp.spawn(binary,selfLaunching.has(name)?[script,...args]:['--mute-audio',script,...args],{cwd:root,env,windowsHide:true});let log='',error=null;
  child.stdout.on('data',v=>log+=v);child.stderr.on('data',v=>log+=v);child.on('error',e=>error=String(e));
  const timer=setTimeout(()=>{error='QA timed out';child.kill();},240000);
  child.on('close',code=>{clearTimeout(timer);fs.writeFileSync(path.join(out,'build'+version+'-'+name+'.log'),log);results.push({name,exit:code??1,error,seconds:Math.round((Date.now()-started)/100)/10});console.log(name+': '+(code===0&&!error?'PASS':'FAIL')+(error?' '+error:'')+'\n'+log.slice(-800));resolve();});
 });
}}
Promise.all([worker(),worker()]).then(()=>{const failed=results.filter(r=>r.exit!==0||r.error);fs.writeFileSync(path.join(out,'build'+version+'-native-qa.json'),JSON.stringify({version,base,results,failed},null,2));console.log('Packaged checks: '+(results.length-failed.length)+'/'+results.length+' passed');process.exitCode=failed.length?1:0;});
