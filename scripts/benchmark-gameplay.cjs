const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {createHash}=require('node:crypto');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const args=process.argv.slice(2);
const label=args.find(arg=>!arg.startsWith('--'))||'current';
const timeoutMs=900000;

if(args.includes('--help')) {
  console.log('Usage: node scripts/benchmark-gameplay.cjs [label] [--quick] [--cpu]');
  console.log('WILDBOUND_AUDIT_SCENES selects comma-separated cells, e.g. train-travel-2,heavy-weather-3,crowded-fight-4.');
  console.log('WILDBOUND_VERIFY_APP selects an alternate game runtime directory.');
} else if(!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(label)) {
  console.error('The benchmark label must start with a letter or digit and contain only letters, digits, dots, dashes, or underscores.');
  process.exitCode=1;
} else if(!process.versions.electron) {
  const env={...process.env};
  delete env.ELECTRON_RUN_AS_NODE;
  const run=spawnSync(require('electron'),[__filename,...args,'--mute-audio'],{
    cwd:root,env,stdio:'inherit',windowsHide:true,timeout:timeoutMs+10000,
  });
  if(run.error)console.error(run.error);
  process.exitCode=run.status??1;
} else {
  runBenchmark();
}

function runBenchmark() {
  const {app,BrowserWindow,powerSaveBlocker,screen}=require('electron');
  const appRoot=path.resolve(process.env.WILDBOUND_VERIFY_APP||root);
  const output=path.join(root,'test-output','gameplay-benchmark',label);
  const requestedCpu=args.includes('--cpu');
  const frames=args.includes('--quick')?60:120;
  const reportFile=path.join(output,'report.json');
  fs.mkdirSync(output,{recursive:true});
  app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-gameplay-benchmark-')));
  for(const flag of ['mute-audio','disable-background-timer-throttling',
    'disable-renderer-backgrounding','disable-backgrounding-occluded-windows']) {
    app.commandLine.appendSwitch(flag);
  }

  const report={appRoot,electron:process.versions.electron,startedAt:new Date().toISOString(),
    host:{platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model},
    fixedSimulationHz:60,framesPerCase:frames,rows:[],rendererErrors:[],error:null,
    requestedMode:requestedCpu?'cpu':'foreground',complete:false};
  let activeCase='startup';
  let finished=false;
  let awake;
  const writeReport=()=>fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
  const finish=error=>{
    if(finished)return;
    finished=true;
    clearTimeout(deadline);
    if(awake!==undefined)powerSaveBlocker.stop(awake);
    if(error) {
      report.error={activeCase,message:error.message,stack:error.stack};
      console.error(error);
    }
    report.complete=!error&&!report.rendererErrors.length;
    writeReport();
    console.log(`Benchmark report: ${reportFile}`);
    app.exit(report.complete?0:1);
  };
  const deadline=setTimeout(()=>finish(Error('Gameplay benchmark timed out.')),timeoutMs);

  app.whenReady().then(async()=>{
    if(!requestedCpu)awake=powerSaveBlocker.start('prevent-display-sleep');
    const win=new BrowserWindow({show:false,width:1440,height:940,useContentSize:true,
      title:'Wildbound gameplay benchmark (muted)',webPreferences:{backgroundThrottling:false}});
    win.webContents.setAudioMuted(true);
    win.on('closed',()=>finish(Error('Benchmark window closed before completion.')));
    win.webContents.on('render-process-gone',(_event,details)=>finish(Error(`Renderer exited: ${details.reason}`)));
    win.webContents.on('console-message',event=>{
      if(event.level==='error')report.rendererErrors.push(event.message);
    });
    report.muted=win.webContents.isAudioMuted();
    report.graphics=app.getGPUFeatureStatus();
    report.display=screen.getDisplayMatching(win.getBounds());
    report.contentBounds=win.getContentBounds();
    report.sourceVersion=JSON.parse(fs.readFileSync(path.join(appRoot,'package.json'),'utf8')).version;
    report.rendererSha256=createHash('sha256').update(fs.readFileSync(path.join(appRoot,'src','render.mjs'))).digest('hex');
    await win.loadFile(path.join(appRoot,'index.html'));
    const run=expression=>win.webContents.executeJavaScript(expression);
    await run('wildboundBoot.ready');
    const catalog=await run(`import('./scripts/gameplay-benchmark-scenes.mjs').then(async module=>{
      window.gameplayBenchmark=await module.createGameplayBenchmark();
      return module.benchmarkCatalog;
    })`);
    const selected=process.env.WILDBOUND_AUDIT_SCENES?.split(',').map(id=>id.trim()).filter(Boolean);
    if(selected?.some(id=>!catalog.some(scene=>scene.id===id)))throw Error('Unknown benchmark scene in WILDBOUND_AUDIT_SCENES.');
    const cases=selected?.length?catalog.filter(scene=>selected.includes(scene.id)):catalog;

    report.foreground={available:false,reason:'CPU-only mode requested.'};
    if(!requestedCpu) {
      activeCase='foreground cadence probe';
      win.setAlwaysOnTop(true);
      win.show();
      win.focus();
      win.webContents.focus();
      report.foreground=await run('gameplayBenchmark.probeCadence()');
      if(!report.foreground.available) {
        console.log(report.foreground.reason);
        win.hide();
      }
    }
    const visible=report.foreground.available;
    report.mode=visible?'foreground':'cpu';
    report.method=visible
      ? 'Foreground requestAnimationFrame intervals with fixed simulation steps and the native renderer.'
      : 'Fixed simulation steps and renderer CPU submission measurements. Average FPS and delivered frame times are unavailable.';
    writeReport();
    for(const scene of cases) {
      activeCase=scene.id;
      console.log(`Measuring ${scene.id}`);
      const row=await run(`gameplayBenchmark.measure(${JSON.stringify(scene)},${JSON.stringify({visible,frames})})`);
      report.rows.push(row);
      writeReport();
      console.log(JSON.stringify({id:row.id,views:row.after.views,averageFps:row.averageFps,
        frameP95Ms:row.frameMs?.p95??null,cpuP95Ms:row.cpuMs.p95}));
    }
    finish();
  }).catch(error=>finish(error));
}
