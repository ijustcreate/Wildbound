// Extend crossing rows through wadeable shore tiles on generation and load.
export function connectForestBridgeBanks(terrain){
 if(!terrain)return;
 for(let y=0;y<50;y++)for(let x=0;x<50;x++){
  if(terrain[y*50+x]!=='bridge')continue;
  for(const direction of [-1,1]){
   let end=x+direction;
   while(end>=0&&end<50&&terrain[y*50+end]==='shallow')end+=direction;
   if(end<0||end>=50||terrain[y*50+end]!=='grass')continue;
   for(let bank=x+direction;bank!==end;bank+=direction)terrain[y*50+bank]='bridge';
  }
 }
}
