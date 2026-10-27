// Compare working source with a shipped package and the earlier Codex checkout.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const shipped=path.resolve(process.argv[2]),other=path.resolve(process.argv[3]);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function files(base){const list=['app.mjs','index.html','main.cjs','preload.cjs'];
 const visit=dir=>{if(!fs.existsSync(path.join(base,dir)))return;for(const entry of fs.readdirSync(path.join(base,dir),{withFileTypes:true})){const name=path.posix.join(dir,entry.name);if(entry.isDirectory())visit(name);else if(entry.isFile())list.push(name);}};
 for(const dir of ['src','assets','authored'])visit(dir);return list;}
const current=files(root),changedSincePackage=current.filter(f=>!fs.existsSync(path.join(shipped,f))||hash(path.join(root,f))!==hash(path.join(shipped,f)));
const otherChanges=files(other).filter(f=>!fs.existsSync(path.join(root,f))||hash(path.join(root,f))!==hash(path.join(other,f)));
const otherNewer=otherChanges.filter(f=>!fs.existsSync(path.join(root,f))||fs.statSync(path.join(other,f)).mtimeMs>fs.statSync(path.join(root,f)).mtimeMs+2000);
const result={root,shipped,other,currentFiles:current.length,changedSincePackage,otherDifferent:otherChanges.length,otherNewer};
fs.writeFileSync(path.join(root,'test-output','pending-updates-audit.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
