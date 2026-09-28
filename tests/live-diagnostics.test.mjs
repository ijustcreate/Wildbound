import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createDiagnostics} from '../live-diagnostics.cjs';

test('Live telemetry writes the newest state and excludes unrequested profile and keyboard data',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'wildbound-live-'));
  try{
    const diagnostics=createDiagnostics(dir);
    for(let x=0;x<50;x++)diagnostics.publish({screen:'lobby',players:[{id:1,name:'Explorer',device:'keyboard',x,y:12,inventory:['private'],input:{x:1,y:0},profileSelected:true}],rawKeys:['password'],errors:['example error'],controllers:[]});
    await diagnostics.flush();const data=JSON.parse(await fs.readFile(diagnostics.file,'utf8'));
    assert.equal(data.players[0].x,49);assert.equal(data.players[0].device,'keyboard');assert.equal(data.players[0].input.x,1);
    assert.equal(data.rawKeys,undefined);assert.equal(data.players[0].inventory,undefined);assert.ok(data.events.length<=12);
    diagnostics.close();assert.equal(diagnostics.publish({screen:'play'}),undefined);
  }finally{await fs.rm(dir,{recursive:true,force:true});}
});
