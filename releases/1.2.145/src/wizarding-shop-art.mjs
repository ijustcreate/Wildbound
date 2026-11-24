import {compilePixelRecipe} from './pixel-recipe.mjs';
import firebolt from '../assets/pixel-recipes/diagon-alley/firebolt-icon.pixel.json' with {type:'json'};
import battle from '../assets/pixel-recipes/diagon-alley/battle-charms.pixel.json' with {type:'json'};
import casting from '../assets/pixel-recipes/diagon-alley/efficient-casting.pixel.json' with {type:'json'};
import healing from '../assets/pixel-recipes/diagon-alley/healing-charms.pixel.json' with {type:'json'};
import renewal from '../assets/pixel-recipes/diagon-alley/mana-runes.pixel.json' with {type:'json'};

const recipes={firebolt,alley_battle_charms:battle,alley_efficient_casting:casting,
 alley_healing_charms:healing,alley_mana_runes:renewal};
const icons=Object.fromEntries(Object.entries(recipes).map(([id,spec])=>[id,compilePixelRecipe(spec).sprite]));

export function paintWizardingShopIcon(c,type,x=0,y=0){
 const sprite=icons[type];
 if(!sprite)return false;
 const {width,height,palette,pixels}=sprite;
 for(let row=0;row<height;row++){
  for(let col=0;col<width;){
   const at=row*width+col,ink=pixels[at];
   let end=col+1;
   while(end<width&&pixels[row*width+end]===ink)end++;
   if(ink){c.fillStyle=palette[ink];c.fillRect(x+col,y+row,end-col,1);}
   col=end;
  }
 }
 return true;
}
