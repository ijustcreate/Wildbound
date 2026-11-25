const fur=(body,shade,light,outline)=>({body,shade,light,outline});
const charcoal=fur('#343940','#222930','#565d65','#20262b');
const cream=fur('#e7dac3','#ab9e8e','#fff0d6','#4e4037');
const copper=fur('#bd7745','#8c5034','#e2a366','#56392f');
const cinnamon=fur('#78452f','#573225','#b26a42','#56392f');
const silver=fur('#8d9999','#606d72','#bec5ba','#3c464e');
const slate=fur('#4f5b68','#36434e','#788691','#3c464e');
const seal=fur('#685047','#493938','#927065','#443635');

const bodyStripes=(x,y,z)=>Math.abs(Math.sin((y+Math.abs(x)*.17+z*.12)*9.5))<.4;
const foreheadStripes=(x,y,z)=>z>.22&&Math.abs(x)<.68&&Math.abs(Math.sin((x+(1-y)*.16)*10))<.47;
const pattern=(key,material)=>({key,material});
function tabby(key,base,stripe,muzzle,eye){
 return {fur:base,paws:muzzle,bib:muzzle,muzzle,ears:stripe,tip:stripe,eye,
  bodyPattern:pattern(key+'-body',(x,y,z)=>bodyStripes(x,y,z)?stripe:null),
  headPattern:pattern(key+'-head',(x,y,z)=>foreheadStripes(x,y,z)?stripe:null)};
}

const withinPatch=(x,y,cx,cy,width,length)=>((x-cx)/width)**2+((y-cy)/length)**2<1;
const calicos=Array.from({length:8},(_,layout)=>{
 const side=layout&1?-1:1,drift=(layout%4-1.5)*.12,reverse=layout&4;
 const back=reverse?charcoal:copper,shoulder=reverse?copper:charcoal;
 return {fur:cream,paws:cream,bib:cream,muzzle:cream,ears:side>0?back:shoulder,earRight:side>0?shoulder:back,tip:shoulder,eye:'#b2bd70',
  bodyPattern:pattern('calico-body-'+layout,(x,y)=>{
   if(withinPatch(x,y,side*.58,-.46+drift,.74,.58))return back;
   if(withinPatch(x,y,-side*.62,.31+drift,.81,.53))return shoulder;
   if(withinPatch(x,y,side*.78,.58-drift,.48,.31))return back;
  }),
  headPattern:pattern('calico-head-'+layout,(x,y,z)=>z>-.45?
   withinPatch(x,y,side*.51,.20+drift,.64,.85)?shoulder:
    withinPatch(x,y,-side*.66,-.30+drift,.64,.62)?back:null:null)};
});

export const CAT_COATS=Object.freeze(['tuxedo','black','ginger-tabby','silver-tabby','calico','seal-point']);
const coats={
 black:{fur:charcoal,paws:charcoal,bib:charcoal,muzzle:charcoal,ears:charcoal,tip:charcoal,eye:'#d9bb68'},
 'ginger-tabby':tabby('ginger',copper,cinnamon,fur('#dbac7f','#aa744f','#ffcf99','#67422d'),'#c7c078'),
 'silver-tabby':tabby('silver',silver,slate,fur('#c0c6bc','#8b9b9d','#e4dfcf','#505c60'),'#a4bf79'),
 'seal-point':{fur:cream,paws:seal,bib:cream,muzzle:seal,ears:seal,tip:seal,eye:'#93cbdc',
  headPattern:pattern('seal-mask',(x,y,z)=>y>.1&&z<.75-Math.abs(x)*.48?seal:null)},
};

function hash(value){
 let seed=2166136261;
 for(const char of value)seed=Math.imul(seed^char.charCodeAt(0),16777619);
 return (seed^seed>>>15)>>>0;
}

export function honeyCatCoat(actor){
 const id=String(actor.stationCatId??actor.id??''),station=/^(.*)-cat-(\d+)$/.exec(id);
 const index=station?hash(station[1])+Number(station[2]):actor.stationCatId?hash(id):0;
 const name=CAT_COATS.includes(actor.catCoat)?actor.catCoat:CAT_COATS[index%CAT_COATS.length];
 return name==='calico'?calicos[hash(String(actor.catCoatSeed??id))%calicos.length]:coats[name];
}
