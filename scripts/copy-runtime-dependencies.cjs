const fs=require('node:fs/promises');
const sync=require('node:fs');
const path=require('node:path');

function packageDirectory(name,from) {
  let file;
  try{file=require.resolve(name+'/package.json',{paths:[from]});}
  catch{file=require.resolve(name,{paths:[from]});}
  let directory=path.dirname(sync.realpathSync(file));
  for(;;){
    const manifest=path.join(directory,'package.json');
    if(sync.existsSync(manifest)&&JSON.parse(sync.readFileSync(manifest,'utf8')).name===name)return directory;
    const parent=path.dirname(directory);if(parent===directory)throw Error('Could not locate runtime package '+name);directory=parent;
  }
}
async function copyPackage(name,from,destination,ancestors=[]) {
  const source=packageDirectory(name,from);
  if(ancestors.includes(source))return;
  const target=path.join(destination,...name.split('/'));
  const manifest=JSON.parse(await fs.readFile(path.join(source,'package.json'),'utf8'));
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.cp(source,target,{recursive:true,dereference:true,filter:file=>file===source||!path.relative(source,file).split(path.sep).includes('node_modules')});
  for(const dependency of Object.keys(manifest.dependencies||{}))await copyPackage(dependency,source,path.join(target,'node_modules'),[...ancestors,source]);
}
module.exports=async function copyRuntimeDependencies(root,buildPath) {
  const manifest=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
  for(const dependency of Object.keys(manifest.dependencies||{}))await copyPackage(dependency,root,path.join(buildPath,'node_modules'));
};
