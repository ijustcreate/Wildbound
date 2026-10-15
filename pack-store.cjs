const fs=require('node:fs/promises'),path=require('node:path');
exports.createPackStore=({appPath,userData})=>{
  const root=path.join(userData,'world-packs');
  async function validator(){const {validatePack}=await import('./src/world-simulation.mjs'),{creatures}=await import('./src/definitions.mjs');return input=>{const p=validatePack(input);for(const kind of [...p.prey,...p.predators])if(!creatures[kind])throw Error('Unknown creature in pack: '+kind);return p;};}
  async function list(){
    const validate=await validator(),packs=new Map();
    for(const directory of [path.join(appPath,'worlds'),root]){
      let entries;try{entries=await fs.readdir(directory,{withFileTypes:true});}catch{continue;}
      for(const e of entries)if(e.isDirectory()&&/^[-a-z0-9]{1,48}$/.test(e.name))try{
        const pack=validate(JSON.parse(await fs.readFile(path.join(directory,e.name,'world.json'),'utf8')));
        if(packs.has(pack.id))continue;packs.set(pack.id,pack);
      }catch{/* Invalid packs cannot prevent the base game starting. */}
    }
    return [...packs.values()];
  }
  async function install(file){
    const validate=await validator(),pack=validate(JSON.parse(await fs.readFile(file,'utf8')));
    const dest=path.join(root,pack.id);await fs.mkdir(dest,{recursive:true});
    for(const rel of Object.values(pack.assets||{})){
      const source=path.resolve(path.dirname(file),rel),base=path.resolve(path.dirname(file))+path.sep;
      const resolved=await fs.realpath(source);
      if(!resolved.startsWith(base))throw Error('Pack assets must remain inside their pack folder.');
      const stat=await fs.stat(source);if(!stat.isFile()||stat.size>32_000_000)throw Error('Pack asset is too large.');
      const target=path.join(dest,rel);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(source,target);
    }
    await fs.writeFile(path.join(dest,'world.json.tmp'),JSON.stringify(pack,null,2));await fs.rename(path.join(dest,'world.json.tmp'),path.join(dest,'world.json'));return pack;
  }
  async function assets(id){
    if(!/^[-a-z0-9]{1,48}$/.test(id))throw Error('Invalid pack id.');
    for(const directory of [path.join(appPath,'worlds'),root])try{
      const base=path.join(directory,id),validate=await validator(),pack=validate(JSON.parse(await fs.readFile(path.join(base,'world.json'),'utf8')));
      return Object.fromEntries(Object.entries(pack.assets||{}).map(([k,v])=>[k,require('node:url').pathToFileURL(path.join(base,v)).href]));
    }catch{}
    return {};
  }
  return {list,install,assets,root};
};
