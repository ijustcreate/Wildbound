import test from 'node:test';
import assert from 'node:assert/strict';
import { transformBones,boneBasis } from '../src/bone-tools.mjs';
import { defaultPlayerMotion,poseAt,projectPoint,validatePlayerMotion } from '../src/player-motion.mjs';
import { RigStudio } from '../src/player-studio.mjs';

test('Bone transforms preserve view depth and apply scale, shear and rotation around the parent in eight views',()=>{
  const m=defaultPlayerMotion(),pose=poseAt(m,'idle',0);
  for(let d=0;d<8;d++)for(const [kind,value] of [['scale',[1.5,.7]],['shear',[20,-10]],['rotate',[30,0]],['move',[3,-2]]]) {
    const result=transformBones(m,pose,'elbowR',d,kind,value);
    assert.deepEqual(Object.keys(result).sort(),['elbowR','handR']);
    const a=projectPoint(pose.shoulderR,d),b=projectPoint(pose.elbowR,d),q=projectPoint(result.elbowR,d),x=b.x-a.x,y=b.y-a.y;
    const expected=kind==='scale'?[x*1.5,y*.7]:kind==='shear'?[x+y*Math.tan(Math.PI/9),y+x*Math.tan(-Math.PI/18)]:kind==='rotate'?[x*Math.cos(Math.PI/6)-y*.5,x*.5+y*Math.cos(Math.PI/6)]:[x+3,y-2];
    assert.ok(Math.abs(q.x-a.x-expected[0])<1e-8);
    assert.ok(Math.abs(q.y-a.y-expected[1])<1e-8);
    const delta=result.elbowR.map((v,i)=>v-pose.elbowR[i]);
    assert.ok(Math.abs(delta[0]*Math.sin(d*Math.PI/4)+delta[1]*Math.cos(d*Math.PI/4))<1e-8);
  }
});
test('Local axes follow the bone and inheritance flags isolate a child branch',()=>{
  const m=defaultPlayerMotion(),pose=poseAt(m,'idle',0);
  m.joints.handR.editor={inheritmove:false,color:'#ef4455',icon:'diamond',iconSize:6,showName:true};
  const output=transformBones(m,pose,'elbowR',0,'move',[2,0],'local');
  assert.deepEqual(Object.keys(output),['elbowR']);
  const angle=boneBasis(m,pose,'elbowR',0,'local'),a=projectPoint(pose.elbowR,0),b=projectPoint(output.elbowR,0);
  assert.ok(Math.abs(b.x-a.x-2*Math.cos(angle))<1e-8);
  assert.ok(validatePlayerMotion(JSON.parse(JSON.stringify(m))));
  assert.deepEqual(transformBones(m,pose,'elbowR',0,'scale',[2,2],'world',false).handR,undefined);
});
test('Setup and animation transforms survive undo and JSON round trip without changing unrelated clips',()=>{
  const s=new RigStudio(()=>{}),original=structuredClone(s.model);
  try {
    s.selected='elbowR';s.mode='animate';s.clip='run';s.frame=3;
    const before=structuredClone(s.model.clips.idle);
    s.remember();const pose=s.pose();const result=transformBones(s.model,pose,s.selected,0,'scale',[1.2,.8]);
    // Exercise the same keyed-write path as the inspector, using its controller.
    return import('../src/bone-tools.mjs').then(({BoneTools})=>{
      const tools=new BoneTools(s);tools.apply(pose,'scale',[1.2,.8]);
      assert.deepEqual(s.pose().elbowR,result.elbowR);
      assert.deepEqual(s.model.clips.idle,before);
      assert.ok(validatePlayerMotion(JSON.parse(JSON.stringify(s.model))));
      s.replace(s.history.pop());assert.deepEqual(s.model,original);
    }).finally(()=>s.replace(original));
  } catch(e){s.replace(original);throw e;}
});
