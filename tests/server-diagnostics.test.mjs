import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import diagnostics from '../server-diagnostics.cjs';

test('support reports preserve useful observations without credentials, names, addresses or save contents',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-support-'));
  try{
    const recorder=diagnostics.createDiagnostics(dir,{root:dir,secrets:['private-admin','private-player']});
    const data={instanceId:'world-1',localHealth:true,publicHealth:true,playerCount:1,rosterCount:2,tick:100,uptimeSeconds:60,worldSeed:17,players:[{id:2,name:'Personal Player',inventory:['private-save']}],adminToken:'private-admin',joinToken:'private-player',publicAddress:'wss://private.example/game',lastSave:new Date().toISOString()};
    recorder.status(data);recorder.status(data);
    recorder.event('error','private-admin private-player C:\\Users\\PersonalAccount\\game wss://private.example/game 127.0.0.1:4184');
    const report=recorder.report(),text=JSON.stringify(report);
    for(const forbidden of ['private-admin','private-player','Personal Player','private-save','PersonalAccount','private.example','127.0.0.1'])assert(!text.includes(forbidden),forbidden);
    assert.equal(report.history.filter(e=>e.type==='status').length,1);
    assert.deepEqual(report.history[0].playerIds,[2]);assert.equal(report.history[0].tick,100);
    recorder.status({...data,playerCount:0,players:[]});assert.equal(recorder.report().history.filter(e=>e.type==='status').length,2);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('diagnostic storage rotates and exports a bounded tail with a corrupt line tolerated',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-support-'));
  try{
    const recorder=diagnostics.createDiagnostics(dir,{root:dir});
    for(let n=0;n<320;n++)recorder.event('test','x'.repeat(2000));
    const file=path.join(dir,'dashboard-history.jsonl');
    fs.appendFileSync(file,'broken json\n');
    assert(fs.existsSync(file+'.previous'));assert(fs.statSync(file).size<512*1024);
    assert.equal(recorder.report().history.length,300);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
