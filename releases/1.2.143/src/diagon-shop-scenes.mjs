import {groundShop, drawShopShell, shopArchitectureAssets, paintShopArchitectureAsset} from './diagon-shop-architecture.mjs';
import {ALLEY_SHOP_ROOMS, shopEntrySide, shopCutawayOpen, mirroredShopPoint} from './diagon-shop-rooms.mjs';
import {alleyMerchantActor} from './diagon-alley.mjs';
import {drawForestAsset} from './forest-props.mjs';
import {drawShopMirror} from './shop-mirror.mjs';

const rasters=new WeakMap();
let rasterCount=0;
const displays=new WeakMap();
const courtyard=new WeakMap();

export function alleyShopAssets(shop) {
  return [...shopArchitectureAssets(shop),...ALLEY_SHOP_ROOMS[shop.id].props];
}

export function drawAlleyShopAsset(c,shop,asset,x,y,time=0,g=null,animator=null) {
  c.save();
  c.translate(Math.round(x),Math.round(y));
  c.imageSmoothingEnabled=false;
  if(!asset.paint)paintShopArchitectureAsset(c,shop,asset.id);
  else if(asset.animated||typeof document==='undefined')asset.paint(c,time,g);
  else {
    const half=Math.ceil(asset.w/2)+3,top=asset.h+3;
    const variant=asset.rasterVariant?.(g)||0;
    let sprites=rasters.get(asset);
    if(!sprites){sprites=new Map();rasters.set(asset,sprites);}
    let sprite=sprites.get(variant);
    if(!sprite) {
      sprite=document.createElement('canvas');sprite.width=half*2+1;sprite.height=top+4;
      const pen=sprite.getContext('2d');
      pen.imageSmoothingEnabled=false;
      pen.translate(half,top);asset.paint(pen,0,asset.rasterVariant?g:undefined);
      sprites.set(variant,sprite);rasterCount++;
    }
    c.drawImage(sprite,-half,-top);
  }
  c.restore();
  if(asset.mirrorGlass)drawShopMirror(c,shop,asset.mirrorGlass,x,y,g,animator);
}

function mountProps(shop) {
  let groups=displays.get(shop);
  if(groups)return groups;
  const {props}=ALLEY_SHOP_ROOMS[shop.id];
  const children=new Map();
  for(const prop of props){
    if(!prop.surface)continue;
    const attached=children.get(prop.surface)||[];
    attached.push(prop);children.set(prop.surface,attached);
  }
  groups=props.filter(prop=>!prop.surface).map(prop=>({
    root:mirroredShopPoint(shop,prop),
    members:[prop,...children.get(prop.id)||[]].map(asset=>({asset,...mirroredShopPoint(shop,asset)})),
  }));
  displays.set(shop,groups);
  return groups;
}

const settings={
  flourish:['forest_round_shrub_medium','forest_woodland_daisy','forest_moss_rock_scatter'],
  malkins:['forest_round_shrub_small','forest_woodland_daisy','forest_meadow_tuft'],
  quidditch:['forest_limestone_rock','forest_moss_rock_pair','forest_meadow_tuft'],
  apothecary:['forest_porcini_pair','forest_moss_rock_pair','forest_woodland_daisy'],
  eeylops:['forest_round_shrub_medium','forest_meadow_tuft','forest_limestone_pebble'],
  floreans:['forest_woodland_daisy','forest_round_shrub_small','forest_woodland_daisy'],
  gringotts:['forest_round_shrub_small','forest_limestone_pebble','forest_round_shrub_small'],
  'nocturne-curios':['forest_moss_rock_pair','forest_porcini_pair','forest_limestone_pebble'],
  nightglass:['forest_round_shrub_small','forest_moss_rock_scatter','forest_porcini_pair'],
  'borgin-burkes':['forest_moss_rock_pair','forest_round_shrub_small','forest_limestone_pebble'],
  bellglass:['forest_round_shrub_small','forest_woodland_daisy','forest_meadow_tuft'],
  'meridian-hall':['forest_limestone_rock','forest_moss_rock_pair','forest_round_shrub_small'],
  'wrong-turn':['forest_moss_rock_pair','forest_limestone_pebble','forest_round_shrub_small'],
};
function garden(shop){
  let plants=courtyard.get(shop);
  if(!plants){
    const at=[[-126,-3,45],[-74,105,38],[101,102,44]];
    plants=settings[shop.id].map((forestAsset,i)=>{
      const [x,y,size]=at[i], pos=mirroredShopPoint(shop,{x,y});
      return {...pos,rootY:pos.y,size,forestAsset};
    });
    courtyard.set(shop,plants);
  }
  return plants;
}

export function assembleAlleyShop(c,shop,g,objects,animator=null) {
  const side=shopEntrySide(shop),room=ALLEY_SHOP_ROOMS[shop.id];
  const open=shopCutawayOpen(shop,g.players)||shop.id==='floreans'&&shopCutawayOpen(shop,g.trainTest?.alleyVisitors||[]);
  groundShop(c,shop,side,open,room.props);
  for(const plant of garden(shop))objects.push({depth:plant.rootY,paint:()=>drawForestAsset(c,plant,g.time,g)});
  if(!open){
    objects.push({depth:shop.y+82,paint:()=>drawShopShell(c,shop,side,false)});
    return;
  }
  drawShopShell(c,shop,side,true);
  for(const {root,members} of mountProps(shop)){
    objects.push({depth:root.y+(members[0].asset.depthOffset||0),paint:()=>{
      for(const {asset,x,y} of members)drawAlleyShopAsset(c,shop,asset,x,y,g.time,g,animator);
    }});
  }
  const actor=alleyMerchantActor(shop);
  objects.push({depth:actor.y,player:actor});
}

export function alleyShopPropRasterCount(){return rasterCount;}
