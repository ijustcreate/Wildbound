const copy=value=>structuredClone(value);

export function ensureWerewolfTail(model){
  if(!model?.joints||model.type!=='werewolf')return model;
  if(model.articulatedTailRevision===1&&model.joints.tailBase&&model.joints.tailMid&&model.joints.tailTip)return model;
  const next=copy(model),pelvis=next.joints.pelvis?.position||[0,-1,14];
  next.joints.tailBase??={parent:'pelvis',position:[pelvis[0],pelvis[1]-5,pelvis[2]-2]};
  next.joints.tailMid??={parent:'tailBase',position:[pelvis[0],pelvis[1]-12,pelvis[2]-7]};
  next.joints.tailTip??={parent:'tailMid',position:[pelvis[0],pelvis[1]-20,pelvis[2]-8]};
  next.shape||={};next.shape.tailWidth=Math.max(3,next.shape.tailWidth||0);
  next.visibility||={};
  for(const name of ['tailBase','tailMid','tailTip'])next.visibility[name]??=Array(8).fill(true);
  for(const [action,clip]of Object.entries(next.clips||{})){
    const keys=clip?.keys;if(!Array.isArray(keys)||!keys.length)continue;
    for(let i=0;i<keys.length;i++){
      const key=keys[i];key.joints||={};
      const phase=2*Math.PI*i/Math.max(1,keys.length-1),wave=Math.sin(phase),scale=action==='run'?1.55:action==='walk'?1.05:action==='idle'?.42:1.2;
      let base=[wave*.55,0,0],mid=[wave*1.6*scale,0,0],tip=[Math.sin(phase-.7)*2.6*scale,0,0];
      if(action==='howl'){base=[0,-.5,1];mid=[wave*.8,0,2.5];tip=[Math.sin(phase)*1.4,0,4];}
      if(action==='pounce'||action==='attack'){base=[wave,0,1];mid=[wave*2.3,0,1.5];tip=[Math.sin(phase-.5)*3.5,0,1];}
      key.joints.tailBase??=base;key.joints.tailMid??=mid;key.joints.tailTip??=tip;
    }
  }
  next.articulatedTailRevision=1;
  return next;
}
