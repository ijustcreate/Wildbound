const copy=v=>structuredClone(v),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function sameArenaPixels(a,b){
 if(!a||!b||['x','y','width','height'].some(k=>a[k]!==b[k])||a.pixels.length!==b.pixels.length)return false;
 const color=(s,i)=>s.pixels[i]?(s.palette[s.pixels[i]]||'transparent').toLowerCase():'transparent';
 return a.pixels.every((_,i)=>color(a,i)===color(b,i));
}
export function mergeArenaDesign(saved,legacy,next){
 if(!saved)return copy(next);const model=copy(saved);model.artGeneration=2;
 for(const group of ['palette','shape']){model[group]||={};for(const [key,value]of Object.entries(next[group]))if(model[group][key]===undefined||equal(model[group][key],legacy[group]?.[key]))model[group][key]=copy(value);}
 for(const [key,value]of Object.entries(next.joints))if(!model.joints[key]||equal(model.joints[key],legacy.joints[key]))model.joints[key]=copy(value);
 for(const [key,value]of Object.entries(next.clips))if(!model.clips[key]||equal(model.clips[key],legacy.clips[key]))model.clips[key]=copy(value);
 return model;
}
