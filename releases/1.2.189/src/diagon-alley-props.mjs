import {compilePixelRecipe} from './pixel-recipe.mjs';
import {drawPixelRecipe} from './pixel-recipe-canvas.mjs';
import {block,shape} from './diagon-shop-brush.mjs';
import {diagonLaneX} from './alley-street-layout.mjs';
import fingerpost from '../assets/pixel-recipes/diagon-alley/brass-fingerpost.pixel.json' with {type:'json'};
import clock from '../assets/pixel-recipes/diagon-alley/street-clock.pixel.json' with {type:'json'};
import barrel from '../assets/pixel-recipes/diagon-alley/brass-bound-barrel.pixel.json' with {type:'json'};
import books from '../assets/pixel-recipes/diagon-alley/chained-book-stack.pixel.json' with {type:'json'};
import cloth from '../assets/pixel-recipes/diagon-alley/folded-cloth-stand.pixel.json' with {type:'json'};
import brooms from '../assets/pixel-recipes/diagon-alley/broom-stand.pixel.json' with {type:'json'};
import bench from '../assets/pixel-recipes/diagon-alley/iron-bench.pixel.json' with {type:'json'};
import perch from '../assets/pixel-recipes/diagon-alley/caged-owl-perch.pixel.json' with {type:'json'};
import planter from '../assets/pixel-recipes/diagon-alley/herb-planter.pixel.json' with {type:'json'};
import letterbox from '../assets/pixel-recipes/diagon-alley/owl-post-letterbox.pixel.json' with {type:'json'};
import cart from '../assets/pixel-recipes/diagon-alley/copper-kettle-cart.pixel.json' with {type:'json'};
import basin from '../assets/pixel-recipes/diagon-alley/stone-drinking-basin.pixel.json' with {type:'json'};
import brazier from '../assets/pixel-recipes/diagon-alley/iron-brazier.pixel.json' with {type:'json'};

// Put shop displays beside their doors and keep the middle of the street open.
// The footprint is at the base. Overhanging signs and furniture tops sort above it.
export const ALLEY_STREET_PROPS=[
  ['fingerpost',fingerpost,7758,4108,6,5],['clock',clock,8228,4120,6,5],
  ['barrel',barrel,7768,4300,8,7],['books',books,8230,4322,9,6],
  ['cloth',cloth,7768,4550,11,7],['brooms',brooms,8220,4562,10,7],
  ['bench',bench,7765,4784,15,7],['perch',perch,8234,4875,7,6],
  ['planter',planter,7764,4954,12,7],['letterbox',letterbox,8233,5104,6,5],
  ['cart',cart,7770,5145,15,8],['basin',basin,7763,5460,10,8],
  ['brazier',brazier,8223,5557,8,7],
].map(([id,source,x,y,halfWidth,halfDepth])=>({id,x:diagonLaneX(x+(x<8000?49:-49)),y,halfWidth,halfDepth,recipe:compilePixelRecipe(source)}));

export function alleyStreetPropBlocked(x,y,radius){
  return ALLEY_STREET_PROPS.some(prop=>Math.abs(x-prop.x)<prop.halfWidth+radius&&Math.abs(y-prop.y)<prop.halfDepth+radius);
}

function paintContact(c,prop,time){
  const {x,y,halfWidth:w,halfDepth:h}=prop;
  shape(c,'#313a3466',[[x-w-2,y],[x-w+2,y-h],[x+w,y-h],[x+w+4,y],[x+w,y+h-2],[x-w+2,y+h-2]]);
  if(prop.id==='brazier'){
    const lit=1+Math.sin(time*9)*.08;
    for(const [radius,color] of [[22,'#e7ae6322'],[15,'#f6c97e2c'],[9,'#ffdea23c']]){
      const r=radius*lit;
      shape(c,color,[[x-r,y],[x-r*.58,y-r*.36],[x+r*.55,y-r*.36],[x+r,y],[x+r*.58,y+r*.38],[x-r*.55,y+r*.38]]);
    }
  }
}

export function queueAlleyStreetProps(c,time,visible,objects){
  for(const prop of ALLEY_STREET_PROPS){
    if(!visible(prop.x,prop.y,44,55))continue;
    paintContact(c,prop,time);
    objects.push({depth:prop.y+prop.halfDepth,paint:()=>{
      drawPixelRecipe(c,prop.recipe,time*1000,prop.x,prop.y);
      if(prop.id==='cart')for(let i=0;i<3;i++){
        const rise=(time*.9+i/3)%1;
        c.save();c.globalAlpha=(1-rise)*.55;
        block(c,prop.x+Math.round(Math.sin(rise*3+i)*3)-2,prop.y-27-Math.round(rise*12),2,2,'#ded8bb');
        c.restore();
      }
    }});
  }
}
