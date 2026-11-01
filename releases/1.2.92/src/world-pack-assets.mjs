import {setLobbyPackBackdrop} from './lobby-backdrop.mjs';
const loaded=new WeakMap();
export function packAssets(g){return loaded.get(g)||{};}
export async function loadWorldPackAssets(g){
  if(!g.localWorld?.pack.assets)return;
  const paths=window.desktop?.worldPackAssets?await window.desktop.worldPackAssets(g.localWorld.pack.id):Object.fromEntries(Object.entries(g.localWorld.pack.assets).map(([k,v])=>[k,new URL('../worlds/'+g.localWorld.pack.id+'/'+v,import.meta.url).href]));
  const assets={};
  for(const [key,url]of Object.entries(paths)){
    if(['music','ambience'].includes(key))assets[key]=url;
    else{const image=new Image();image.src=url;assets[key]=image;}
  }loaded.set(g,assets);setLobbyPackBackdrop(assets.lobby);
}
export function packMusicPair(g,pair){const a=packAssets(g);return a.music?{calm:{id:g.localWorld.id+'-music',name:g.localWorld.pack.name,file:a.music},combat:a.ambience?{id:g.localWorld.id+'-ambience',name:g.localWorld.pack.name+' ambience',file:a.ambience}:pair.combat}:pair;}
