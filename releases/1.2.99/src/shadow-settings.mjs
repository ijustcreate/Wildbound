const KEY='wildbound-shadow-style';

/** Dynamic world shadows are the default; the legacy blob style is an explicit fallback. */
export function dynamicShadowsEnabled(storage=globalThis.localStorage){
 try{return storage?.getItem(KEY)!=='simple';}catch{return true;}
}
export function setDynamicShadowsEnabled(enabled,storage=globalThis.localStorage){
 const value=!!enabled;
 try{storage?.setItem(KEY,value?'dynamic':'simple');}catch{}
 return value;
}
