// Disk persistence for named local worlds. The atomic snapshot is authoritative;
// the other files are readable projections and may be reconstructed after a crash.
const fs=require('node:fs/promises');
const path=require('node:path');
const queues=new Map();
const safe=id=>{if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw Error('Invalid world id.');return id;};
async function atomic(file,data){
  await fs.mkdir(path.dirname(file),{recursive:true});
  await fs.writeFile(file+'.tmp',JSON.stringify(data,null,2));
  await fs.rename(file+'.tmp',file);
}
function validate(record){
  safe(record?.id);
  if(record.version!==1||record.session?.state?.localWorld?.id!==record.id||!Array.isArray(record.session?.state?.players)||record.session.state.players.length<1||record.session.state.players.length>6||!record.delta||!Array.isArray(record.delta.changed)||!Array.isArray(record.delta.added)||!Array.isArray(record.delta.removed)||!Array.isArray(record.terrain))throw Error('Invalid world snapshot.');
  if(Buffer.byteLength(JSON.stringify(record))>32_000_000)throw Error('World checkpoint exceeds 32 MB.');return record;
}
exports.createWorldStore=(root)=>{
  const folder=id=>path.join(root,safe(id));
  async function load(id){
    const file=path.join(folder(id),'save.snapshot');
    let first;
    try{return validate(JSON.parse(await fs.readFile(file,'utf8')));}catch(e){first=e;}
    try{return validate(JSON.parse(await fs.readFile(file+'.bak','utf8')));}catch{if(first.code==='ENOENT')return null;throw first;}
  }
  async function list(){
    await fs.mkdir(root,{recursive:true});const result=[];
    for(const d of await fs.readdir(root,{withFileTypes:true}))if(d.isDirectory()&&/^[a-zA-Z0-9_-]{1,80}$/.test(d.name)){
      try{const record=await load(d.name);if(record){const s=record.session.state.localWorld;result.push({id:s.id,name:s.name,seed:s.seed,pack:s.pack.name,seconds:s.seconds,savedAt:record.savedAt,regions:Object.keys(s.regions).length});}}catch(e){result.push({id:d.name,name:d.name,error:e.message});}
    }
    return result.sort((a,b)=>(b.savedAt||0)-(a.savedAt||0));
  }
  function save(record){
    validate(record);const body=structuredClone(record),dir=folder(record.id),file=path.join(dir,'save.snapshot');
    const task=(queues.get(file)||Promise.resolve()).catch(()=>{}).then(async()=>{
      await fs.mkdir(dir,{recursive:true});
      try{const previous=validate(JSON.parse(await fs.readFile(file,'utf8')));await atomic(file+'.bak',previous);}catch{}
      await atomic(file,body);
      const s=body.session.state.localWorld;
      await atomic(path.join(dir,'world.json'),{version:1,id:s.id,name:s.name,seed:s.seed,pack:s.pack,seconds:s.seconds,savedAt:body.savedAt});
      await atomic(path.join(dir,'terrain','changes.json'),{scenery:body.delta,tiles:body.terrain,chunks:body.session.state.boundlessChunkChanges||{}});
      await atomic(path.join(dir,'ecology','regions.json'),s.regions);
      await atomic(path.join(dir,'settlements','state.json'),Object.fromEntries(Object.entries(s.regions).map(([k,r])=>[k,r.settlement])));
      await atomic(path.join(dir,'discovered-events','history.json'),{events:s.events,quests:s.quests});
      return {ok:true,path:dir};
    });queues.set(file,task);return task;
  }
  return {load,list,save,root};
};
