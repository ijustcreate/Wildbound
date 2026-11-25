export const HOGSMEADE_BUILDINGS=[
 {id:'three-broomsticks',name:'The Three Broomsticks',x:7855,y:4026,w:244,h:162,tone:'inn'},
 {id:'zonkos',name:"Zonko's Joke Shop",x:8494,y:3962,w:222,h:168,tone:'joke'},
 {id:'shrieking-shack',name:'The Shrieking Shack',x:8786,y:4070,w:206,h:174,tone:'shack'},
];

export const HOGSMEADE_LANE={left:7715,right:8924,top:4146,bottom:4234};
export const HOGSMEADE_SHACK=HOGSMEADE_BUILDINGS[2];
export const hogsmeadeDoor=building=>({x:building.x,y:building.y+building.h/2,half:18});
export const inHogsmeadeBuilding=(site,x,y,pad=0)=>Math.abs(x-site.x)<site.w/2+pad&&Math.abs(y-site.y)<site.h/2+pad;
export const inHogsmeade=(x,y,pad=0)=>x>=HOGSMEADE_LANE.left-pad&&x<=HOGSMEADE_LANE.right+pad&&
 y>=3918-pad&&y<=HOGSMEADE_LANE.bottom+pad;

const plans=[[
 ['oak-bar','case',-49,-20,100,24,'oak'],['brass-taps','rack',-54,-47,66,31,'brass'],
 ['butterbeer-tankards','display',-50,-27,40,13,'amber'],['butterbeer-keg','crate',105,-24,24,27,'oak'],
 ['three-crossed-broomsticks','brooms',0,95,49,41,'amber'],['stone-hearth','hearth',79,-59,42,46,'moss'],
 ['long-window-bench','bench',-76,43,39,14,'oak'],['fireside-settle','bench',92,13,33,15,'rust'],
 ['round-tavern-table','table',60,37,41,24,'oak'],['scuffed-drinks-table','table',-77,31,34,21,'rust'],
 ['stew-cauldron','cauldron',40,-52,23,19,'moss'],['ceramic-plates','display',59,26,19,10,'blue'],
 ['scarf-and-coat-hooks','fabric',-89,-49,32,26,'rust'],['small-brass-lantern','lamp',109,49,14,29,'amber'],
 ['mince-pie-tray','food',-26,-28,25,11,'amber'],
],[
 ['striped-till-counter','case',-42,-24,92,22,'plum'],['wildfire-firework-cabinet','cabinet',-66,-47,63,44,'rust'],
 ['dungbomb-crates','crate',85,43,34,22,'moss'],['frog-spawn-soap-tub','cauldron',77,-39,26,22,'green'],
 ['hiccough-sweet-jars','bottles',34,-49,40,25,'amber'],['whizzing-toy-display','display',-67,46,38,18,'green'],
 ['nose-biting-teacup-tray','food',-42,-30,24,12,'blue'],['trick-wand-stand','rack',76,12,29,36,'plum'],
 ['wall-of-joke-boxes','cabinet',-9,-52,45,35,'plum'],['jester-bell-banner','fabric',84,-51,20,36,'rust'],
 ['brass-packet-scales','lamp',-11,-31,15,21,'brass'],['fanged-frisbee-stack','display',-82,5,25,15,'rust'],
 ['tickling-powder-vials','bottles',60,-45,28,16,'blue'],['grinning-jester-poster','picture',-78,-61,23,29,'plum'],
 ['trick-stock-lockbox','crate',-80,67,43,19,'oak'],
],[
 ['four-poster-bed','bed',-61,-33,57,48,'plum'],['torn-bed-curtains','fabric',-71,-47,33,40,'plum'],
 ['out-of-tune-piano','piano',56,-34,56,29,'oak'],['cracked-looking-glass','mirror',77,-52,30,44,'blue'],
 ['splintered-chair','bench',67,39,31,23,'oak'],['clawed-wardrobe','cabinet',7,-54,37,49,'moss'],
 ['two-clawed-floorboards','scars',-47,13,44,11,'rust'],['fallen-plaster','debris',74,55,38,11,'moss'],
 ['crooked-family-frames','picture',-31,-65,32,20,'oak'],['paw-trail','scars',-20,59,29,15,'moss'],
 ['discarded-chain','rack',66,-1,29,17,'blue'],['unlit-tallow-lantern','lamp',-76,61,14,23,'brass'],
 ['overturned-nightstand','table',-72,33,30,19,'oak'],
]];

export const HOGSMEADE_PROPS=plans.flatMap((plan,index)=>plan.map(([id,kind,x,y,w,h,palette])=>({
 id,kind,x,y,w,h,palette,building:HOGSMEADE_BUILDINGS[index],
 solid:['case','crate','bench','table','cauldron','cabinet','bed','piano'].includes(kind),
 outside:id==='three-crossed-broomsticks',
})));
