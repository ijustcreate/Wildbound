// Replace only the three requested stored rigs; preserve every unrelated entry byte-for-byte.
import fs from 'node:fs';
import {defaultBeastMotion,legacyInsectMotion,nativeBoarMotion} from '../src/beast-motion.mjs';
import {defaultNightMotion,legacyNightMotion} from '../src/night-rigs.mjs';
import {upgradeSpiderMotion} from '../src/spider-motion.mjs';
import {upgradeWowCreatureMotion,applyWowCreatureMotion} from '../src/wow-creature-transfer.mjs';

const file=new URL('../authored/rigs.json',import.meta.url);
let source=fs.readFileSync(file,'utf8');
const authored=JSON.parse(source);
const target={
  spider:authored.beastMotions.spider.motionSource?applyWowCreatureMotion(structuredClone(authored.beastMotions.spider),'spider'):upgradeSpiderMotion(authored.beastMotions.spider,legacyInsectMotion('spider')),
  boar:authored.beastMotions.boar.motionSource?applyWowCreatureMotion(structuredClone(authored.beastMotions.boar),'boar'):upgradeWowCreatureMotion(authored.beastMotions.boar,nativeBoarMotion(),defaultBeastMotion('boar')),
  elephant:authored.nightMotions.elephant.motionSource?applyWowCreatureMotion(structuredClone(authored.nightMotions.elephant),'elephant'):upgradeWowCreatureMotion(authored.nightMotions.elephant,legacyNightMotion('elephant'),defaultNightMotion('elephant')),
};
const previousElephant={earL:[[-6.75,19.55,35],[-12,19,27]],earR:[[6.75,19.55,35],[12,19,27]],eyeL:[[-4.05,26.45,30]],eyeR:[[4.05,26.45,30]],trunkMid:[[0,35,11]],trunkTip:[[0,40,5]],tuskL:[[-6,34,18]],tuskR:[[6,34,18]]};
const freshElephant=defaultNightMotion('elephant');
for(const [name,old]of Object.entries(previousElephant)){
 const actual=target.elephant.joints[name]?.position;
 if(old.some(candidate=>actual?.every((v,i)=>Math.abs(v-candidate[i])<.00001)))target.elephant.joints[name].position=[...freshElephant.joints[name].position];
}
const oldEyes={eyeL:[true,true,true,false,false,false,false,true],eyeR:[true,true,false,false,false,false,true,true]};
for(const [name,mask]of Object.entries(oldEyes))
 if(JSON.stringify(target.elephant.visibility[name])===JSON.stringify(mask))target.elephant.visibility[name]=[...freshElephant.visibility[name]];

function objectEnd(text,start){let depth=0,quoted=false,escape=false;for(let i=start;i<text.length;i++){const c=text[i];if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return i+1;}throw Error('Unclosed JSON object');}
for(const [family,name] of [['beastMotions','spider'],['beastMotions','boar'],['nightMotions','elephant']]){
  const familyKey='"'+family+'":', key='"'+name+'":';
  const familyAt=source.indexOf(familyKey);if(familyAt<0)throw Error('Missing '+family);
  const familyStart=source.indexOf('{',familyAt+familyKey.length),familyEnd=objectEnd(source,familyStart);
  const at=source.indexOf(key,familyStart);if(at<0||at>familyEnd)throw Error('Missing '+name);
  const start=source.indexOf('{',at+key.length),end=objectEnd(source,start);
  source=source.slice(0,start)+JSON.stringify(target[name])+source.slice(end);
}
const checked=JSON.parse(source);
for(const [family,name] of [['beastMotions','spider'],['beastMotions','boar'],['nightMotions','elephant']])
  if(checked[family][name]?.motionSource?.kind!=='wowhead-bone-transfer')throw Error('Failed to register '+name);
fs.writeFileSync(file,source);
console.log('Registered spider, boar and elephant in authored/rigs.json');
