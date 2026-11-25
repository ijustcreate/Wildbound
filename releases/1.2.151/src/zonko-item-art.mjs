import firework from '../assets/pixel-recipes/zonko-firework.pixel.json' with {type:'json'};
import candy from '../assets/pixel-recipes/flaming-footprints.pixel.json' with {type:'json'};
import {compilePixelRecipe} from './pixel-recipe.mjs';
import {drawPixelRecipe} from './pixel-recipe-canvas.mjs';

const icons={zonko_firework:compilePixelRecipe(firework),flaming_footprints:compilePixelRecipe(candy)};

export function paintZonkoConsumableIcon(c,type){
 const recipe=icons[type];if(!recipe)return false;
 drawPixelRecipe(c,recipe,0,0,0);return true;
}
