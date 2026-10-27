// Reference-only: imports existing runtime art, never redraws or changes it.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const out=__dirname,root=path.resolve(out,'../../../..');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const inputs=['src/forest.mjs','src/realm-art.mjs','src/realm-layout.mjs','docs/art/artist-reference-kit/lily-pad-test/lily-pad-32.png'];
const before=Object.fromEntries(inputs.map(p=>[p,sha(path.join(root,p))]));
const historicalPath='dist/1.2.39-2026-10-18T23-14-30-512Z/Wildbound-win32-x64/resources/app/src/forest.mjs';
const lilyBranch=text=>{const m=text.match(/if\(p\.kind==='lily'\)\{[\s\S]*?(?=\r?\n else )/);if(!m)throw Error('Missing lily branch');return m[0].replace(/\r\n/g,'\n');};
const currentBranch=lilyBranch(fs.readFileSync(path.join(root,'src/forest.mjs'),'utf8'));
const oldBranch=lilyBranch(fs.readFileSync(path.join(root,historicalPath),'utf8'));
const packagedRoot='dist/1.2.76-2026-10-27T05-29-58-387Z/Wildbound-win32-x64/resources/app';
const packageMatches=Object.fromEntries(inputs.slice(0,3).map(p=>[p,sha(path.join(root,p))===sha(path.join(root,packagedRoot,p))]));
const recoveredReview='test-output/forest-landscape/vegetation-review.png';
const recovery={originalReview:{path:recoveredReview,sha256:sha(path.join(root,recoveredReview)),visuallyInspected:true,note:'Right-hand Lily pad panel shows native and enlarged flowering pad.'},historicalBranch:{path:historicalPath,normalizedCharacters:currentBranch.length,identicalIgnoringCRLF:currentBranch===oldBranch},latestPackage:{path:packagedRoot,exactFileMatches:packageMatches}};
app.disableHardwareAcceleration();app.commandLine.appendSwitch('mute-audio');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-lily-reference-'));
app.setPath('userData',profile);
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});
 win.webContents.setAudioMuted(true);
 try {
  await win.loadURL(pathToFileURL(path.join(out,'comparison-host.html')).href);
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const {forestDecor,drawForestGround}=await import(${JSON.stringify(pathToFileURL(path.join(root,'src/forest.mjs')).href)});
   const {REALM_SPRITES,drawRealmSprite}=await import(${JSON.stringify(pathToFileURL(path.join(root,'src/realm-art.mjs')).href)});
   const {realmAsset}=await import(${JSON.stringify(pathToFileURL(path.join(root,'src/realm-layout.mjs')).href)});
   const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').imageSmoothingEnabled=false;return c;};
   const load=url=>new Promise((yes,no)=>{const i=new Image();i.onload=()=>yes(i);i.onerror=no;i.src=url;});
   const stats=c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=-1,y1=-1,count=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(a[(y*c.width+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);count++;}return {canvas:[c.width,c.height],opaqueBounds:[x0,y0,x1,y1],visibleExtent:[x1-x0+1,y1-y0+1],nonzeroAlphaPixels:count};};
   // Real forestDecor selects real generated bank objects. Draw only the chosen
   // object through drawForestGround's public visibility filter; no copied art.
   function forest(flower){
    const g={seed:75,generatedEnvironment:'forest',terrain:Array(2500).fill('water'),scenery:[],time:0};
    const p=forestDecor(g).banks.find(p=>p.kind==='lily'&&(p.seed%4===0)===flower);
    if(!p)throw Error('No matching forest fixture');
    const c=make(32,32),ctx=c.getContext('2d');ctx.translate(16-p.x,16-p.y);
    drawForestGround(ctx,g,q=>q===p,{dynamicShadows:true,shaderGrass:true});
    return {c,fixture:{seed:g.seed,time:g.time,selected:{...p},terrain:'50x50 natural water',scenery:[],filter:'identity equality to selected real bank object'}};
   }
   const plain=forest(false),flower=forest(true),swamp=make(64,64),swampGame=make(24,24);
   // The actual exported renderer places its 64x64 source at this exact anchor.
   drawRealmSprite(swamp.getContext('2d'),'bayou_lily',32,61,64);
   const size=realmAsset('bayou_lily').size;
   drawRealmSprite(swampGame.getContext('2d'),'bayou_lily',12,size*61/64,size);
   const draftImage=await load(${JSON.stringify(pathToFileURL(path.join(out,'lily-pad-32.png')).href)}),draft=make(32,32);draft.getContext('2d').drawImage(draftImage,0,0);
   const items=[
    {id:'existing-forest-pad',title:'CURRENT EXISTING · FOREST',sub:'lily · no flower',c:plain.c,fixture:plain.fixture},
    {id:'existing-forest-flower',title:'CURRENT EXISTING · FOREST',sub:'lily · flowering seed',c:flower.c,fixture:flower.fixture},
    {id:'existing-swamp-bayou-lily',title:'CURRENT EXISTING · SWAMP',sub:'bayou_lily · flowering catalog asset',c:swamp},
    {id:'standalone-unapproved-draft',title:'UNAPPROVED STANDALONE DRAFT',sub:'unchanged 32×32 test · not integrated',c:draft}
   ];
   const board=make(1664,1010),b=board.getContext('2d'),neutral='#777b77';
   b.fillStyle='#202822';b.fillRect(0,0,board.width,board.height);b.fillStyle='#f0eee2';b.font='bold 23px sans-serif';b.fillText('Existing runtime lily pads and unchanged standalone draft',20,32);
   b.font='16px sans-serif';b.fillText('CURRENT SOURCE / BEFORE reference versus DRAFT / proposed AFTER only · no replacement applied',20,59);
   const text=(s,x,y,size=16,color='#efeee2')=>{b.fillStyle=color;b.font=size+'px sans-serif';b.fillText(s,x,y);};
   items.forEach((v,i)=>{const x=i*416+16;text(v.title,x,94,17);text(v.sub,x,119,15);
    b.fillStyle=neutral;b.fillRect(x,140,384,114);b.drawImage(v.c,x+Math.floor((384-v.c.width)/2),150);
    text('Native: 1 source/canvas pixel = 1 image pixel',x+8,238,15,'#101a14');
    text('6× NEAREST NEIGHBOR · identical scale',x,281,16);
    b.fillStyle=neutral;b.fillRect(x,294,384,384);b.drawImage(v.c,x+(384-v.c.width*6)/2,294+(384-v.c.height*6)/2,v.c.width*6,v.c.height*6);
    v.stats=stats(v.c);
    text(v.c.width+'×'+v.c.height+' canvas · visible '+v.stats.visibleExtent.join('×'),x,702,15);
   });
   const ref=await load(${JSON.stringify(pathToFileURL(path.join(out,'..','swamp-clearing-approved-direction.png')).href)});
   text('PRIMARY REFERENCE · retained approved swamp direction',20,738,16);b.drawImage(ref,20,750,360,240);
   text('Important scale distinction',420,754,20);
   text('Forest is drawn directly in world-pixel coordinates. Its 32×32 canvas is capture padding.',420,786);
   text('Swamp has a native 64×64 indexed source; the catalog renders its full canvas at size 24.',420,814);
   text('The comparison keeps original source extents; it does not normalize leaf sizes or crop padding.',420,842);
   text('Actual swamp catalog stamp, 24×24 world pixels at 1×:',420,882);
   b.fillStyle=neutral;b.fillRect(842,860,48,48);b.drawImage(swampGame,854,872);
   text('No scene tint, extra shadow, or pose adjustment. Same neutral background throughout.',420,932);
   text('Forest lily code matches packaged 1.2.39 (Oct 18); original vegetation review recovered.',420,964);
   return {comparison:board.toDataURL(),images:Object.fromEntries(items.map(v=>[v.id,v.c.toDataURL()]).concat([['existing-swamp-game-size-24',swampGame.toDataURL()]])),items:items.map(({c,...v})=>v),swamp:{source:[REALM_SPRITES.bayou_lily.width,REALM_SPRITES.bayou_lily.height],catalogSize:size,gameSizeStats:stats(swampGame)}};
  })()`);
  fs.writeFileSync(path.join(out,'existing-vs-draft-comparison.png'),Buffer.from(result.comparison.split(',')[1],'base64'));
  for(const [id,url]of Object.entries(result.images))fs.writeFileSync(path.join(out,id+'.png'),Buffer.from(url.split(',')[1],'base64'));
  const after=Object.fromEntries(inputs.map(p=>[p,sha(path.join(root,p))]));
  if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Input changed during reference render');
  const provenance={status:'reference comparison only; standalone draft unapproved',renderer:'Isolated hidden Electron; audio muted before page load; actual runtime modules imported without loading game bootstrap.',sourceRoot:root,inputSha256:after,items:result.items,swamp:result.swamp,comparison:{file:'existing-vs-draft-comparison.png',dimensions:[1664,1010],nativeScale:1,enlargement:6,sampling:'nearest neighbor',background:'#777b77',cropped:false,shapeNormalization:false},sourceIds:[{path:'src/forest.mjs',export:'drawForestGround',kind:'lily',lines:'271-279'},{path:'src/realm-art.mjs',export:'drawRealmSprite',kind:'bayou_lily',lines:'55-56'},{path:'src/realm-layout.mjs',catalog:'REALM_ASSETS.swamp.bayou_lily',size:24,line:7}],history:[{path:'docs/history/2026-10-18-forest-rendering-and-bridges.md',line:12,note:'Reports accepted pixel lily-pad replacement; not proof that current drawing exactly matches the approved revision.'},{path:'docs/history/2026-10-22-swamp-night-fireflies-plants.md',note:'Broader review-only swamp plant study explicitly not production map generation; excluded from current runtime comparison.'}],limits:['Current source renders are not a capture of a saved player world or its sprite overrides.','Exact Oct 18 approval-revision equivalence is unverified.','Packaged build equivalence is checked separately if a package is available.'],inputHashesUnchanged:true};
  fs.writeFileSync(path.join(out,'comparison-provenance.json'),JSON.stringify(provenance,null,2)+'\n');
  provenance.recoveredHistoricalEvidence=recovery;
  provenance.limits=['No saved player world or custom sprite overrides were loaded.','Forest lily branch is unchanged from Oct 18 package 1.2.39; original review was recovered. Exact linkage to the precise screenshot viewed at the approval moment is not independently proven.','Latest 1.2.76 packaged forest, realm-art and realm-layout files match current source exactly.'];
  fs.writeFileSync(path.join(out,'comparison-provenance.json'),JSON.stringify(provenance,null,2)+'\n');
  const qaPath=path.join(out,'qa-status.json'),qa=JSON.parse(fs.readFileSync(qaPath,'utf8'));
  qa.limitations=qa.limitations.filter(s=>!s.includes('no retained image'));
  qa.recoveredPriorAssetEvidence=recovery;
  qa.priorAssetCorrection='Existing forest and swamp lily artwork predates this standalone draft. The original forest vegetation review image was recovered; absence from evidence.json was not absence of an old asset.';
  fs.writeFileSync(qaPath,JSON.stringify(qa,null,2)+'\n');
  console.log(JSON.stringify({file:'existing-vs-draft-comparison.png',items:result.items.map(v=>({id:v.id,...v.stats})),swamp:result.swamp,inputHashesUnchanged:true},null,2));
  win.destroy();app.quit();
 }catch(e){console.error(e);win.destroy();app.exit(1);}
});
