import {ALLEY_STREET_PROPS} from './diagon-alley-props.mjs';
import {ALLEY_SHOPS} from './diagon-alley.mjs';
import {shopCutawayOpen} from './diagon-shop-rooms.mjs';
import {SHOP_FRONTAGES} from './diagon-shop-frontages.mjs';
import {mageGardenFootstep} from './diagon-mage-garden.mjs';

export const DIAGON_FOUNTAIN_AUDIO={key:'diagon-fountain',kind:'cascade',x:8000,y:4163,radius:440,gain:.26};

function atProp(id,values){
 const {x,y}=ALLEY_STREET_PROPS.find(prop=>prop.id===id);
 return {key:'diagon-'+id,x,y,...values};
}

export const DIAGON_AMBIENCE=[
 DIAGON_FOUNTAIN_AUDIO,
 {key:'diagon-garden-pool',kind:'cascade',x:7401,y:4070,radius:230,gain:.118},
 atProp('basin',{kind:'cascade',radius:160,gain:.086}),
 atProp('cart',{kind:'steam',radius:130,gain:.045}),
 atProp('brazier',{kind:'fire',radius:145,gain:.079}),
];

export const DIAGON_FOLEY=[
 atProp('clock',{cue:'alleyClock',interval:10}),
 atProp('books',{cue:'alleyPages',interval:14}),
 atProp('cloth',{cue:'alleyCloth',interval:11}),
 atProp('perch',{cue:'alleyPerch',interval:13}),
 atProp('letterbox',{cue:'alleyPost',interval:16}),
 atProp('cart',{cue:'alleyKettle',interval:12}),
 {key:'diagon-garden-perch',x:7390,y:3932,cue:'alleyPerch',interval:17},
];

export const inDiagonAudio=game=>game?.trainTest?.design?.activeRoom==='diagon';
const containingShop=player=>ALLEY_SHOPS.find(shop=>shopCutawayOpen(shop,[player]));

export function diagonStreetListeners(listeners){
 return listeners.filter(player=>player.hp>0&&!player.room&&!containingShop(player));
}

export function diagonFloorMaterial(x,y){
 const shop=containingShop({x,y});
 return shop?SHOP_FRONTAGES[shop.id]?.surface||'wood':mageGardenFootstep(x,y)||'stone';
}

// Overlapping, short bubble resonances sit over the continuous falling water.
// Use a longer buffer so the individual splashes don't form an obvious rhythm.
export function fillCascade(samples,sampleRate){
 let smoothed=0,body=0,phase=0,ring=0,rate=0;
 for(let i=0;i<samples.length;i++){
  const noise=Math.random()*2-1;
  smoothed+=(noise-smoothed)*.22;
  body+=(smoothed-body)*.075;
  if(Math.random()<30/sampleRate){
   ring=.1+Math.random()*.16;
   rate=(720+Math.random()*1780)*Math.PI*2/sampleRate;
  }
  phase+=rate;
  rate*=.99991;
  ring*=.9968;
  const foam=.78+.15*Math.sin(i/sampleRate*13)+.07*Math.sin(i/sampleRate*27);
  samples[i]=foam*(.56*smoothed+.22*body)+ring*(Math.sin(phase)*.56+noise*.44);
 }
}
