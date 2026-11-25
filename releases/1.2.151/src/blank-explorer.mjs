// Native costume/preview data, shared by the chooser and the real equipment item.
export const BLANK_EXPLORER_ITEM='blank_explorer_costume';
export const BLANK_EXPLORER_COLORS={outline:'#414b4d',shade:'#697476',body:'#8b9596',light:'#b1baba',mark:'#b7c0bf'};
export const BLANK_EXPLORER_LOOK={skin:'#8b9596',shirt:'#858f90',pants:'#7e898b',shoes:'#677274',hair:'none',hairColor:'#8b9596',face:'classic',build:'standard'};
export function blankExplorerPreview(){return {name:'Unclaimed explorer',hp:100,equipment:{chest:BLANK_EXPLORER_ITEM},appearance:{...BLANK_EXPLORER_LOOK},field:{cosmetics:{}}};}
export function drawBlankExplorerFace(c,head,d){
 if(d>=3&&d<=5)return;
 const profile=d===2||d===6,sign=d<4?-1:1,x=Math.round(head.x)+(profile?sign*2:d===1?-1:d===7?1:-1),y=Math.round(head.y)-3;
 c.fillStyle=BLANK_EXPLORER_COLORS.mark;
 if(profile){c.fillRect(x,y,1,1);c.fillRect(x,y+2,1,1);c.fillRect(x,y+4,1,1);return;}
 for(const [dx,dy,w,h]of [[0,0,2,1],[2,1,1,1],[1,2,1,1],[1,4,1,1]])c.fillRect(x+dx,y+dy,w,h);
}
