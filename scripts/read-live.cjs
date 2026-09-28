// Read one fresh game snapshot without modifying the game or its profile.
const fs=require('node:fs');
const path=require('node:path');
const file=process.argv[2]||path.join(process.env.APPDATA||path.join(process.env.HOME||'','.config'),'wildbound','live-diagnostics.json');
try{
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  const ageMs=Date.now()-Date.parse(data.updatedAt);
  let running=true;try{process.kill(data.pid,0);}catch{running=false;}
  console.log(JSON.stringify({live:running&&ageMs<4000,ageMs,...data},null,2));
}catch(error){console.log(JSON.stringify({live:false,error:error.code==='ENOENT'?'No snapshot yet. Launch the updated Wildbound build.':error.message}));process.exitCode=1;}
