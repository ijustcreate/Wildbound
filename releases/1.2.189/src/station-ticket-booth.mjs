import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {stationVisualTheme} from './station-polish.mjs';
import {block as b,shape as p} from './diagon-shop-brush.mjs';
import {drawPixelChatText,pixelChatTextWidth} from './pixel-chat-font.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';

const clerks={
 jungle:['Mara Reed',  'braids',  '#2d271f','#a56f51','#445c4b','#303b37','freckles'],
 ice:   ['Ellis Rime', 'sidepart','#a89b89','#ddad91','#4a5b74','#353e51','stubble'],
 swamp: ['Nessa Sedge','locs',    '#362725','#83553f','#5c6044','#484230','glasses'],
 east:  ['Bram Venn',  'curls',   '#6d4932','#bf8b61','#6c4b3b','#4e4031','beard'],
 beach: ['Iona Sands', 'bob',     '#d39a65','#b7835e','#3d6869','#3e5656','freckles'],
 house: ['Tarin Vale', 'crop',    '#4b362f','#c3986f','#68524f','#494456','classic'],
 graveyard:['Edith Wick','waves', '#9e9b94','#b98171','#51485e','#3e364a','glasses'],
 west:  ['Felix Tide', 'afro',    '#312927','#8c5d48','#4d6577','#37434d','goatee'],
 lakewood:['Ada Quill','pixie',   '#884f43','#dca78a','#4c6457','#414536','scar'],
};
const customFirst=['Ceri','Jory','Lena','Orin','Vera','Mina','Rafe','Sela','Perry','Naia','Ari','Tess'];
const customLast=['Moor','Flint','Bex','Harper','Fenn','Ashe','Rowan','Pryce','Loam','Bracken','Holt','Ives','Sprig','Venner','Wren','Slate','Mallow'];

function clerkLook(station,stationId){
 const known=clerks[station.visualId||(!station.id?'lakewood':station.id)];
 if(known)return known;
 let seed=2166136261;
 for(const char of stationId+':'+station.name)seed=Math.imul(seed^char.charCodeAt(0),16777619);
 const key=seed>>>0,variants=Object.values(clerks);
 const [, ...look]=variants[key%variants.length];
 return [customFirst[(key>>>4)%customFirst.length]+' '+customLast[(key>>>14)%customLast.length],...look];
}

export const ticketBoothFootprint=(x,y)=>({x:x-28,y:y-19,w:56,h:25});

export function makeStationTicketBooth(station,x,y,inside){
 const stationId=station.visualId||station.id||'station-0',id='station-ticket-booth-'+stationId;
 const [name,hair,hairColor,skin,shirt,pants,face]=clerkLook(station,stationId);
 const seller={id:id+'-seller',name,sprite:'player',kind:'player',hp:1,invincible:true,unattackable:true,
  x,y:y-9,faceX:0,faceY:1,moving:false,equipment:{},appearance:{...DEFAULT_APPEARANCE,
   trainTicketSeller:true,hair,hairColor,skin,shirt,pants,face,shoes:'#373132'}};
 return {id,stationId,stationName:station.name||'Lakewood',x,y,inside,seller,
  theme:stationVisualTheme(station),footprint:ticketBoothFootprint(x,y),approach:{x,y:y+30}};
}

function paintBack(c,theme){
 const [dark,mid,lit,trim]=theme.wood,[eave,rim,tile,tileLight]=theme.roof;
 p(c,'#252b2977',[[-36,1],[-33,-8],[27,-15],[40,-4],[43,8],[29,13],[-28,12]]);
 b(c,-35,0,70,6,theme.paving[0]);b(c,-33,0,66,2,theme.paving[3]);
 b(c,-28,-58,56,59,dark);b(c,-25,-55,50,53,'#373936');
 b(c,-23,-51,46,30,'#49453e');b(c,-22,-49,44,2,'#666155');
 for(const side of [-1,1]){
  const x=side*26;
  b(c,x-3,-57,7,59,dark);b(c,x-2,-54,5,54,lit);
  b(c,x-1,-54,1,52,trim);
 }
 p(c,eave,[[-38,-59],[-34,-69],[-25,-76],[24,-76],[34,-68],[39,-59],[36,-52],[-37,-52]]);
 p(c,tile,[[-36,-60],[-30,-68],[-23,-74],[23,-74],[32,-66],[36,-60]]);
 p(c,rim,[[6,-74],[25,-74],[33,-66],[36,-61],[28,-60]]);
 b(c,-29,-69,47,1,tileLight);b(c,-35,-61,68,1,tileLight);
 for(const [x,y,w]of [[-18,-65,11],[3,-65,10],[20,-65,9],[-29,-63,7],[11,-63,8]])b(c,x,y,w,1,rim);
 b(c,-37,-58,75,5,eave);b(c,-35,-57,71,2,mid);
 b(c,-22,-57,44,12,dark);b(c,-21,-55,42,8,trim);b(c,-19,-54,38,6,dark);
 const sign='TICKETS';drawPixelChatText(c,sign,-pixelChatTextWidth(sign)/2,-54,'#f3dca3');
}

function paintFront(c,theme){
 const [dark,mid,lit,trim]=theme.wood;
 b(c,-28,-19,56,19,dark);b(c,-26,-16,52,15,mid);b(c,-23,-13,46,10,lit);
 for(const x of [-22,-10,6,20])b(c,x,-12,1,8,mid);
 b(c,-26,-3,52,2,dark);b(c,-24,-2,48,1,trim);
 p(c,dark,[[-34,-19],[-31,-25],[28,-25],[34,-21],[34,-17],[-34,-17]]);
 p(c,lit,[[-32,-21],[-29,-24],[28,-24],[32,-21],[28,-20],[-30,-20]]);
 b(c,-30,-20,59,2,trim);b(c,-33,-17,66,2,dark);
 b(c,-22,-25,12,3,'#63503a');b(c,-21,-26,10,3,'#e3bd76');b(c,-19,-26,4,1,'#f4d697');
 b(c,15,-26,9,3,'#6b5848');b(c,16,-27,7,3,'#dcc19b');b(c,20,-27,3,1,'#806b55');
 b(c,-29,-38,7,11,'#554338');b(c,-28,-37,5,7,'#b68950');b(c,-27,-36,3,5,'#e9bd75');
}

const rasters=new WeakMap();
function layer(c,theme,face,painter){
 if(typeof OffscreenCanvas!=='function'&&typeof document==='undefined'){painter(c,theme);return;}
 let sides=rasters.get(theme);
 if(!sides){sides={};rasters.set(theme,sides);}
 let canvas=sides[face];
 if(!canvas){
  canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(96,94):document.createElement('canvas');
  canvas.width=96;canvas.height=94;
  const pen=canvas.getContext('2d');pen.translate(47,79);painter(pen,theme);sides[face]=canvas;
 }
 c.drawImage(canvas,-47,-79);
}

export function drawStationTicketBooth(c,booth,time,renderer){
 c.save();c.translate(booth.x,booth.y);c.imageSmoothingEnabled=false;
 layer(c,booth.theme,'back',paintBack);
 c.save();c.beginPath();c.rect(-22,-48,44,29);c.clip();
 renderer.animator.draw(c,{...booth.seller,x:0,y:booth.seller.y-booth.y},time,PLAYER_RENDER_SIZE);
 c.restore();
 layer(c,booth.theme,'front',paintFront);c.restore();
}
