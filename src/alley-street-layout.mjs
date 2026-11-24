const DIAGON_CENTER=8000,NOCTURNE_CENTER=9093,LANE_SCALE=.7;
const inset=width=>Math.round(width*(1-LANE_SCALE)/2);
export const DIAGON_STREET_INSET=inset(480);
export const NOCTURNE_STREET_INSET=inset(246);

export const DIAGON_STREET=Object.freeze({x:7760+DIAGON_STREET_INSET,y:3905,w:480-2*DIAGON_STREET_INSET,h:1845});
export const NOCTURNE_LANE=Object.freeze({x:8970+NOCTURNE_STREET_INSET,y:4535,w:246-2*NOCTURNE_STREET_INSET,h:1073});
export const DIAGON_PAVER_LANE=Object.freeze({x:7810+inset(380),w:380-2*inset(380)});
export const NOCTURNE_CONNECTOR=Object.freeze({x:8180-DIAGON_STREET_INSET,y:5181,w:1030+DIAGON_STREET_INSET,h:105});

export const diagonLaneX=x=>Math.round(DIAGON_CENTER+(x-DIAGON_CENTER)*LANE_SCALE);
export const nocturneLaneX=x=>Math.round(NOCTURNE_CENTER+(x-NOCTURNE_CENTER)*LANE_SCALE);

export const shopEntrySide=shop=>shop.frontEntrance||shop.x<DIAGON_CENTER?1:-1;

export function mirroredShopPoint(shop,point){
 return {x:shop.x+point.x*shopEntrySide(shop),y:shop.y+point.y};
}

export function shopLocalPosition(shop,x,y){
 return {x:(x-shop.x)*shopEntrySide(shop),y:y-shop.y};
}
