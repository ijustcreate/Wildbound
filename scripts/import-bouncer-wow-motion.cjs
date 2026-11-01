// Convert exact Bouncer NPC 222532 Stand/Walk/Run tracks to editable spider joints.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {loadM2}=require('./lib/wow-m2.cjs');
const root=path.resolve(__dirname,'..'),input=path.join(root,'test-output/wow-motion-audit/5752188.m2');
const output=path.join(root,'src/bouncer-wow-motion-data.mjs');
if(!fs.existsSync(input))throw Error(`Missing Bouncer donor: ${input}`);
const src=loadM2(input);
if(src.bones.length!==81||src.sequences.length!==14)throw Error(`Unexpected Bouncer donor layout ${src.bones.length}/${src.sequences.length}`);
const mapping={pelvis:[2],chest:[3],head:[4]};
for(const [side,legs] of Object.entries({L:[[8,17,37],[7,16,36],[6,15,35],[5,14,34]],R:[[11,20,41],[10,19,40],[12,21,39],[9,18,38]]}))
 for(let leg=0;leg<4;leg++)for(const [joint,bone] of [['leg',legs[leg][0]],['knee',legs[leg][1]],['foot',legs[leg][2]]])mapping[`${joint}${leg}${side}`]=[bone];
const selections={idle:{index:4,id:0,label:'Stand'},walk:{index:0,id:4,label:'Walk'},run:{index:1,id:5,label:'Run'}};
const scale=10,mean=(positions,ids)=>ids.reduce((p,id)=>p.map((v,i)=>v+positions[id][i]/ids.length),[0,0,0]);
const convert=(point,rest,rootDelta)=>[(point[1]-rest[1]-rootDelta[1])*scale,(point[0]-rest[0]-rootDelta[0])*scale,(point[2]-rest[2]-rootDelta[2])*scale];
const clips={},records={};
for(const [name,selection] of Object.entries(selections)){
 const row=src.sequences[selection.index];if(!row||row.id!==selection.id||row.variant!==0||(row.flags&64))throw Error(`Sequence mismatch for ${name}`);
 const fps=24,length=Math.max(2,Math.ceil(row.duration/1000*fps)),restSample=src.sample(selection.index,0),rest=Object.fromEntries(Object.entries(mapping).map(([n,ids])=>[n,mean(restSample.positions,ids)])),rootRest=restSample.positions[0],rootDrift=[],feet=[];
 clips[name]={fps,length,loop:true,keys:Array.from({length},(_,frame)=>{
  const sample=src.sample(selection.index,Math.min(row.duration,frame/fps*1000)),rootDelta=sample.positions[0].map((v,i)=>v-rootRest[i]);rootDrift.push(Math.hypot(...rootDelta));
  const joints=Object.fromEntries(Object.entries(mapping).map(([n,ids])=>{const value=convert(mean(sample.positions,ids),rest[n],rootDelta);if(n.startsWith('foot')){value[2]=Math.max(0,value[2]);feet.push(value[2]);}return[n,value.map(v=>+v.toFixed(4))]}));
  return{frame,joints};
 })};
 records[name]={sequenceIndex:selection.index,animationId:selection.id,label:selection.label,durationMs:row.duration,frames:length,rootDriftMax:+Math.max(...rootDrift).toFixed(5),minimumNativeFootClearance:+Math.min(...feet).toFixed(4)};
}
const bytes=fs.readFileSync(input),provenance={npc:222532,displayId:119179,fileDataId:5752188,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),source:'https://wow.zamimg.com/modelviewer/live/m2/5752188.m2',coordinates:'Source +X forward, -Y left, +Z up maps to native [Y,X,Z] × 10; frame-zero-relative world joint deltas; root drift removed.',groundContact:'Donor foot-endpoint vertical deltas are clamped at native floor z=0; uncapped minimum was -4.70883 native units in Run. No root/body shift is applied.',mapping,clips:records,preservedNative:['windup','pounce','bite','recover','hurt','death'],webs:false};
fs.writeFileSync(output,`// Generated from Wowhead Bouncer NPC 222532 bone tracks; donor mesh/texture omitted.\nexport const BOUNCER_WOW_MOTION = ${JSON.stringify({clips,provenance},null,2)};\n`);
console.log(JSON.stringify({output,provenance},null,2));
