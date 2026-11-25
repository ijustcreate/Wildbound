import {PIXELFX_EFFECTS} from './pixelfx-runtime.mjs';
// IDs match the public 42-place implementation checklist. All slots remain editable.
const rows=[
 ['hit','impacts/hit-spark',.65],['heavy','melee/heavy-cleave',.8],['dash','melee/sword-slash',.8],
 ['block','impacts/shield-block',.65],['parry','impacts/parry',.8],['bow','impacts/hit-spark',.3],
 ['muzzle','projectiles/muzzle-pistol',.6],['bullet','impacts/bullet-impact',.7],['charge','arcane/spell-charge',.65],['magic','arcane/mana-burst',.6],
 ['burning','status/burning',1],['poison','status/poisoned',1],['frozen','status/frozen',1],['ice-break','ice/ice-shatter',.7],
 ['stunned','status/stunned',1],['sleep','status/sleep',1],['charm','status/charmed',1],['slow','status/slowed',1],
 ['heal','holy/heal',.8],['revive','holy/resurrection',.75],['life-steal','shadow/life-steal',.7],
 ['xp','pickups/collect-burst',.5],['coin','ui/coin-collect',.65],['chest','pickups/chest-open',.7],['loot','pickups/loot-beam',.55],['quest','ui/quest-complete',.7],
 ['torch','fire/torch',.7],['campfire','fire/campfire',.7],['fog','weather/fog',1],['fireflies','weather/fireflies',.7],['leaves','weather/falling-leaves',1],
 ['rain-splash','water/rain-splash',.7],['snow','weather/snow',1],['splash','water/splash',.8],['wake','water/ripples',.65],['bubbles','water/bubbles',.6],
 ['travel','arcane/blink-out',1],['brake','lightning/spark-arc',.35],['car-water','water/splash',1.5],['debris','explosions/dirt-explosion',.65],
 ['salvage','pickups/collect-burst',.65],['board','arcane/rune-circle',.55],
 ['cut-impact','melee/sword-slash',.65],['wall-impact','explosions/dirt-explosion',.62],['thermal-burst','impacts/crit-hit',.68],
];
export const GAMEPLAY_FX=Object.fromEntries(rows.map(([id,module,scale],i)=>[id,{number:i+1,slot:'game-'+id,module,scale}]));
export const GAMEPLAY_FX_ALIASES={'torch':'game-torch','campfire-flame':'game-campfire','splash':'game-splash','swim-wake':'game-wake','bubbles':'game-bubbles','salvage-burst':'game-salvage'};
export const GAMEPLAY_FX_PRESETS=Object.fromEntries(rows.map(([id,module,scale])=>{
 const preset=PIXELFX_EFFECTS['pfx-'+module.replaceAll('/','-')];if(!preset)throw Error('Missing gameplay FX '+module);
 return ['game-'+id,{...preset,name:'Wildbound · '+id.replaceAll('-',' '),pxScale:scale,gameplay:true,...(module==='water/splash'?{pxOptions:{stone:false}}:{})}];
}));
