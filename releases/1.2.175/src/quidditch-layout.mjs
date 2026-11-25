export const QUIDDITCH_ROOM='quidditch-pitch';
export const QUIDDITCH_PITCH={left:7000,right:9000,top:4400,bottom:5820,cx:8000,cy:5110};
export const QUIDDITCH_TRUNK={x:8000,y:5110};
export const QUIDDITCH_RETURN={x:8000,y:5670};
export const QUIDDITCH_RACK={x:7920,y:5600};
export const QUIDDITCH_SCOREBOARD={x:9104,y:5535};
export const QUIDDITCH_ARRIVAL={x:8000,y:5575};
export const QUIDDITCH_SHOP_PORTKEY_LOCAL={x:76,y:-28};
export const QUIDDITCH_TEAMS={
 gold:{name:'Gold',color:'#e6b36a',dark:'#936441',side:-1,home:{x:7275,y:5410},spawn:{x:7560,y:5210}},
 violet:{name:'Violet',color:'#c09cee',dark:'#6a5389',side:1,home:{x:8725,y:5410},spawn:{x:8440,y:5210}},
};
export const QUIDDITCH_HOOPS=Object.entries(QUIDDITCH_TEAMS).flatMap(([team,{side}])=>[
 {team,x:8000+side*710,y:4966,z:64,radius:30},
 {team,x:8000+side*710,y:5110,z:98,radius:32},
 {team,x:8000+side*710,y:5254,z:74,radius:30},
]);
export const SNITCH_POINTS=3;
export const PITCH_FLIGHT_MIN=25;
export const PITCH_FLIGHT_MAX=128;

export const quidditchTrunkVisible=match=>match?.phase!=='playing';
const trunkFootprint={...QUIDDITCH_TRUNK,w:23,h:10};
const pitchFixtures=[{...QUIDDITCH_RETURN,w:13,h:8},{...QUIDDITCH_RACK,w:25,h:9},
 ...Object.values(QUIDDITCH_TEAMS).map(team=>({...team.home,w:14,h:9}))];

export function quidditchFieldBlocked(x,y,r=0,height=0,match=null){
 const b=QUIDDITCH_PITCH;
 if(x<b.left+r||x>b.right-r||y<b.top+r||y>b.bottom-r)return true;
 if(height>35)return false;
 const overlaps=p=>Math.abs(x-p.x)<p.w+r&&Math.abs(y-p.y)<p.h+r;
 return (quidditchTrunkVisible(match)&&overlaps(trunkFootprint))||pitchFixtures.some(overlaps)||
  QUIDDITCH_HOOPS.some(p=>Math.hypot(x-p.x,y-p.y)<4+r);
}
