import {drawClothHeadwear,drawClothHeadwearIcon} from './headwear-cloth-art.mjs';
import {drawCrownHeadwear,drawCrownHeadwearIcon} from './headwear-crowns-art.mjs';
import {drawMaskHeadwear,drawMaskHeadwearIcon} from './headwear-masks-art.mjs';

export function drawHeadwearArtwork(c,h,d,id,p,time=0){
 return drawClothHeadwear(c,h,d,id,p,time)||drawCrownHeadwear(c,h,d,id,p,time)||drawMaskHeadwear(c,h,d,id,p,time);
}

export function drawHeadwearIcon(c,id,p){
 return drawClothHeadwearIcon(c,id,p)||drawCrownHeadwearIcon(c,id,p)||drawMaskHeadwearIcon(c,id,p);
}
