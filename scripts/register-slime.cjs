// Register only the new slime entry, preserving every existing editable rig.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
(async()=>{
 const {default:model}=await import(pathToFileURL(path.join(root,'src/slime-data.mjs')));
 const file=path.join(root,'authored/rigs.json'),raw=fs.readFileSync(file,'utf8'),before=JSON.parse(raw);
 if(before.slime&&!process.argv.includes('--refresh-generated')){console.log('Slime rig already registered; preserved authored version.');return;}
 const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
 const prior=Object.fromEntries(Object.entries(before).filter(([key])=>!(key==='slime'&&process.argv.includes('--refresh-generated'))).map(([key,value])=>[key,hash(value)]));
 let next;
 if(before.slime){
  const old=before.slime,oldShape=JSON.stringify(old.shape),generatedShapes=[{width:13,depth:10,height:16,pixelStep:2},{width:21,depth:17,height:27,pixelStep:2}].map(JSON.stringify);
  if(old.provenance?.sourceSha256!==model.provenance.sourceSha256||!generatedShapes.includes(oldShape)||Object.keys(old.boneSprites||{}).length||Object.keys(old.renderOrder||{}).length)throw Error('Existing slime has authored changes; refusing generated refresh.');
  const key=raw.lastIndexOf('  "slime":'),open=raw.indexOf('{',key);let depth=0,inString=false,escape=false,end=-1;
  for(let i=open;i<raw.length;i++){const ch=raw[i];if(inString){if(escape)escape=false;else if(ch==='\\')escape=true;else if(ch==='"')inString=false;continue;}if(ch==='"'){inString=true;continue;}if(ch==='{')depth++;else if(ch==='}'&&--depth===0){end=i+1;break;}}
  if(key<0||end<0)throw Error('Could not safely find the authored slime entry.');
  next=raw.slice(0,open)+JSON.stringify(model)+raw.slice(end);
 } else {
  const end=raw.lastIndexOf('}');
  next=raw.slice(0,end).trimEnd()+',\n  "slime": '+JSON.stringify(model)+'\n'+raw.slice(end);
 }
 const after=JSON.parse(next);
 for(const [key,digest] of Object.entries(prior))if(hash(after[key])!==digest)throw Error('Existing rig changed: '+key);
 fs.writeFileSync(file,next);
 const result={added:'slime',preserved:Object.keys(prior),preservedSha256:prior,source:model.provenance};
 fs.mkdirSync(path.join(root,'assets/slimes-wow'),{recursive:true});
 fs.writeFileSync(path.join(root,'assets/slimes-wow/registration.json'),JSON.stringify({...result,registeredSlimeSha256:hash(after.slime)},null,2)+'\n');
 console.log((before.slime?'Refreshed generated slime':'Registered slime')+'; every other authored rig hash is unchanged.');
})().catch(error=>{console.error(error);process.exitCode=1;});
